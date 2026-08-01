import { Entity } from '@/shared/domain/entity.base';

export interface DeviceTypeProps {
  name: string;
  description: string;
  isActive: boolean;
}

export class DeviceTypeEntity extends Entity<DeviceTypeProps> {
  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  private constructor(id: string, props: DeviceTypeProps) {
    super(id, props);
  }

  public update(fields: Partial<Pick<DeviceTypeProps, 'name' | 'description' | 'isActive'>>): void {
    const allowedFields = ['name', 'description', 'isActive'] as const;

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        (this.props as unknown as Record<string, unknown>)[field] = fields[field];
      }
    }
  }

  public toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this.props.name,
      description: this.props.description,
      isActive: this.props.isActive,
    };
  }

  public static create(id: string, props: DeviceTypeProps): DeviceTypeEntity {
    return new DeviceTypeEntity(id, props);
  }
}
