import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMode } from '@prisma/client';

export class CollectFeeDto {
  @ApiProperty({ example: '64da776a-79fc-4a39-af37-b42261614230' })
  @IsString()
  studentId!: string;

  @ApiProperty({ example: 6000 })
  @IsNumber()
  @Min(1)
  amountReceived!: number;

  @ApiProperty({ enum: PaymentMode, example: PaymentMode.CASH })
  @IsEnum(PaymentMode)
  paymentMode!: PaymentMode;

  @ApiPropertyOptional({ example: 'UPI/1234567890' })
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'CHQ-987654' })
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional({ example: '2026-07-30' })
  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @ApiPropertyOptional({ example: 'Payment received in full' })
  @IsOptional()
  @IsString()
  remarks?: string;
}
