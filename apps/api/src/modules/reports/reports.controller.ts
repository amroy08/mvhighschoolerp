import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reports')
@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-collection')
  @ApiOperation({ summary: 'Daily cashier collection report' })
  async getDailyCollection(@Query('date') date?: string) {
    const data = await this.reportsService.getDailyCollection(date);
    return {
      success: true,
      data,
    };
  }

  @Get('defaulters')
  @ApiOperation({ summary: 'Defaulters list (students with overdue fees)' })
  async getDefaulters(@Query('gradeId') gradeId?: string) {
    const data = await this.reportsService.getDefaulters(gradeId);
    return {
      success: true,
      data,
    };
  }

  @Get('grade-summary')
  @ApiOperation({ summary: 'Grade-wise collection & demand summary' })
  async getGradeSummary() {
    const data = await this.reportsService.getGradeSummary();
    return {
      success: true,
      data,
    };
  }
}
