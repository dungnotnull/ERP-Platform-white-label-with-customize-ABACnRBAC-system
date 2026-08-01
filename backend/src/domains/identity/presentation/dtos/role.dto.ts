import { IsOptional, IsString, IsArray, IsNotEmpty, IsBoolean, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departmentIds?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  departmentIds?: string[];
}

export class DeleteRoleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  secretKey: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? true)
  forceHard: boolean = true;
}

export class GetRolesByDepartmentsDto {
  @ApiProperty({ type: [String], isArray: true })
  @IsArray()
  @ArrayNotEmpty({ message: 'departmentIds must be not empty' })
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.filter(v => v != null);

    if (typeof value === 'string') {

      return value.includes(',') ? value.split(',').map(v => v.trim()) : [value];
    }

    return [];
  })
  departmentIds: string[];
}
