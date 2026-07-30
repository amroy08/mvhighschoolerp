import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImportsService, LegacyStudentImportRow } from './imports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('imports')
@Controller({ path: 'imports', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('batches')
  @ApiOperation({ summary: 'Get legacy data import batch history' })
  async getImportBatches() {
    const data = await this.importsService.getImportBatches();
    return {
      success: true,
      data,
    };
  }

  @Post('excel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import legacy student records from Excel data' })
  async importLegacyStudents(
    @Body() body: { rows: LegacyStudentImportRow[] },
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.importsService.importLegacyStudents(body.rows, user.id);
    return {
      success: true,
      data,
      message: `Import processed. ${data.validRows} rows imported, ${data.failedRows} failed`,
    };
  }
}
