import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeeStructuresService } from './fee-structures.service';
import {
  CreateFeeStructureDto,
  AssignFeeStructureDto,
  BulkAssignFeeStructureDto,
} from './dto/fee-structure.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('fee-structures')
@Controller({ path: 'fee-structures', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new Fee Structure Master with line items' })
  async create(
    @Body() dto: CreateFeeStructureDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.feeStructuresService.create(dto, user.id);
    return {
      success: true,
      data,
      message: 'Fee structure master created successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List fee structures filtered by grade' })
  async findAll(@Query('gradeId') gradeId?: string) {
    const data = await this.feeStructuresService.findAll(gradeId);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single fee structure master details with lines' })
  async findOne(@Param('id') id: string) {
    const data = await this.feeStructuresService.findOne(id);
    return {
      success: true,
      data,
    };
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing Fee Structure Master with line items' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFeeStructureDto>,
  ) {
    const data = await this.feeStructuresService.update(id, dto);
    return {
      success: true,
      data,
      message: 'Fee structure master updated successfully',
    };
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign fee structure to a student with snapshot' })
  async assignToStudent(
    @Param('id') id: string,
    @Body() dto: AssignFeeStructureDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.feeStructuresService.assignToStudent(
      id,
      dto.studentId,
      user.id,
    );
    return {
      success: true,
      data,
      message: 'Fee structure assigned to student successfully',
    };
  }

  @Post(':id/bulk-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk assign fee structure to all students in a grade' })
  async bulkAssignGrade(
    @Param('id') id: string,
    @Body() dto: BulkAssignFeeStructureDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.feeStructuresService.bulkAssignGrade(
      id,
      dto.gradeId,
      user.id,
    );
    return {
      success: true,
      data,
      message: `Bulk assigned to ${data.assignedCount} students (${data.skippedCount} already assigned)`,
    };
  }
}
