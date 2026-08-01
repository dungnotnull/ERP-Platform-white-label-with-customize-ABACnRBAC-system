import { Entity } from '@/shared/domain/entity.base';

export interface MeetingRoomProps {
  name: string;
  jpName: string;
  capacity: number;
  description: string;
  isActive: boolean;
}

export class MeetingRoomEntity extends Entity<MeetingRoomProps> {
  get name(): string {
    return this.props.name;
  }

  get jpName(): string {
    return this.props.jpName;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get description(): string {
    return this.props.description;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  private constructor(id: string, props: MeetingRoomProps) {
    super(id, props);
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  public update(fields: Partial<Omit<MeetingRoomProps, 'isActive'>>): void {
    if (fields.name !== undefined) {
      this.props.name = fields.name;
    }
    if (fields.jpName !== undefined) {
      this.props.jpName = fields.jpName;
    }
    if (fields.capacity !== undefined) {
      this.props.capacity = fields.capacity;
    }
    if (fields.description !== undefined) {
      this.props.description = fields.description;
    }
  }

  public toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this.props.name,
      jpName: this.props.jpName,
      capacity: this.props.capacity,
      description: this.props.description,
      isActive: this.props.isActive,
    };
  }

  public static create(id: string, props: MeetingRoomProps): MeetingRoomEntity {
    return new MeetingRoomEntity(id, props);
  }
}
