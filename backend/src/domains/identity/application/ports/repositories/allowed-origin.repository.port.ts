import { AllowedOriginEntity } from '@/domains/identity/domain/entities/allowed-origin.entity';

export interface AllowedOriginRepositoryPort {
  findByOrigin(origin: string): Promise<AllowedOriginEntity | null>;
  findActive(): Promise<AllowedOriginEntity[]>;
}
