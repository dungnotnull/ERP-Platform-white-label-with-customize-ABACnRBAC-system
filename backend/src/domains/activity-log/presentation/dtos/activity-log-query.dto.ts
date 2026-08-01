import { IsOptional, IsNumberString, IsIn, IsISO8601, IsEnum, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityAction } from '@/domains/activity-log/domain/enums/activity-action.enum';

export class ActivityLogQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

 @ApiPropertyOptional({ default: 20, maximum: 20 })
  @IsOptional()
  @IsNumberString()
  @Matches(/^(?:[1-9]|[1-9][0-9]|20)$/, {
    message: 'limit for this query is 20 max',
  })
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ActivityAction })
  @IsOptional()
  @IsEnum(ActivityAction)
  action?: ActivityAction;

  @ApiPropertyOptional({ enum: ['POST', 'PUT', 'PATCH', 'DELETE'] })
  @IsOptional()
  @IsIn(['POST', 'PUT', 'PATCH', 'DELETE'])
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  userEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  statusCode?: number;

  @ApiPropertyOptional({ default: 'timestamp' })
  @IsOptional()
  @IsIn(['timestamp', 'action', 'method', 'statusCode', 'responseTimeMs'])
  sort?: string;

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: string;
}
