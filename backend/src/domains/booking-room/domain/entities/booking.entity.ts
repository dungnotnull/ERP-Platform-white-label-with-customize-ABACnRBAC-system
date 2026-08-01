import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { BookingStatus } from '../enums/booking-status.enum';
import { BookingHistoryItemProps } from '../value-objects/booking-history.vo';

export interface BookingProps {
  roomIds: string[];
  title: string;
  departmentIds: string[];
  participantIds: string[];
  conflictedUsers: string[];
  creatorId: string;
  startTime: Date;
  endTime: Date;
  note: string;
  jpTitle: string;
  jpNote: string;
  status: BookingStatus;
  isDeleted: boolean;
  deletedAt: Date | null;
  history: BookingHistoryItemProps[];
  version: number;
}

export class BookingEntity extends AggregateRoot<BookingProps> {
  private _populatedDepartments: unknown[] | null = null;

  get roomIds(): string[] {
    return this.props.roomIds;
  }

  get title(): string {
    return this.props.title;
  }

  get departmentIds(): string[] {
    return this.props.departmentIds;
  }

  get participantIds(): string[] {
    return this.props.participantIds;
  }

  get conflictedUsers(): string[] {
    return this.props.conflictedUsers;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get startTime(): Date {
    return this.props.startTime;
  }

  get endTime(): Date {
    return this.props.endTime;
  }

  get note(): string {
    return this.props.note;
  }

  get jpTitle(): string {
    return this.props.jpTitle;
  }

  get jpNote(): string {
    return this.props.jpNote;
  }

  get status(): BookingStatus {
    return this.props.status;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get history(): BookingHistoryItemProps[] {
    return this.props.history;
  }

  get version(): number {
    return this.props.version;
  }

  private constructor(id: string, props: BookingProps) {
    super(id, props);
  }

  public updateRoomConflict(conflictedUserIds: string[]): void {
    this.props.conflictedUsers = conflictedUserIds;
  }

  public cancel(cancelledBy: string): void {
    this.props.status = BookingStatus.CANCELLED;
    this.props.isDeleted = true;
    this.props.deletedAt = new Date();
    this.props.version = this.props.version + 1;
    this.addHistoryEntry({
      action: 'CANCELLED',
      actorId: cancelledBy,
    });
  }

  public complete(completedBy: string): void {
    this.props.status = BookingStatus.COMPLETED;
    this.addHistoryEntry({
      action: 'COMPLETED',
      actorId: completedBy,
    });
  }

  public modifyDetails(newData: Partial<Omit<BookingProps, 'creatorId' | 'history'>>, modifiedBy: string): void {
    const changes: Record<string, unknown> = {};

    if (newData.title !== undefined && newData.title !== this.props.title) {
      const oldTitle = this.props.title;
      this.props.title = newData.title;
      changes.title = { old: oldTitle, new: newData.title };
    }

    if (newData.roomIds !== undefined) {
      this.props.roomIds = newData.roomIds;
      changes.roomIds = newData.roomIds;
    }

    if (newData.departmentIds !== undefined) {
      this.props.departmentIds = newData.departmentIds;
    }

    if (newData.participantIds !== undefined) {
      this.props.participantIds = newData.participantIds;
    }

    if (newData.startTime !== undefined) {
      this.props.startTime = newData.startTime;
    }

    if (newData.endTime !== undefined) {
      this.props.endTime = newData.endTime;
    }

    if (newData.note !== undefined) {
      this.props.note = newData.note;
    }

    if (newData.jpTitle !== undefined) {
      this.props.jpTitle = newData.jpTitle;
    }

    if (newData.jpNote !== undefined) {
      this.props.jpNote = newData.jpNote;
    }

    this.props.version = this.props.version + 1;

    this.addHistoryEntry({
      action: 'UPDATED',
      actorId: modifiedBy,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });
  }

  private addHistoryEntry(entry: Omit<BookingHistoryItemProps, 'timestamp'>): void {
    this.props.history.push({
      ...entry,
      timestamp: new Date(),
    });
  }

  public toPlainObject(): Record<string, unknown> {
    const plain: Record<string, unknown> = {
      id: this._id,
      roomIds: this.props.roomIds,
      title: this.props.title,
      departmentIds: this.props.departmentIds,
      participantIds: this.props.participantIds,
      conflictedUsers: this.props.conflictedUsers,
      creatorId: this.props.creatorId,
      startTime: this.props.startTime,
      endTime: this.props.endTime,
      note: this.props.note,
      jpTitle: this.props.jpTitle,
      jpNote: this.props.jpNote,
      status: this.props.status,
      isDeleted: this.props.isDeleted,
      deletedAt: this.props.deletedAt,
      history: this.props.history,
      version: this.props.version,
    };

    if (this._populatedDepartments) {
      plain.departments = this._populatedDepartments;
    }

    return plain;
  }

  public setPopulatedDepartments(departments: unknown[] | null): void {
    this._populatedDepartments = departments;
  }

  public static create(id: string, props: BookingProps): BookingEntity {
    return new BookingEntity(id, props);
  }
}
