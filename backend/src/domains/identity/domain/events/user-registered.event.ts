import { DomainEvent } from '@/shared/domain/domain-event';

export interface UserRegisteredEventPayload {
  userId: string;
  email: string;
}

export class UserRegisteredEvent implements DomainEvent {
  public readonly eventName = 'user.registered';
  public readonly occurredOn: Date;
  public readonly payload: UserRegisteredEventPayload;

  constructor(payload: UserRegisteredEventPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
