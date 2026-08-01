import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all grades with their sections, ordered by sortOrder
   */
  async findAll() {
    return this.prisma.grade.findMany({
      where: { isActive: true },
      include: {
        department: { select: { id: true, name: true, code: true } },
        sections: {
          where: { isActive: true },
          select: { id: true, name: true, capacity: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
