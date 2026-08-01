import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all academic years
   */
  async findAll() {
    return this.prisma.academicYear.findMany({
      orderBy: { startDate: 'asc' },
    });
  }
}
