import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ImportStatus, ImportRowStatus, Gender } from '@prisma/client';

export interface LegacyStudentImportRow {
  grNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  gradeName: string;
  sectionName: string;
  guardianName: string;
  guardianMobile: string;
  legacyId?: string;
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process legacy student import batch
   */
  async importLegacyStudents(rows: LegacyStudentImportRow[], createdById?: string) {
    const school = await this.prisma.school.findFirstOrThrow();
    const branch = await this.prisma.branch.findFirstOrThrow({ where: { schoolId: school.id } });
    const academicYear = await this.prisma.academicYear.findFirstOrThrow({
      where: { schoolId: school.id, isCurrent: true },
    });

    // Create Import Batch record
    const batch = await this.prisma.importBatch.create({
      data: {
        schoolId: school.id,
        branchId: branch.id,
        academicYearId: academicYear.id,
        importType: 'STUDENTS',
        fileName: 'legacy_vantage_students.xlsx',
        totalRows: rows.length,
        status: ImportStatus.PROCESSING,
        createdById,
      },
    });

    let validCount = 0;
    let failedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;
      const errors: string[] = [];

      // Row Validation
      if (!row.grNumber) errors.push('GR Number is required');
      if (!row.firstName) errors.push('First Name is required');
      if (!row.lastName) errors.push('Last Name is required');
      if (!row.guardianMobile) errors.push('Guardian Mobile is required');

      // Check duplicate GR
      if (row.grNumber) {
        const existing = await this.prisma.student.findUnique({ where: { grNumber: row.grNumber } });
        if (existing) errors.push(`GR Number ${row.grNumber} already exists in database`);
      }

      if (errors.length > 0) {
        failedCount++;
        await this.prisma.importRow.create({
          data: {
            batchId: batch.id,
            rowNumber: rowNum,
            sourceData: row as any,
            status: ImportRowStatus.ERROR,
            errors: { validationErrors: errors } as any,
          },
        });
      } else {
        // Valid row — Execute DB Creation
        try {
          const grade = await this.prisma.grade.findFirst({
            where: { schoolId: school.id, name: row.gradeName || 'Grade 1' },
          }) ?? await this.prisma.grade.findFirstOrThrow();

          const section = await this.prisma.section.findFirst({
            where: { gradeId: grade.id, name: row.sectionName || 'A' },
          }) ?? await this.prisma.section.findFirstOrThrow();

          const studentId = `MVHS-${new Date().getFullYear()}-${String(rowNum + 100).padStart(6, '0')}`;
          const admissionNumber = `ADM-${new Date().getFullYear()}-${String(rowNum + 100).padStart(4, '0')}`;

          await this.prisma.$transaction(async (tx: any) => {
            const student = await tx.student.create({
              data: {
                schoolId: school.id,
                studentId,
                grNumber: row.grNumber,
                admissionNumber,
                firstName: row.firstName,
                lastName: row.lastName,
                fullName: `${row.firstName} ${row.lastName}`,
                gender: (row.gender?.toUpperCase() === 'FEMALE' ? Gender.FEMALE : Gender.MALE),
                dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : new Date('2018-01-01'),
                legacyId: row.legacyId,
                createdById,
              },
            });

            const guardian = await tx.guardian.create({
              data: {
                schoolId: school.id,
                firstName: row.guardianName,
                relationship: 'PARENT',
                mobile: row.guardianMobile,
              },
            });

            await tx.studentGuardian.create({
              data: {
                studentId: student.id,
                guardianId: guardian.id,
                relationship: 'PARENT',
                isPrimary: true,
              },
            });

            await tx.studentEnrolment.create({
              data: {
                studentId: student.id,
                schoolId: school.id,
                branchId: branch.id,
                academicYearId: academicYear.id,
                departmentId: grade.departmentId,
                gradeId: grade.id,
                sectionId: section.id,
                admissionType: 'EXISTING',
                status: 'ACTIVE',
                startDate: new Date(),
                createdById,
              },
            });
          });

          validCount++;
          await this.prisma.importRow.create({
            data: {
              batchId: batch.id,
              rowNumber: rowNum,
              sourceData: row as any,
              status: ImportRowStatus.IMPORTED,
            },
          });
        } catch (err: any) {
          failedCount++;
          await this.prisma.importRow.create({
            data: {
              batchId: batch.id,
              rowNumber: rowNum,
              sourceData: row as any,
              status: ImportRowStatus.ERROR,
              errors: { exception: err.message } as any,
            },
          });
        }
      }
    }

    // Update Batch status
    const updatedBatch = await this.prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        validRows: validCount,
        failedRows: failedCount,
        status: failedCount === 0 ? ImportStatus.COMPLETED : ImportStatus.PARTIAL,
        completedAt: new Date(),
      },
    });

    this.logger.log(`Import batch ${batch.id} completed. Valid: ${validCount}, Failed: ${failedCount}`);

    return updatedBatch;
  }

  /**
   * Get all import batches
   */
  async getImportBatches() {
    return this.prisma.importBatch.findMany({
      include: {
        rows: { take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
