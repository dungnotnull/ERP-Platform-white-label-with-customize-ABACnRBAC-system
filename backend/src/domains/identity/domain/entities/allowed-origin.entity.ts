import { Entity } from '@/shared/domain/entity.base';

export interface AllowedOriginProps {
  origin: string;
  isActive: boolean;
  description?: string;
}

export class AllowedOriginEntity extends Entity<AllowedOriginProps> {
  get origin(): string {
    return this.props.origin;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  constructor(id: string, props: AllowedOriginProps) {
    super(id, props);
  }
}
