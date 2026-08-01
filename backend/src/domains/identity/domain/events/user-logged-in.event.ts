import { DomainEvent } from '@/shared/domain/domain-event';

export interface UserLoggedInEventPayload {
  userId: string;
  provider: string;
}

export class UserLoggedInEvent implements DomainEvent {
  public readonly eventName = 'user.logged-in';
  public readonly occurredOn: Date;
  public readonly payload: UserLoggedInEventPayload;

  constructor(payload: UserLoggedInEventPayload) {
    this.occurredOn = new Date();
    this.payload = payload;
  }
}
