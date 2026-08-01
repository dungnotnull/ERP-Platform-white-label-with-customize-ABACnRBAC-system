import { AggregateRoot } from '@/shared/domain/aggregate-root';
import { UserStatusEnum, UserStatusEnumType } from '@/shared/domain/enums/user.enum';
import { GenderEnumType, MaritalStatusEnumType } from '@/shared/domain/enums/user.enum';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserLoggedInEvent } from '../events/user-logged-in.event';
import { DEFAULT_VISIBLE_MENUS } from '@/shared/domain/constants/user.constants';

export interface UserProps {
  name: string;
  nickName?: string;
  bio?: string;
  email: string;
  password: string;
  profilePicture?: string;
  status: UserStatusEnumType;
  gender?: GenderEnumType;
  maritalStatus?: MaritalStatusEnumType;
  birthday?: Date;
  address?: string;
  phone?: string;
  roleIds: string[];
  permVersion: number;
  isSuperadmin: boolean;
  departmentId?: string;
  departmentIds: string[];
  currentTeam?: string;
  onBoardingCompleted: boolean;
  lastLogin?: Date;
  createdBy?: string;
  updatedBy?: string;
  visibleMenus?: string[];
}

export class UserEntity extends AggregateRoot<UserProps> {
  get name(): string {
    return this.props.name;
  }

  get nickName(): string | undefined {
    return this.props.nickName;
  }

  get bio(): string | undefined {
    return this.props.bio;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  get profilePicture(): string | undefined {
    return this.props.profilePicture;
  }

  get status(): UserStatusEnumType {
    return this.props.status;
  }

  get gender(): GenderEnumType | undefined {
    return this.props.gender;
  }

  get maritalStatus(): MaritalStatusEnumType | undefined {
    return this.props.maritalStatus;
  }

  get birthday(): Date | undefined {
    return this.props.birthday;
  }

  get address(): string | undefined {
    return this.props.address;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get roleIds(): string[] {
    return this.props.roleIds;
  }

  get currentTeam(): string | undefined {
    return this.props.currentTeam;
  }

  get onBoardingCompleted(): boolean {
    return this.props.onBoardingCompleted;
  }

  get lastLogin(): Date | undefined {
    return this.props.lastLogin;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get updatedBy(): string | undefined {
    return this.props.updatedBy;
  }

  get permVersion(): number {
    return this.props.permVersion;
  }

  get isSuperadmin(): boolean {
    return this.props.isSuperadmin;
  }

  get departmentId(): string | undefined {
    return this.props.departmentId;
  }

  get departmentIds(): string[] {
    return this.props.departmentIds;
  }

  get visibleMenus(): string[] {
    return this.props.visibleMenus ?? DEFAULT_VISIBLE_MENUS;
  }

  private constructor(id: string, props: UserProps) {
    super(id, props);
  }

  public assignRoles(roleIds: string[]): void {
    if (!roleIds || roleIds.length === 0) {
      throw new Error('At least one role is required');
    }
    this.props.roleIds = roleIds;
  }

  public updateDepartmentIds(departmentIds: string[]): void {
    this.props.departmentIds = departmentIds ?? [];
  }

  public setSuperadmin(value: boolean): void {
    this.props.isSuperadmin = value;
  }

  public updateVisibleMenus(visibleMenus: string[]): void {
    this.props.visibleMenus = visibleMenus;
  }

  public completeOnboarding(): void {
    this.props.onBoardingCompleted = true;
    this.props.status = UserStatusEnum.ACTIVE;
  }

  public updateProfile(props: Partial<Pick<UserProps, 'name' | 'nickName' | 'bio' | 'profilePicture' | 'gender' | 'maritalStatus' | 'birthday' | 'address' | 'phone'>>): void {
    const allowedFields = ['name', 'nickName', 'bio', 'profilePicture', 'gender', 'maritalStatus', 'birthday', 'address', 'phone'] as const;

    for (const field of allowedFields) {
      if (props[field] !== undefined) {
        (this.props as unknown as Record<string, unknown>)[field] = props[field];
      }
    }
  }

  public updateAdmin(props: Partial<Pick<UserProps, 'name' | 'nickName' | 'phone' | 'status' | 'updatedBy'>>): void {
    const allowedFields = ['name', 'nickName', 'phone', 'status', 'updatedBy'] as const;

    for (const field of allowedFields) {
      if (props[field] !== undefined) {
        (this.props as unknown as Record<string, unknown>)[field] = props[field];
      }
    }
  }

  public updateLastLogin(): void {
    this.props.lastLogin = new Date();
  }

  public recordLogin(provider: string): void {
    this.updateLastLogin();
    this.addDomainEvent(new UserLoggedInEvent({ userId: this._id, provider }));
  }

  public isOnboardingComplete(): boolean {
    return this.props.onBoardingCompleted;
  }

  public bumpPermVersion(): void {
    this.props.permVersion += 1;
  }

  public static create(id: string, props: UserProps): UserEntity {
    const user = new UserEntity(id, {
      ...props,
      permVersion: props.permVersion ?? 1,
      isSuperadmin: props.isSuperadmin ?? false,
      departmentIds: props.departmentIds ?? [],
      visibleMenus: props.visibleMenus ?? DEFAULT_VISIBLE_MENUS,
    });
    user.addDomainEvent(new UserRegisteredEvent({ userId: id, email: props.email }));
    return user;
  }
}
