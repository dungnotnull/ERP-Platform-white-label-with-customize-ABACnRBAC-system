import { Inject, Injectable } from '@nestjs/common';
import { InternalUserCheckingPort } from '@/domains/asset/application/ports/services/internal-user-checking.port';
import { InternalUserRepositoryPort } from '@/domains/identity/application/ports/repositories/internal-user.repository.port';

@Injectable()
export class InternalUserCheckingAdapter
  implements InternalUserCheckingPort
{
  constructor(
    @Inject('InternalUserRepositoryPort')
    private readonly internalUserRepository: InternalUserRepositoryPort,
  ) {}

  async ensureUserExists(userId: string): Promise<void> {
    const user = await this.internalUserRepository.findById(userId);

    if (!user) {
      throw new Error(`Internal user with id ${userId} not found`);
    }
  }

  async getUserDetails(userId: string): Promise<{ name: string }> {
    const user = await this.internalUserRepository.findById(userId);

    if (!user) {
      throw new Error(`Internal user with id ${userId} not found`);
    }

    return {
      name: user.name,
    };
  }
}