import { ValueObject } from '@/shared/domain/value-object.base';

export interface DeviceTransactionProps {
  transactionType: string;
  userId?: string;
  performedBy?: string;
  notes: string;
  metadata?: Record<string, unknown>;
  date: Date;
}

export class DeviceTransactionVo extends ValueObject<DeviceTransactionProps> {
  get transactionType(): string {
    return this.props.transactionType;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get performedBy(): string | undefined {
    return this.props.performedBy;
  }

  get notes(): string {
    return this.props.notes;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get date(): Date {
    return this.props.date;
  }

  toPlainObject(): DeviceTransactionProps {
    return {
      transactionType: this.props.transactionType,
      notes: this.props.notes,
      date: this.props.date,
      ...(this.props.userId !== undefined && { userId: this.props.userId }),
      ...(this.props.performedBy !== undefined && { performedBy: this.props.performedBy }),
      ...(this.props.metadata !== undefined && { metadata: this.props.metadata }),
    };
  }
}
