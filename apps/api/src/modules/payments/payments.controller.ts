import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CollectFeeDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('collect')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Collect fee payment and generate gap-free receipt' })
  async collectFee(
    @Body() dto: CollectFeeDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.paymentsService.collectFee(dto, user.id);
    return {
      success: true,
      data,
      message: `Payment collected successfully. Receipt generated: ${data.receipt.receiptNumber}`,
    };
  }

  @Get('receipt/:id')
  @ApiOperation({ summary: 'Get details of a specific receipt' })
  async getReceipt(@Param('id') id: string) {
    const data = await this.paymentsService.getReceipt(id);
    return {
      success: true,
      data,
    };
  }

  @Get('student/:studentId/ledger')
  @ApiOperation({ summary: 'Get complete financial ledger for a student' })
  async getStudentLedger(@Param('studentId') studentId: string) {
    const data = await this.paymentsService.getStudentLedger(studentId);
    return {
      success: true,
      data,
    };
  }
}
