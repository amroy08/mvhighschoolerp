import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('grades')
@Controller({ path: 'grades', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'List all grades with sections' })
  async findAll() {
    const data = await this.gradesService.findAll();
    return { success: true, data };
  }
}
