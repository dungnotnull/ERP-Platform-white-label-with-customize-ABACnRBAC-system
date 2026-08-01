import { DomainEvent } from '@/shared/domain/domain-event';

export interface DeviceAssignedEventPayload {
  deviceId: string;
  userId: string;
  assignedBy: string;
}

export class DeviceAssignedEvent implements DomainEvent {
  public readonly eventName = 'device.assigned';
  public readonly occurredOn: Date;
  public readonly payload: DeviceAssignedEventPayload;

  constructor(payload: DeviceAssignedEventPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
