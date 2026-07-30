import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateFeeStructureDto,
  AssignFeeStructureDto,
  BulkAssignFeeStructureDto,
} from './dto/fee-structure.dto';
import Decimal from 'decimal.js';
import { FeeChargeStatus } from '@prisma/client';

@Injectable()
export class FeeStructuresService {
  private readonly logger = new Logger(FeeStructuresService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a Fee Structure Master with lines
   */
  async create(dto: CreateFeeStructureDto, createdById?: string) {
    const school = await this.prisma.school.findFirstOrThrow();
    const academicYear = await this.prisma.academicYear.findFirstOrThrow({
      where: { schoolId: school.id, isCurrent: true },
    });

    return this.prisma.feeStructure.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        name: dto.name,
        gradeId: dto.gradeId,
        departmentId: dto.departmentId,
        admissionCategory: dto.admissionCategory,
        studentType: dto.studentType,
        effectiveFrom: new Date(dto.effectiveFrom),
        createdById,
        lines: {
          create: dto.lines.map((line, idx) => ({
            feeHeadId: line.feeHeadId,
            amount: new Decimal(line.amount).toFixed(2),
            frequency: line.frequency,
            dueDateRule: line.dueDateRule,
            instalmentNumber: line.instalmentNumber ?? 1,
            isMandatory: line.isMandatory ?? true,
            sortOrder: idx + 1,
          })),
        },
      },
      include: {
        lines: {
          include: { feeHead: true },
        },
        grade: true,
        academicYear: true,
      },
    });
  }

  /**
   * List all fee structures
   */
  async findAll(gradeId?: string) {
    const where: any = {};
    if (gradeId) where.gradeId = gradeId;

    return this.prisma.feeStructure.findMany({
      where,
      include: {
        lines: {
          include: { feeHead: true },
          orderBy: { sortOrder: 'asc' },
        },
        grade: true,
        academicYear: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single fee structure by ID
   */
  async findOne(id: string) {
    const structure = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: {
        lines: {
          include: { feeHead: true },
          orderBy: { sortOrder: 'asc' },
        },
        grade: true,
        academicYear: true,
      },
    });

    if (!structure) {
      throw new NotFoundException({
        code: 'FEE_STRUCTURE_NOT_FOUND',
        message: `Fee Structure with ID ${id} not found`,
      });
    }

    return structure;
  }

  /**
   * Update fee structure master
   */
  async update(id: string, dto: Partial<CreateFeeStructureDto>) {
    const existing = await this.prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException({ code: 'FEE_STRUCTURE_NOT_FOUND', message: `Fee structure ${id} not found` });
    }

    if (dto.lines) {
      // Delete existing lines and recreate
      await this.prisma.feeStructureLine.deleteMany({ where: { feeStructureId: id } });
    }

    return this.prisma.feeStructure.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.gradeId ? { gradeId: dto.gradeId } : {}),
        ...(dto.admissionCategory ? { admissionCategory: dto.admissionCategory } : {}),
        ...(dto.lines
          ? {
              lines: {
                create: dto.lines.map((line, idx) => ({
                  feeHeadId: line.feeHeadId,
                  amount: new Decimal(line.amount).toFixed(2),
                  frequency: line.frequency,
                  dueDateRule: line.dueDateRule,
                  instalmentNumber: line.instalmentNumber ?? 1,
                  isMandatory: line.isMandatory ?? true,
                  sortOrder: idx + 1,
                })),
              },
            }
          : {}),
      },
      include: {
        lines: { include: { feeHead: true } },
        grade: true,
        academicYear: true,
      },
    });
  }

  /**
   * Assign fee structure to a student enrolment with IMMUTABILITY SNAPSHOT
   */
  async assignToStudent(structureId: string, studentId: string, assignedById?: string) {
    const structure = await this.findOne(structureId);

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrolments: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!student || student.enrolments.length === 0) {
      throw new NotFoundException({
        code: 'ACTIVE_ENROLMENT_NOT_FOUND',
        message: `No active enrolment found for student ${studentId}`,
      });
    }

    const enrolment = student.enrolments[0];

    // Check if already assigned
    const existing = await this.prisma.studentFeeAssignment.findUnique({
      where: {
        enrolmentId_feeStructureId: {
          enrolmentId: enrolment.id,
          feeStructureId: structure.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'FEE_STRUCTURE_ALREADY_ASSIGNED',
        message: `Fee structure '${structure.name}' is already assigned to this student`,
      });
    }

    // ─── IMMUTABILITY SNAPSHOT JSON ─────────────────────────────────
    // Build JSON snapshot of the entire structure and lines at assignment time
    const snapshotJson = {
      structureId: structure.id,
      structureName: structure.name,
      academicYearName: structure.academicYear.name,
      gradeName: structure.grade?.name ?? 'All Grades',
      assignedAt: new Date().toISOString(),
      lines: structure.lines.map((l: any) => ({
        lineId: l.id,
        feeHeadId: l.feeHeadId,
        feeHeadName: l.feeHead.name,
        feeHeadCode: l.feeHead.code,
        feeHeadCategory: l.feeHead.category,
        amount: l.amount.toString(),
        frequency: l.frequency,
        dueDateRule: l.dueDateRule,
      })),
    };

    // ─── Generate Fee Charges ──────────────────────────────────────
    const feeChargesToCreate: Array<{
      studentId: string;
      enrolmentId: string;
      feeHeadId: string;
      academicYearId: string;
      dueDate: Date;
      originalAmount: Decimal;
      concessionAmount: Decimal;
      lateFeeAmount: Decimal;
      adjustmentAmount: Decimal;
      netDue: Decimal;
      paidAmount: Decimal;
      outstandingAmount: Decimal;
      status: FeeChargeStatus;
    }> = [];

    const currentYear = new Date().getFullYear();

    for (const line of structure.lines) {
      const amount = new Decimal(line.amount.toString());

      if (line.frequency === 'MONTHLY') {
        // Generate 10 monthly charges for academic year (June to March)
        const months = [5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // June (month 5) to March (month 2 next year)
        months.forEach((m, index) => {
          const yearOffset = m < 5 ? 1 : 0;
          const dueDate = new Date(currentYear + yearOffset, m, 10);

          feeChargesToCreate.push({
            studentId: student.id,
            enrolmentId: enrolment.id,
            feeHeadId: line.feeHeadId,
            academicYearId: structure.academicYearId,
            dueDate,
            originalAmount: amount,
            concessionAmount: new Decimal(0),
            lateFeeAmount: new Decimal(0),
            adjustmentAmount: new Decimal(0),
            netDue: amount,
            paidAmount: new Decimal(0),
            outstandingAmount: amount,
            status: FeeChargeStatus.DUE,
          });
        });
      } else if (line.frequency === 'ANNUAL' || line.frequency === 'ONE_TIME') {
        // Single annual charge due at start of academic year (June 10)
        const dueDate = new Date(currentYear, 5, 10);
        feeChargesToCreate.push({
          studentId: student.id,
          enrolmentId: enrolment.id,
          feeHeadId: line.feeHeadId,
          academicYearId: structure.academicYearId,
          dueDate,
          originalAmount: amount,
          concessionAmount: new Decimal(0),
          lateFeeAmount: new Decimal(0),
          adjustmentAmount: new Decimal(0),
          netDue: amount,
          paidAmount: new Decimal(0),
          outstandingAmount: amount,
          status: FeeChargeStatus.DUE,
        });
      }
    }

    // ─── Execute inside transaction ────────────────────────────────
    return this.prisma.$transaction(async (tx: any) => {
      // 1. Create Student Fee Assignment Snapshot
      const assignment = await tx.studentFeeAssignment.create({
        data: {
          studentId: student.id,
          enrolmentId: enrolment.id,
          feeStructureId: structure.id,
          academicYearId: structure.academicYearId,
          structureSnapshot: snapshotJson as any,
          assignedById,
          assignedDate: new Date(),
        },
      });

      // 2. Bulk create generated Fee Charges
      for (const fc of feeChargesToCreate) {
        await tx.feeCharge.create({
          data: {
            ...fc,
            assignmentId: assignment.id,
            originalAmount: fc.originalAmount.toFixed(2),
            concessionAmount: fc.concessionAmount.toFixed(2),
            lateFeeAmount: fc.lateFeeAmount.toFixed(2),
            adjustmentAmount: fc.adjustmentAmount.toFixed(2),
            netDue: fc.netDue.toFixed(2),
            paidAmount: fc.paidAmount.toFixed(2),
            outstandingAmount: fc.outstandingAmount.toFixed(2),
          },
        });
      }

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: assignedById,
          schoolId: student.schoolId,
          action: 'FEE_STRUCTURE_ASSIGNED',
          module: 'fee_structures',
          recordId: assignment.id,
          afterValues: {
            studentName: student.fullName,
            structureName: structure.name,
            totalChargesGenerated: feeChargesToCreate.length,
          },
        },
      });

      this.logger.log(
        `Assigned fee structure '${structure.name}' to ${student.fullName}. Generated ${feeChargesToCreate.length} charges.`,
      );

      return {
        assignment,
        chargesCount: feeChargesToCreate.length,
        snapshot: snapshotJson,
      };
    });
  }

  /**
   * Bulk assign structure to all active students in a grade
   */
  async bulkAssignGrade(structureId: string, gradeId: string, assignedById?: string) {
    const enrolments = await this.prisma.studentEnrolment.findMany({
      where: { gradeId, status: 'ACTIVE' },
    });

    let assignedCount = 0;
    let skippedCount = 0;

    for (const enrolment of enrolments) {
      try {
        await this.assignToStudent(structureId, enrolment.studentId, assignedById);
        assignedCount++;
      } catch (err: any) {
        if (err?.response?.code === 'FEE_STRUCTURE_ALREADY_ASSIGNED') {
          skippedCount++;
        } else {
          throw err;
        }
      }
    }

    return {
      totalEnrolments: enrolments.length,
      assignedCount,
      skippedCount,
    };
  }
}
