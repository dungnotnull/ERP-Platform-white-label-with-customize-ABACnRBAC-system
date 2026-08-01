import { Entity } from '@/shared/domain/entity.base';
import { ActivityAction } from '../enums/activity-action.enum';

export interface ActivityLogProps {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isSuperadmin: boolean | null;
  action: ActivityAction;
  method: string;
  endpoint: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestBody: Record<string, any> | null;
  responseTimeMs: number;
  timestamp: Date;
}

export class ActivityLogEntity extends Entity<ActivityLogProps> {
  static create(props: Omit<ActivityLogProps, 'timestamp'> & { timestamp?: Date }): ActivityLogEntity {
    return new ActivityLogEntity(
      crypto.randomUUID(),
      { timestamp: new Date(), ...props },
    );
  }

  get userId(): string | null { return this.props.userId; }
  get userEmail(): string | null { return this.props.userEmail; }
  get userName(): string | null { return this.props.userName; }
  get isSuperadmin(): boolean | null { return this.props.isSuperadmin; }
  get action(): ActivityAction { return this.props.action; }
  get method(): string { return this.props.method; }
  get endpoint(): string { return this.props.endpoint; }
  get statusCode(): number { return this.props.statusCode; }
  get ipAddress(): string { return this.props.ipAddress; }
  get userAgent(): string { return this.props.userAgent; }
  get requestBody(): Record<string, any> | null { return this.props.requestBody; }
  get responseTimeMs(): number { return this.props.responseTimeMs; }
  get timestamp(): Date { return this.props.timestamp; }
}
