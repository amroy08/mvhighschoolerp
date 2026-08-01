import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicYearsService } from './academic-years.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('academic-years')
@Controller({ path: 'academic-years', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  @ApiOperation({ summary: 'List all academic years' })
  async findAll() {
    const data = await this.academicYearsService.findAll();
    return { success: true, data };
  }
}
