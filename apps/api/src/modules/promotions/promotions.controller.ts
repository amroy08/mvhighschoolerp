import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('promotions')
@Controller({ path: 'promotions', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('preview')
  @ApiOperation({ summary: 'Preview promotion candidates and arrear carry-overs' })
  async preview(@Query('gradeId') gradeId: string) {
    const data = await this.promotionsService.preview(gradeId);
    return {
      success: true,
      data,
    };
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute batch student promotion with arrear carry-over' })
  async batchPromote(
    @Body()
    body: {
      fromAcademicYearId: string;
      toAcademicYearId: string;
      fromGradeId: string;
      toGradeId: string;
      toSectionId: string;
    },
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.promotionsService.batchPromote(
      body.fromAcademicYearId,
      body.toAcademicYearId,
      body.fromGradeId,
      body.toGradeId,
      body.toSectionId,
      user.id,
    );
    return {
      success: true,
      data,
      message: `Batch promoted ${data.promotedCount} students successfully`,
    };
  }
}
