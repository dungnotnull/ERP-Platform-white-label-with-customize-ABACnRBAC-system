import { Entity } from '@/shared/domain/entity.base';

export interface DepartmentProps {
  code: string;
  nameVi: string;
  nameJa: string;
  description: string;
  isDeleted: boolean;
}

export class DepartmentEntity extends Entity<DepartmentProps> {
  get code(): string {
    return this.props.code;
  }

  get nameVi(): string {
    return this.props.nameVi;
  }

  get nameJa(): string {
    return this.props.nameJa;
  }

  get description(): string {
    return this.props.description;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  constructor(id: string, props: DepartmentProps) {
    super(id, props);
  }

  public softDelete(): void {
    this.props.isDeleted = true;
  }

  public update(
    props: Partial<
      Pick<DepartmentProps, 'nameVi' | 'nameJa' | 'description' | 'isDeleted'>
    >,
  ): void {
    if (props.nameVi !== undefined) {
      this.props.nameVi = props.nameVi;
    }
    if (props.nameJa !== undefined) {
      this.props.nameJa = props.nameJa;
    }
    if (props.description !== undefined) {
      this.props.description = props.description;
    }
    if (props.isDeleted !== undefined) {
      this.props.isDeleted = props.isDeleted;
    }
  }
}
