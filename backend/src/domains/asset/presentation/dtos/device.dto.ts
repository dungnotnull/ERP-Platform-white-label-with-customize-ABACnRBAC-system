import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsMongoId,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SEARCH_KEYWORD_MAX_LENGTH } from "@/shared/constants/search.constant";

const Trim = () =>
  Transform(({ value }) => (typeof value === "string" ? value.trim() : value));

export class CreateDeviceDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() serialNumber: string;
  @ApiPropertyOptional() @IsString() @IsOptional() model?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() manufacturer?: string;
  @ApiProperty() @IsMongoId() @IsNotEmpty() deviceTypeId: string;
  @ApiProperty() @IsMongoId() @IsNotEmpty() deviceStatusId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() supplierId?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() purchaseDate?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  warrantyExpiryDate?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class UpdateDeviceDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() model?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() manufacturer?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() deviceTypeId?: string;
  @ApiPropertyOptional() @IsMongoId() @IsOptional() deviceStatusId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() supplierId?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() purchaseDate?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  warrantyExpiryDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class UpdateDeviceStatusDto {
  @ApiProperty() @IsString() @IsNotEmpty() deviceStatusId: string;
}

export class FindDeviceRequestsQueryDto {
  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(SEARCH_KEYWORD_MAX_LENGTH)
  search?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() type?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() userId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() requestedByUserId?: string;
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class FindDevicesDto {
  @ApiPropertyOptional()
  @Trim()
  @IsString()
  @IsOptional()
  @MaxLength(SEARCH_KEYWORD_MAX_LENGTH)
  search?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deviceTypeId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deviceStatusId?: string;
  @Transform(({ value }) => value === "true")
  @IsBoolean()
  @IsOptional()
  isDeleted?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiPropertyOptional({
    enum: ["asc", "desc"],
  })
  @IsString()
  @IsOptional()
  order?: "asc" | "desc";

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class AssignDeviceDto {
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiProperty() @IsString() @IsNotEmpty() userName: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deviceRequestId?: string;
}

export class ReturnDeviceDto {
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class CreateMaintenanceDto {
  @ApiProperty() @IsString() @IsNotEmpty() maintenanceType: string;
  @ApiProperty() @IsString() @IsNotEmpty() status: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() scheduledDate: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() cost?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

export class CreateDeviceRequestDto {
  @ApiProperty() @IsString() @IsNotEmpty() type: string;
  @ApiProperty() @IsString() @IsNotEmpty() userId: string;
  @ApiProperty() @IsString() @IsNotEmpty() reason: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class CreateDeviceTypeDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

export class UpdateDeviceTypeDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

export class CreateDeviceStatusDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

export class UpdateDeviceStatusDto2 {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}
