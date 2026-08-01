import { IsEnum, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateEndpointPermissionDto {
  @ApiProperty()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  method: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pathPattern: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  module: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  permission: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateEndpointPermissionDto {
  @ApiPropertyOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  @IsOptional()
  method?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pathPattern?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  module?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  permission?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class DeleteEndpointPermissionDto {
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
