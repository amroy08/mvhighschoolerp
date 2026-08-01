import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto/student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('students')
@Controller({ path: 'students', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new student admission' })
  async create(
    @Body() dto: CreateStudentDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.studentsService.create(dto, user.id);
    return {
      success: true,
      data,
      message: 'Student admitted successfully',
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Purge all students' })
  async purge() {
    return this.studentsService.purge();
  }

  @Get()
  @ApiOperation({ summary: 'List and filter students' })
  async findAll(@Query() query: QueryStudentDto) {
    const result = await this.studentsService.findAll(query);
    return {
      success: true,
      data: result.items,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed student profile by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.studentsService.findOne(id);
    return {
      success: true,
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update student demographic details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.studentsService.update(id, dto, user.id);
    return {
      success: true,
      data,
      message: 'Student profile updated successfully',
    };
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload/save student document in database' })
  async addDocument(
    @Param('id') id: string,
    @Body() body: { documentType: string; fileName: string },
  ) {
    const data = await this.studentsService.addDocument(id, body.documentType, body.fileName);
    return {
      success: true,
      data,
      message: 'Student document saved successfully',
    };
  }

  @Delete(':id/documents/:docId')
  @ApiOperation({ summary: 'Delete student document from database' })
  async deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
  ) {
    const data = await this.studentsService.deleteDocument(id, docId);
    return {
      success: true,
      data,
      message: 'Student document deleted successfully',
    };
  }
}

