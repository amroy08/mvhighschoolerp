import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeStructureLineDto {
  @ApiProperty({ example: '00000000-0000-0000-0004-000000000002' })
  @IsString()
  feeHeadId!: string;

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ example: 'MONTHLY' }) // ONE_TIME, MONTHLY, QUARTERLY, TERMLY, ANNUAL
  @IsString()
  frequency!: string;

  @ApiPropertyOptional({ example: '10th of each month' })
  @IsOptional()
  @IsString()
  dueDateRule?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  instalmentNumber?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;
}

export class CreateFeeStructureDto {
  @ApiProperty({ example: 'Grade 1 Standard Fee Structure 2026-27' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0002-000000000004' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0001-000000000002' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'GENERAL' })
  @IsOptional()
  @IsString()
  admissionCategory?: string;

  @ApiPropertyOptional({ example: 'NEW' })
  @IsOptional()
  @IsString()
  studentType?: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  effectiveFrom!: string;

  @ApiProperty({ type: [CreateFeeStructureLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFeeStructureLineDto)
  lines!: CreateFeeStructureLineDto[];
}

export class AssignFeeStructureDto {
  @ApiProperty({ example: '64da776a-79fc-4a39-af37-b42261614230' })
  @IsString()
  studentId!: string;
}

export class BulkAssignFeeStructureDto {
  @ApiProperty({ example: '00000000-0000-0000-0002-000000000004' })
  @IsString()
  gradeId!: string;
}
