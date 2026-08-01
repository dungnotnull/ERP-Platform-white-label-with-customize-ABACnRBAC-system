import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export type ConditionOperator = 'equals' | 'notEquals' | 'in' | 'notIn' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'exists';
export type ConditionValueType = 'static' | 'template';

export class PolicyConditionDto {
  @ApiProperty({ description: 'Path to the field, e.g. resource.departmentId or user.userId' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ enum: ['equals', 'notEquals', 'in', 'notIn', 'contains', 'gt', 'lt', 'gte', 'lte', 'exists'] })
  @IsEnum(['equals', 'notEquals', 'in', 'notIn', 'contains', 'gt', 'lt', 'gte', 'lte', 'exists'])
  operator: ConditionOperator;

  @ApiPropertyOptional()
  value: any;

  @ApiProperty({ enum: ['static', 'template'] })
  @IsEnum(['static', 'template'])
  valueType: ConditionValueType;
}

export class CreateAbacPolicyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  roleIds?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ enum: ['create', 'read', 'update', 'delete', 'approve', 'export', 'import'] })
  @IsEnum(['create', 'read', 'update', 'delete', 'approve', 'export', 'import'])
  action: string;

  @ApiPropertyOptional({ enum: ['allow', 'deny'], default: 'allow' })
  @IsEnum(['allow', 'deny'])
  @IsOptional()
  effect?: 'allow' | 'deny';

  @ApiPropertyOptional({ type: [PolicyConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyConditionDto)
  @IsOptional()
  conditions?: PolicyConditionDto[];
}

export class UpdateAbacPolicyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  roleIds?: string[];

  @ApiPropertyOptional({ enum: ['allow', 'deny'] })
  @IsEnum(['allow', 'deny'])
  @IsOptional()
  effect?: 'allow' | 'deny';

  @ApiPropertyOptional({ type: [PolicyConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyConditionDto)
  @IsOptional()
  conditions?: PolicyConditionDto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
