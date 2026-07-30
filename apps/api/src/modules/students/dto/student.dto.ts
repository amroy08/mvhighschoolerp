import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreateGuardianDto {
  @ApiProperty({ example: 'Ramesh' })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'FATHER' })
  @IsString()
  relationship!: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  mobile!: string;

  @ApiPropertyOptional({ example: 'ramesh@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'BUSINESS' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 'Mumbai, Maharashtra' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEmergencyContact?: boolean;
}

export class CreateStudentDto {
  @ApiProperty({ example: 'Aarav' })
  @IsString()
  firstName!: string;

  @ApiPropertyOptional({ example: 'Ramesh' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  lastName!: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: '2018-05-15' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiPropertyOptional({ example: 'B+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 'Hinduism' })
  @IsOptional()
  @IsString()
  religion?: string;

  @ApiPropertyOptional({ example: 'GENERAL' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  mobileStudent?: string;

  @ApiPropertyOptional({ example: 'aarav@example.com' })
  @IsOptional()
  @IsEmail()
  emailStudent?: string;

  @ApiPropertyOptional({ example: 'Flat 402, Sunshine Heights' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  addressCity?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  addressState?: string;

  @ApiPropertyOptional({ example: '400002' })
  @IsOptional()
  @IsString()
  addressPincode?: string;

  @ApiPropertyOptional({ example: '123456789012' })
  @IsOptional()
  @IsString()
  aadhaarNumber?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  transportRequired?: boolean;

  @ApiPropertyOptional({ example: 'Good academic record' })
  @IsOptional()
  @IsString()
  remarks?: string;

  // Enrolment details
  @ApiProperty({ example: '00000000-0000-0000-0002-000000000004' })
  @IsString()
  gradeId!: string;

  @ApiProperty({ example: '00000000-0000-0000-0003-000000000007' })
  @IsString()
  sectionId!: string;

  @ApiPropertyOptional({ example: '15' })
  @IsOptional()
  @IsString()
  rollNumber?: string;

  @ApiPropertyOptional({ example: 'NEW' })
  @IsOptional()
  @IsString()
  admissionType?: string;

  // Guardian
  @ApiProperty({ type: CreateGuardianDto })
  @ValidateNested()
  @Type(() => CreateGuardianDto)
  primaryGuardian!: CreateGuardianDto;
}

export class UpdateStudentDto {
  @ApiPropertyOptional({ example: 'Aarav' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: '2018-05-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  mobileStudent?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  currentStatus?: string;
}

export class QueryStudentDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'Sharma' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0002-000000000004' })
  @IsOptional()
  @IsString()
  gradeId?: string;

  @ApiPropertyOptional({ example: '00000000-0000-0000-0003-000000000007' })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}
