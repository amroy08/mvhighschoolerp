import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Decimal from 'decimal.js';
import { FeeChargeStatus, PromotionAction } from '@prisma/client';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Preview promotion candidates and their carry-over arrear balances
   */
  async preview(gradeId: string) {
    const enrolments = await this.prisma.studentEnrolment.findMany({
      where: { gradeId, status: 'ACTIVE' },
      include: {
        student: { select: { id: true, fullName: true, grNumber: true, studentId: true } },
        grade: true,
        section: true,
      },
    });

    const items = [];

    for (const enrolment of enrolments) {
      const outstandingCharges = await this.prisma.feeCharge.findMany({
        where: {
          studentId: enrolment.studentId,
          status: { in: [FeeChargeStatus.DUE, FeeChargeStatus.PARTIALLY_PAID, FeeChargeStatus.OVERDUE] },
        },
      });

      const arrearTotal = outstandingCharges.reduce(
        (sum, c) => sum.plus(new Decimal(c.outstandingAmount.toString())),
        new Decimal(0),
      );

      items.push({
        studentId: enrolment.student.id,
        fullName: enrolment.student.fullName,
        grNumber: enrolment.student.grNumber,
        currentGrade: enrolment.grade.name,
        currentSection: enrolment.section.name,
        arrearAmount: arrearTotal.toFixed(2),
        suggestedAction: 'PROMOTE',
      });
    }

    return {
      gradeId,
      totalCandidates: items.length,
      candidates: items,
    };
  }

  /**
   * Execute batch promotion with arrear carry-over logic
   */
  async batchPromote(
    fromAcademicYearId: string,
    toAcademicYearId: string,
    fromGradeId: string,
    toGradeId: string,
    toSectionId: string,
    createdById?: string,
  ) {
    const school = await this.prisma.school.findFirstOrThrow();
    const branch = await this.prisma.branch.findFirstOrThrow({ where: { schoolId: school.id } });

    const fromAY = await this.prisma.academicYear.findUniqueOrThrow({ where: { id: fromAcademicYearId } });
    const targetGrade = await this.prisma.grade.findUniqueOrThrow({ where: { id: toGradeId } });
    const targetSection = await this.prisma.section.findUniqueOrThrow({ where: { id: toSectionId } });

    const activeEnrolments = await this.prisma.studentEnrolment.findMany({
      where: {
        gradeId: fromGradeId,
        academicYearId: fromAcademicYearId,
        status: 'ACTIVE',
      },
      include: { student: true },
    });

    if (activeEnrolments.length === 0) {
      throw new BadRequestException({
        code: 'NO_STUDENTS_TO_PROMOTE',
        message: 'No active student enrolments found for the selected grade and academic year',
      });
    }

    // Arrear fee head
    const arrearFeeHead = await this.prisma.feeHead.findFirstOrThrow({
      where: { schoolId: school.id, code: 'ARREAR' },
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Promotion Batch Header
      const batch = await tx.promotionBatch.create({
        data: {
          schoolId: school.id,
          branchId: branch.id,
          fromAcademicYearId,
          toAcademicYearId,
          status: 'COMPLETED',
          createdById,
          completedAt: new Date(),
        },
      });

      let promotedCount = 0;

      for (const oldEnrolment of activeEnrolments) {
        // Calculate arrear balance
        const outstandingCharges = await tx.feeCharge.findMany({
          where: {
            studentId: oldEnrolment.studentId,
            status: { in: [FeeChargeStatus.DUE, FeeChargeStatus.PARTIALLY_PAID, FeeChargeStatus.OVERDUE] },
          },
        });

        const arrearTotal = outstandingCharges.reduce(
          (sum, c) => sum.plus(new Decimal(c.outstandingAmount.toString())),
          new Decimal(0),
        );

        // Mark old enrolment as COMPLETED
        await tx.studentEnrolment.update({
          where: { id: oldEnrolment.id },
          data: { status: 'COMPLETED', endDate: new Date() },
        });

        // Create new Enrolment in target grade & new academic year
        const newEnrolment = await tx.studentEnrolment.create({
          data: {
            studentId: oldEnrolment.studentId,
            schoolId: school.id,
            branchId: branch.id,
            academicYearId: toAcademicYearId,
            departmentId: targetGrade.departmentId,
            gradeId: targetGrade.id,
            sectionId: targetSection.id,
            promotionBatchId: batch.id,
            admissionType: 'EXISTING',
            status: 'ACTIVE',
            startDate: new Date(),
            createdById,
          },
        });

        // ─── ARREAR CARRY-OVER FEE CHARGE ─────────────────────────
        if (arrearTotal.greaterThan(0)) {
          await tx.feeCharge.create({
            data: {
              studentId: oldEnrolment.studentId,
              enrolmentId: newEnrolment.id,
              feeHeadId: arrearFeeHead.id,
              academicYearId: toAcademicYearId,
              dueDate: new Date(),
              originalAmount: arrearTotal.toFixed(2),
              concessionAmount: '0.00',
              lateFeeAmount: '0.00',
              adjustmentAmount: '0.00',
              netDue: arrearTotal.toFixed(2),
              paidAmount: '0.00',
              outstandingAmount: arrearTotal.toFixed(2),
              status: FeeChargeStatus.DUE,
              sourceYear: fromAY.name,
            },
          });
        }

        // Add Promotion Batch Item
        await tx.promotionBatchItem.create({
          data: {
            batchId: batch.id,
            studentId: oldEnrolment.studentId,
            fromEnrolmentId: oldEnrolment.id,
            toEnrolmentId: newEnrolment.id,
            action: PromotionAction.PROMOTE,
            arrearAmount: arrearTotal.toFixed(2),
            status: 'COMPLETED',
          },
        });

        promotedCount++;
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: createdById,
          schoolId: school.id,
          branchId: branch.id,
          action: 'BATCH_PROMOTION_COMPLETED',
          module: 'promotions',
          recordId: batch.id,
          afterValues: {
            promotedCount,
            targetGradeName: targetGrade.name,
            targetSectionName: targetSection.name,
          },
        },
      });

      this.logger.log(`Batch promoted ${promotedCount} students to ${targetGrade.name}-${targetSection.name}`);

      return {
        batchId: batch.id,
        promotedCount,
        targetGrade: targetGrade.name,
        targetSection: targetSection.name,
      };
    });
  }
}
