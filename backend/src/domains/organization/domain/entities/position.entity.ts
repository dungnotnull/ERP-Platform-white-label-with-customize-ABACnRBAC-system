import { Entity } from '@/shared/domain/entity.base';

export interface PositionProps {
  nameVi: string;
  nameJa: string;
  level: number | null;
  isDeleted: boolean;
}

export class PositionEntity extends Entity<PositionProps> {
  get nameVi(): string {
    return this.props.nameVi;
  }

  get nameJa(): string {
    return this.props.nameJa;
  }

  get level(): number | null {
    return this.props.level;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  constructor(id: string, props: PositionProps) {
    super(id, props);
  }

  public softDelete(): void {
    this.props.isDeleted = true;
  }

  public update(
    props: Partial<
      Pick<PositionProps, 'nameVi' | 'nameJa' | 'level' | 'isDeleted'>
    >,
  ): void {
    if (props.nameVi !== undefined) {
      this.props.nameVi = props.nameVi;
    }
    if (props.nameJa !== undefined) {
      this.props.nameJa = props.nameJa;
    }
    if (props.level !== undefined) {
      this.props.level = props.level;
    }
    if (props.isDeleted !== undefined) {
      this.props.isDeleted = props.isDeleted;
    }
  }
}
