import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { DeviceSummaryProps } from '../value-objects/device-summary.vo';
import {
  buildReleasedEmployeeCode,
  isReleasedEmployeeCode,
} from '../utils/internal-user-employee-code.util';

export interface InternalUserProps {
  name: string;
  email: string;
  employeeCode: string;
  departmentId: string;
  positionId: string;
  isActive: boolean;
  isDeleted: boolean;
  role: string;
  deviceSummary: DeviceSummaryProps;
}

export class InternalUserEntity extends AggregateRoot<InternalUserProps> {
  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get employeeCode(): string {
    return this.props.employeeCode;
  }

  get departmentId(): string {
    return this.props.departmentId;
  }

  get positionId(): string {
    return this.props.positionId;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get role(): string {
    return this.props.role;
  }

  get deviceSummary(): DeviceSummaryProps {
    return this.props.deviceSummary;
  }

  constructor(id: string, props: InternalUserProps) {
    super(id, props);
  }

  /** Trạng thái làm việc (nghỉ / đang làm) — không dùng cho xóa danh sách */
  public deactivate(): void {
    this.props.isActive = false;
  }

  /** Xóa mềm: ẩn khỏi danh sách, giải phóng mã NV để tái sử dụng */
  public softDelete(): void {
    this.props.isDeleted = true;
    if (
      this.props.employeeCode &&
      !isReleasedEmployeeCode(this.props.employeeCode)
    ) {
      this.props.employeeCode = buildReleasedEmployeeCode(
        this.id,
        this.props.employeeCode,
      );
    }
  }

  public updateDepartmentAndPosition(departmentId: string, positionId: string): void {
    this.props.departmentId = departmentId;
    this.props.positionId = positionId;
  }

  public updateDeviceSummary(summary: DeviceSummaryProps): void {
    this.props.deviceSummary = summary;
  }

  public update(props: Partial<Pick<InternalUserProps, 'name' | 'email' | 'employeeCode' | 'departmentId' | 'positionId' | 'role' | 'isActive' | 'isDeleted'>>): void {
    if (props.name !== undefined) {
      this.props.name = props.name;
    }
    if (props.email !== undefined) {
      this.props.email = props.email;
    }
    if (props.employeeCode !== undefined) {
      this.props.employeeCode = props.employeeCode;
    }
    if (props.departmentId !== undefined) {
      this.props.departmentId = props.departmentId;
    }
    if (props.positionId !== undefined) {
      this.props.positionId = props.positionId;
    }
    if (props.role !== undefined) {
      this.props.role = props.role;
    }
    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }
    if (props.isDeleted !== undefined) {
      this.props.isDeleted = props.isDeleted;
    }
  }

  public toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      name: this.props.name,
      email: this.props.email,
      employeeCode: this.props.employeeCode,
      departmentId: this.props.departmentId,
      positionId: this.props.positionId,
      isActive: this.props.isActive,
      isDeleted: this.props.isDeleted,
      role: this.props.role,
      deviceSummary: { ...this.props.deviceSummary },
    };
  }
}
