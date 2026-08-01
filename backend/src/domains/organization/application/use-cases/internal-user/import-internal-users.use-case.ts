import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '@/shared/application/use-case.interface';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DepartmentRepositoryPort } from '@/domains/organization/application/ports/repositories/department.repository.port';
import { PositionRepositoryPort } from '@/domains/organization/application/ports/repositories/position.repository.port';
import { DepartmentEntity } from '@/domains/organization/domain/entities/department.entity';
import { PositionEntity } from '@/domains/organization/domain/entities/position.entity';
import { InternalUserEntity } from '@/domains/organization/domain/entities/internal-user.entity';
import { DomainException } from '@/domains/organization/domain/exceptions/domain.exception';
import { ImportRowValidationException } from '@/domains/organization/domain/exceptions/import-row-validation.exception';
import { InternalUserUniquenessService } from '@/domains/organization/application/services/internal-user-uniqueness.service';
import { normalizeAndValidateEmployeeName } from '@/domains/organization/domain/validators/internal-user-name.validator';
import { normalizeAndValidateEmployeeEmail } from '@/domains/organization/domain/validators/internal-user-email.validator';
import {
  normalizeAndValidateDepartmentName,
  normalizeAndValidatePositionName,
} from '@/domains/organization/domain/validators/organization-name.validator';
import { resolveInternalUserErrorMessage } from '@/domains/organization/application/i18n/import-internal-user-error.messages';
import type { AppLocale } from '@/shared/infrastructure/i18n/parse-request-locale';

export interface ImportInternalUserRow {
  name: string;
  email: string;
  employeeCode: string;
  departmentCode?: string;
  departmentName?: string;
  positionLevel?: number;
  positionName?: string;
  isActive?: boolean;
  role?: string;
}

export interface ImportInternalUsersInput {
  data: ImportInternalUserRow[];
  locale?: AppLocale;
}

export interface ImportInternalUsersError {
  rowNumber: number;
  row: ImportInternalUserRow;
  error: string;
  errorCode?: string;
  params?: Record<string, string>;
}

export interface ImportInternalUsersOutput {
  imported: number;
  created: number;
  updated: number;
  failed: number;
  errors: ImportInternalUsersError[];
}

@Injectable()
export class ImportInternalUsersUseCase
  implements IUseCase<ImportInternalUsersInput, ImportInternalUsersOutput>
{
  constructor(
    @Inject('InternalUserRepositoryPort') private readonly internalUserRepository: InternalUserRepositoryPort,
    @Inject('DepartmentRepositoryPort') private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject('PositionRepositoryPort') private readonly positionRepository: PositionRepositoryPort,
    private readonly uniquenessService: InternalUserUniquenessService,
  ) {}

  async execute(input: ImportInternalUsersInput): Promise<ImportInternalUsersOutput> {
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: ImportInternalUsersError[] = [];
    const locale = input.locale ?? 'vi';

    for (let index = 0; index < input.data.length; index++) {
      const row = input.data[index];
      const rowNumber = index + 2;

      try {
        const wasUpdated = await this.importRow(row);
        if (wasUpdated) {
          updated += 1;
        } else {
          created += 1;
        }
      } catch (error) {
        failed += 1;
        const formatted = this.formatImportError(error, locale);
        errors.push({
          rowNumber,
          row,
          error: formatted.message,
          errorCode: formatted.errorCode,
          params: formatted.params,
        });
      }
    }

    return {
      imported: created + updated,
      created,
      updated,
      failed,
      errors,
    };
  }

  /**
   * Upsert theo email: user đang hoạt động (isDeleted=false) → cập nhật;
   * user đã xóa mềm cùng email → khôi phục + cập nhật; không có → tạo mới.
   * @returns true nếu cập nhật/khôi phục, false nếu tạo mới
   */
  private async importRow(row: ImportInternalUserRow): Promise<boolean> {
    const email = normalizeAndValidateEmployeeEmail(row.email, true);

    if (!row.employeeCode?.trim()) {
      throw new Error('employeeCode is required');
    }

    this.assertImportRowRequiredFields(row);

    const activeByEmail = await this.internalUserRepository.findActiveByEmail(email);
    if (activeByEmail) {
      await this.updateExistingByEmail(activeByEmail, row, email);
      return true;
    }

    const softDeletedByEmail = await this.internalUserRepository.findByEmail(email, {
      includeDeleted: true,
    });
    if (softDeletedByEmail?.isDeleted) {
      await this.updateExistingByEmail(softDeletedByEmail, row, email);
      return true;
    }

    await this.createNew(row, email);
    return false;
  }

  private async updateExistingByEmail(
    existing: InternalUserEntity,
    row: ImportInternalUserRow,
    email: string,
  ): Promise<void> {
    const departmentId = await this.resolveDepartmentId(row);
    const positionId = await this.resolvePositionId(row);

    const employeeCode = row.employeeCode?.trim()
      ? row.employeeCode.trim().toUpperCase()
      : existing.employeeCode;

    await this.uniquenessService.assertActiveEmployeeCodeAvailable(employeeCode, existing.id);

    const name =
      normalizeAndValidateEmployeeName(row.name, false) || existing.name;

    const wasDeleted = existing.isDeleted;
    const isActive =
      row.isActive !== undefined && row.isActive !== null
        ? row.isActive
        : wasDeleted
          ? true
          : existing.isActive;

    existing.update({
      name,
      email,
      employeeCode,
      departmentId,
      positionId,
      role: row.role?.trim() || existing.role,
      isActive,
      isDeleted: false,
    });

    await this.internalUserRepository.save(existing);
  }

  private async createNew(row: ImportInternalUserRow, email: string): Promise<void> {
    await this.uniquenessService.assertActiveEmailAvailable(email);

    const name = normalizeAndValidateEmployeeName(row.name, true);

    if (!row.employeeCode?.trim()) {
      throw new Error('employeeCode is required when creating a new employee');
    }

    const departmentId = await this.resolveDepartmentId(row);
    const positionId = await this.resolvePositionId(row);

    const employeeCode = row.employeeCode.trim().toUpperCase();
    await this.uniquenessService.assertActiveEmployeeCodeAvailable(employeeCode);

    const user = new InternalUserEntity('', {
      name,
      email,
      employeeCode,
      departmentId,
      positionId,
      isActive: row.isActive ?? true,
      isDeleted: false,
      role: row.role?.trim() ?? 'MEMBER',
      deviceSummary: { total: 0, activeAssignments: 0 },
    });

    await this.internalUserRepository.save(user);
  }

  private assertImportRowRequiredFields(row: ImportInternalUserRow): void {
    const missing: string[] = [];

    if (!row.departmentCode?.trim() && !row.departmentName?.trim()) {
      missing.push('department');
    }

    const hasPosition =
      (row.positionLevel !== undefined &&
        row.positionLevel !== null &&
        !Number.isNaN(row.positionLevel)) ||
      !!row.positionName?.trim();

    if (!hasPosition) {
      missing.push('position');
    }

    if (row.isActive === undefined || row.isActive === null) {
      missing.push('isActive');
    }

    if (missing.length > 0) {
      throw new ImportRowValidationException(
        `Missing required fields: ${missing.join(', ')}`,
        'IMPORT_MISSING_REQUIRED_FIELDS',
        { fields: missing.join(', ') },
      );
    }
  }

  private async resolveDepartmentId(row: ImportInternalUserRow): Promise<string> {
    const dept = await this.resolveDepartment(row.departmentCode, row.departmentName);
    return dept.id;
  }

  private async resolvePositionId(row: ImportInternalUserRow): Promise<string> {
    const pos = await this.resolvePosition(row.positionLevel, row.positionName);
    return pos.id;
  }

  private async resolveDepartment(code?: string, name?: string): Promise<DepartmentEntity> {
    const validatedName = name
      ? normalizeAndValidateDepartmentName(name, false)
      : '';
    const upperCode = code?.trim() ? code.trim().toUpperCase() : '';

    if (upperCode) {
      const byCode = await this.departmentRepository.findActiveByCode(upperCode);
      if (byCode) {
        return byCode;
      }
    }

    if (validatedName) {
      const byName = await this.departmentRepository.findActiveByName(validatedName);
      if (byName) {
        return byName;
      }
    }

    const label = upperCode || validatedName;
    if (!label) {
      throw new ImportRowValidationException(
        'Department code or name is required',
        'IMPORT_DEPARTMENT_REQUIRED',
      );
    }

    throw new ImportRowValidationException(
      `Department not found: ${label}`,
      'IMPORT_DEPARTMENT_NOT_FOUND',
      { department: label },
    );
  }

  private async resolvePosition(level?: number, name?: string): Promise<PositionEntity> {
    const validatedName = name
      ? normalizeAndValidatePositionName(name, false)
      : '';

    if (level !== undefined && !Number.isNaN(level)) {
      const byLevel = await this.positionRepository.findActiveByLevel(level);
      if (byLevel) {
        return byLevel;
      }
    }

    if (validatedName) {
      const byName = await this.positionRepository.findActiveByName(validatedName);
      if (byName) {
        return byName;
      }
    }

    const label =
      level !== undefined && !Number.isNaN(level)
        ? String(level)
        : validatedName;

    if (!label) {
      throw new ImportRowValidationException(
        'Position level or name is required',
        'IMPORT_POSITION_REQUIRED',
      );
    }

    throw new ImportRowValidationException(
      `Position not found: ${label}`,
      'IMPORT_POSITION_NOT_FOUND',
      { position: label },
    );
  }

  private formatImportError(
    error: unknown,
    locale: AppLocale,
  ): {
    message: string;
    errorCode?: string;
    params?: Record<string, string>;
  } {
    const resolved = this.resolveImportErrorDescriptor(error);

    return {
      message: resolveInternalUserErrorMessage(
        resolved.errorCode,
        resolved.params,
        locale,
      ),
      errorCode: resolved.errorCode,
      params: resolved.params,
    };
  }

  private resolveImportErrorDescriptor(error: unknown): {
    errorCode?: string;
    params?: Record<string, string>;
  } {
    if (error instanceof DomainException) {
      return {
        errorCode: error.errorCode,
        params: error.params,
      };
    }

    const raw =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Import failed';

    if (raw.includes('E11000') && raw.includes('employeeCode')) {
      const match = raw.match(/employeeCode:\s*"([^"]+)"/i);
      const employeeCode = match?.[1] ?? '';
      return {
        errorCode: 'EMPLOYEE_DUPLICATE_EMPLOYEE_CODE',
        params: { employeeCode },
      };
    }

    if (raw.includes('E11000') && raw.includes('email')) {
      const match = raw.match(/email:\s*"([^"]+)"/i);
      const email = match?.[1] ?? '';
      return {
        errorCode: 'EMPLOYEE_DUPLICATE_EMAIL',
        params: { email },
      };
    }

    if (raw.includes('Plan executor error') || raw.includes(':: caused by ::')) {
      const parts = raw.split(':: caused by ::');
      const last = parts[parts.length - 1]?.trim();
      if (last && !last.startsWith('Plan executor')) {
        return this.resolveImportErrorDescriptor(new Error(last));
      }
    }

    if (raw.includes('employeeCode is required')) {
      return { errorCode: 'EMPLOYEE_CODE_REQUIRED' };
    }

    if (raw.includes('name is required')) {
      return { errorCode: 'EMPLOYEE_NAME_REQUIRED' };
    }

    if (raw.includes('name must not exceed')) {
      return {
        errorCode: 'EMPLOYEE_NAME_TOO_LONG',
        params: { max: String(50) },
      };
    }

    if (raw.includes('Email is required')) {
      return { errorCode: 'EMPLOYEE_EMAIL_REQUIRED' };
    }

    if (raw.includes('Invalid email format')) {
      const match = raw.match(/Invalid email format:\s*"([^"]+)"/i);
      return {
        errorCode: 'EMPLOYEE_INVALID_EMAIL',
        params: { email: match?.[1]?.trim() ?? '' },
      };
    }

    if (raw.includes('Department not found')) {
      const match = raw.match(/Department not found:\s*(.+)/i);
      return {
        errorCode: 'IMPORT_DEPARTMENT_NOT_FOUND',
        params: { department: match?.[1]?.trim() ?? '' },
      };
    }

    if (raw.includes('Department code or name is required')) {
      return { errorCode: 'IMPORT_DEPARTMENT_REQUIRED' };
    }

    if (raw.includes('Position not found')) {
      const match = raw.match(/Position not found:\s*(.+)/i);
      return {
        errorCode: 'IMPORT_POSITION_NOT_FOUND',
        params: { position: match?.[1]?.trim() ?? '' },
      };
    }

    if (raw.includes('Position level or name is required')) {
      return { errorCode: 'IMPORT_POSITION_REQUIRED' };
    }

    return { errorCode: 'IMPORT_ROW_FAILED' };
  }
}
