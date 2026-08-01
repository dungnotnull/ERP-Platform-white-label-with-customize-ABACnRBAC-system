import { Inject, Injectable } from '@nestjs/common';
import { InternalUserRepositoryPort } from '@/domains/organization/application/ports/repositories/internal-user.repository.port';
import { DuplicateInternalUserEmailException } from '@/domains/organization/domain/exceptions/duplicate-internal-user-email.exception';
import { DuplicateInternalUserEmployeeCodeInUseException } from '@/domains/organization/domain/exceptions/duplicate-internal-user-employee-code.exception';
import { buildReleasedEmployeeCode } from '@/domains/organization/domain/utils/internal-user-employee-code.util';

/**
 * Kiểm tra trùng email / mã nhân viên chỉ với bản ghi isDeleted=false.
 */
@Injectable()
export class InternalUserUniquenessService {
  constructor(
    @Inject('InternalUserRepositoryPort')
    private readonly internalUserRepository: InternalUserRepositoryPort,
  ) {}

  async assertActiveEmailAvailable(
    email: string,
    exceptUserId?: string,
  ): Promise<void> {
    const owner = await this.internalUserRepository.findActiveByEmail(email);
    if (owner && owner.id !== exceptUserId) {
      throw new DuplicateInternalUserEmailException(email);
    }
  }

  async assertActiveEmployeeCodeAvailable(
    employeeCode: string,
    exceptUserId?: string,
  ): Promise<void> {
    await this.releaseEmployeeCodeFromSoftDeletedHolder(employeeCode, exceptUserId);

    const owner = await this.internalUserRepository.findByEmployeeCode(employeeCode);
    if (owner && owner.id !== exceptUserId) {
      throw new DuplicateInternalUserEmployeeCodeInUseException(
        employeeCode,
        owner.name,
        owner.email,
      );
    }
  }

  /**
   * Bản ghi đã xóa mềm vẫn có thể giữ mã NV cũ (index legacy hoặc chưa migrate).
   * Giải phóng mã trước khi gán cho user khác.
   */
  private async releaseEmployeeCodeFromSoftDeletedHolder(
    employeeCode: string,
    exceptUserId?: string,
  ): Promise<void> {
    const holder = await this.internalUserRepository.findByEmployeeCode(
      employeeCode,
      { includeDeleted: true },
    );

    if (!holder?.isDeleted || holder.id === exceptUserId) {
      return;
    }

    const releasedCode = buildReleasedEmployeeCode(holder.id, employeeCode);
    holder.update({ employeeCode: releasedCode });
    await this.internalUserRepository.save(holder);
  }
}
