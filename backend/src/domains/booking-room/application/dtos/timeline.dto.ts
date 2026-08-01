import { IsOptional, IsDateString, IsArray, IsString } from 'class-validator';

export class TimelineDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomIds?: string[];
}
