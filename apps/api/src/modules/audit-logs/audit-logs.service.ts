import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find paginated audit logs filtered by module & search action
   */
  async findAll(moduleName?: string, action?: string) {
    const where: any = {};
    if (moduleName) where.module = moduleName;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
