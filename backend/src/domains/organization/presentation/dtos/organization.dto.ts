import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  MaxLength,
  MinLength,
  Matches,
  IsEmail,
  IsIn,
  IsInt,
} from 'class-validator';
import { Type, Transform  } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SEARCH_KEYWORD_MAX_LENGTH } from '@/shared/constants/search.constant';

export const INTERNAL_USER_NAME_MAX_LENGTH = 50;
export const ORGANIZATION_NAME_MAX_LENGTH = 100;

export const Trim = () => Transform(({ value }) =>
  typeof value === 'string' ? value.trim() : value,
);

export class CreateDepartmentDto {
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameVi: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameJa?: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() description?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameVi?: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameJa?: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() description?: string;
}

export class CreatePositionDto {
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameVi: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameJa?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() level?: number;
}

export class UpdatePositionDto {
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameVi?: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(ORGANIZATION_NAME_MAX_LENGTH) nameJa?: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() level?: number;
}

export class CreateInternalUserDto {
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() @MaxLength(INTERNAL_USER_NAME_MAX_LENGTH) name: string;
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() @IsEmail() email: string;
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() employeeCode: string;
  @ApiProperty() @IsString() @IsNotEmpty() departmentId: string;
  @ApiProperty() @IsString() @IsNotEmpty() positionId: string;

  @ApiPropertyOptional() @IsString() @IsOptional() role?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() isActive?: string;
}

export class UpdateInternalUserDto {
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(INTERNAL_USER_NAME_MAX_LENGTH) name?: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() employeeCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() departmentId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() positionId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() role?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() isActive?: string;
}

export class FindSuppliersQueryDto {
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(SEARCH_KEYWORD_MAX_LENGTH) search?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sort?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
  @ApiPropertyOptional() @IsString() @IsOptional() page?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() limit?: string;
}

export class FindInternalUsersDto {
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(SEARCH_KEYWORD_MAX_LENGTH) search?: string;
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(SEARCH_KEYWORD_MAX_LENGTH) q?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() departmentId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() department?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() positionId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() position?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() isActive?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() sort?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() @IsIn(['asc', 'desc']) order?: 'asc' | 'desc';
  @ApiPropertyOptional() @IsString() @IsOptional() page?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() limit?: string;
}

export class CreateSupplierDto {
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() @MinLength(2) name: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @ApiPropertyOptional() @IsString() @IsNotEmpty() @Matches(/^(0|\+84)[0-9]{9,10}$/, {
    message: 'Invalid phone number',
  }) phone?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @Trim()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional() @Transform(({ value }) => value === '' ? undefined : value) @IsString() @IsOptional() website?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional() @Trim() @IsString() @IsOptional() @MaxLength(INTERNAL_USER_NAME_MAX_LENGTH) @MinLength(2) name?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional() @IsString() @IsNotEmpty() @Matches(/^(0|\+84)[0-9]{9,10}$/, {
    message: 'Invalid phone number',
  }) phone?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsString()
  @IsOptional()
  website?: string;
  
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class PurchaseOrderItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() deviceTypeId: string;
  @ApiProperty() @Trim() @IsString() @IsNotEmpty() deviceName: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(1) quantity: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) unitPrice: number;
}

export class CreatePurchaseOrderDto {
  @ApiPropertyOptional() @IsString() @IsOptional() invoiceNumber?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiProperty() @IsArray() @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class UpdatePurchaseOrderDto {
  @ApiPropertyOptional() @IsString() @IsOptional() invoiceNumber?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsArray() @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items?: PurchaseOrderItemDto[];
}
