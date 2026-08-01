export interface DomainEvent {
  eventName: string;
  occurredOn: Date;
  payload: Record<string, any>;
}
