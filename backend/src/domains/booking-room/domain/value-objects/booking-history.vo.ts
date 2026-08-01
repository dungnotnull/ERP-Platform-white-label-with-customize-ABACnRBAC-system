import { ValueObject } from '@/shared/domain/value-object.base';

export interface BookingHistoryItemProps {
  action: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'COMPLETED';
  actorId: string;
  changes?: Record<string, unknown>;
  timestamp: Date;
}

export class BookingHistoryVo extends ValueObject<BookingHistoryItemProps> {
  validate(props: BookingHistoryItemProps): void {
    if (!props.action) {
      throw new Error('Action is required');
    }
    if (!props.actorId) {
      throw new Error('Actor ID is required');
    }
    if (!props.timestamp) {
      throw new Error('Timestamp is required');
    }
  }
}
