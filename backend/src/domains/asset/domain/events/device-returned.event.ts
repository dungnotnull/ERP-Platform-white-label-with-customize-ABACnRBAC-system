import { DomainEvent } from '@/shared/domain/domain-event';

export interface DeviceReturnedEventPayload {
  deviceId: string;
  returnedBy: string;
}

export class DeviceReturnedEvent implements DomainEvent {
  public readonly eventName = 'device.returned';
  public readonly occurredOn: Date;
  public readonly payload: DeviceReturnedEventPayload;

  constructor(payload: DeviceReturnedEventPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
