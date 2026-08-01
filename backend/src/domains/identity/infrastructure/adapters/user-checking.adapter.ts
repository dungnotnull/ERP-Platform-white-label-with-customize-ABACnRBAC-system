import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryPort } from '@/domains/identity/application/ports/repositories/user.repository.port';
import { UserCheckingPort } from '@/domains/asset/application/ports/services/user-checking.port';

@Injectable()
export class UserCheckingAdapter implements UserCheckingPort {
  constructor(
    @Inject('UserRepositoryPort') private readonly userRepository: UserRepositoryPort,
  ) {}

  async ensureUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
  }

  async getUserDetails(userId: string): Promise<{ name: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return { name: user.name };
  }
}
