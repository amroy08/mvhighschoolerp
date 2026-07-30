import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto/student.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Create student with atomic enrolment and primary guardian
   */
  async create(dto: CreateStudentDto, createdById?: string) {
    // 1. Get current school & branch & academic year
    const school = await this.prisma.school.findFirstOrThrow();
    const branch = await this.prisma.branch.findFirstOrThrow({ where: { schoolId: school.id } });
    const academicYear = await this.prisma.academicYear.findFirstOrThrow({
      where: { schoolId: school.id, isCurrent: true },
    });

    // 2. Check grade & section belong to school
    const grade = await this.prisma.grade.findUniqueOrThrow({ where: { id: dto.gradeId } });
    const section = await this.prisma.section.findUniqueOrThrow({ where: { id: dto.sectionId } });

    // 3. Generate sequential identifiers
    const count = await this.prisma.student.count({ where: { schoolId: school.id } });
    const seqNum = count + 1;
    const yearStr = new Date().getFullYear().toString();
    const studentId = `MVHS-${yearStr}-${String(seqNum).padStart(6, '0')}`;
    const grNumber = `GR-${String(1000 + seqNum).padStart(6, '0')}`;
    const admissionNumber = `ADM-${yearStr}-${String(seqNum).padStart(4, '0')}`;

    // 4. Handle Aadhaar encryption
    let aadhaarEncrypted: string | undefined;
    let aadhaarLast4: string | undefined;
    if (dto.aadhaarNumber) {
      aadhaarEncrypted = this.encryption.encrypt(dto.aadhaarNumber);
      aadhaarLast4 = this.encryption.getLast4(dto.aadhaarNumber);
    }

    const fullName = `${dto.firstName} ${dto.middleName ? dto.middleName + ' ' : ''}${dto.lastName}`;

    // 5. Execute inside a transaction
    return this.prisma.$transaction(async (tx) => {
      // Create Student
      const student = await tx.student.create({
        data: {
          schoolId: school.id,
          studentId,
          grNumber,
          admissionNumber,
          firstName: dto.firstName,
          middleName: dto.middleName,
          lastName: dto.lastName,
          fullName,
          gender: dto.gender,
          dateOfBirth: new Date(dto.dateOfBirth),
          bloodGroup: dto.bloodGroup,
          religion: dto.religion,
          category: dto.category,
          mobileStudent: dto.mobileStudent,
          emailStudent: dto.emailStudent,
          addressLine1: dto.addressLine1,
          addressCity: dto.addressCity,
          addressState: dto.addressState,
          addressPincode: dto.addressPincode,
          aadhaarEncrypted,
          aadhaarLast4,
          transportRequired: dto.transportRequired ?? false,
          remarks: dto.remarks,
          createdById,
        },
      });

      // Create Guardian
      const guardian = await tx.guardian.create({
        data: {
          schoolId: school.id,
          firstName: dto.primaryGuardian.firstName,
          lastName: dto.primaryGuardian.lastName,
          relationship: dto.primaryGuardian.relationship,
          mobile: dto.primaryGuardian.mobile,
          email: dto.primaryGuardian.email,
          occupation: dto.primaryGuardian.occupation,
          address: dto.primaryGuardian.address,
        },
      });

      // Link Student to Guardian
      await tx.studentGuardian.create({
        data: {
          studentId: student.id,
          guardianId: guardian.id,
          relationship: dto.primaryGuardian.relationship,
          isPrimary: true,
        },
      });

      // Create Student Enrolment
      const enrolment = await tx.studentEnrolment.create({
        data: {
          studentId: student.id,
          schoolId: school.id,
          branchId: branch.id,
          academicYearId: academicYear.id,
          departmentId: grade.departmentId,
          gradeId: grade.id,
          sectionId: section.id,
          rollNumber: dto.rollNumber,
          admissionType: dto.admissionType ?? 'NEW',
          startDate: new Date(),
          createdById,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: createdById,
          schoolId: school.id,
          branchId: branch.id,
          action: 'STUDENT_ADMITTED',
          module: 'students',
          recordId: student.id,
          afterValues: {
            studentId,
            grNumber,
            fullName,
            gradeName: grade.name,
            sectionName: section.name,
          },
        },
      });

      this.logger.log(`Admitted student ${fullName} (${studentId}) to ${grade.name}-${section.name}`);

      return {
        ...student,
        enrolment,
        primaryGuardian: guardian,
      };
    });
  }

  /**
   * Find paginated students list
   */
  async findAll(query: QueryStudentDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};

    if (query.status) {
      where.currentStatus = query.status;
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { grNumber: { contains: query.search, mode: 'insensitive' } },
        { studentId: { contains: query.search, mode: 'insensitive' } },
        { admissionNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.gradeId || query.sectionId) {
      where.enrolments = {
        some: {
          ...(query.gradeId ? { gradeId: query.gradeId } : {}),
          ...(query.sectionId ? { sectionId: query.sectionId } : {}),
          status: 'ACTIVE',
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enrolments: {
            where: { status: 'ACTIVE' },
            include: { grade: true, section: true, department: true },
            take: 1,
          },
          studentGuardians: {
            where: { isPrimary: true },
            include: { guardian: true },
            take: 1,
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find detailed student profile by ID
   */
  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        enrolments: {
          include: {
            grade: true,
            section: true,
            department: true,
            academicYear: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        studentGuardians: {
          include: { guardian: true },
        },
        documents: {
          include: { documentType: true },
        },
        feeCharges: {
          take: 10,
          orderBy: { dueDate: 'asc' },
          include: { feeHead: true },
        },
      },
    });

    if (!student) {
      throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: `Student with ID ${id} not found` });
    }

    return student;
  }

  /**
   * Update student details
   */
  async update(id: string, dto: UpdateStudentDto, updatedById?: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: `Student with ID ${id} not found` });
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        updatedById,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updatedById,
        schoolId: student.schoolId,
        action: 'STUDENT_UPDATED',
        module: 'students',
        recordId: id,
        beforeValues: student,
        afterValues: updated,
      },
    });

    return updated;
  }

  /**
   * Purge all student records from database
   */
  async purge() {
    this.logger.log('Executing database students purge...');
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE payments CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE student_enrolments CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE student_guardians CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE guardians CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE student_documents CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE student_fee_assignments CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE fee_charges CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE concessions CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE promotion_batch_items CASCADE;`);
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE students CASCADE;`);
    return { success: true, message: 'All student data successfully deleted' };
  }
}

