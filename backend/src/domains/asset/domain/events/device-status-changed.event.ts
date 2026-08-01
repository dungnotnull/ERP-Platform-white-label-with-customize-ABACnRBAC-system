import { DomainEvent } from '@/shared/domain/domain-event';

export interface DeviceStatusChangedEventPayload {
  deviceId: string;
  oldStatus: string;
  newStatus: string;
}

export class DeviceStatusChangedEvent implements DomainEvent {
  public readonly eventName = 'device.status-changed';
  public readonly occurredOn: Date;
  public readonly payload: DeviceStatusChangedEventPayload;

  constructor(payload: DeviceStatusChangedEventPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
