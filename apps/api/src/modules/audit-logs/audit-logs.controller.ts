import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('audit-logs')
@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and query append-only security audit trail' })
  async findAll(
    @Query('module') moduleName?: string,
    @Query('action') action?: string,
  ) {
    const data = await this.auditLogsService.findAll(moduleName, action);
    return {
      success: true,
      data,
    };
  }
}
