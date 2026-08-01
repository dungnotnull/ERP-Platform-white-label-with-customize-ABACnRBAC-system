import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BookingStatus } from '@/domains/booking-room/domain/enums/booking-status.enum';

export class CreateBookingDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roomIds: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsArray()
  @IsString({ each: true })
  departmentIds: string[];

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  jpTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  jpNote?: string;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  jpTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  jpNote?: string;

  @IsInt()
  @Min(0)
  expectedVersion: number;
}

export class FindBookingsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];

  @IsOptional()
  @IsString()
  status?: BookingStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}


export class FindTimelineDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  roomIds?: string;

  @IsOptional()
  @IsString()
  departmentIds?: string;

  @IsOptional()
  @IsString()
  participantIds?: string;

  @IsOptional()
  @IsString()
  conflictedUsers?: string;

  @IsOptional()
  @IsString()
  creatorId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class DeleteBookingDto {
  @IsInt()
  @Min(0)
  expectedVersion: number;
}
