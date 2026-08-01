export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  nickName?: string;
  phone?: string;
  roleIds?: string[];
  departmentIds?: string[];
  createdBy?: string;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  nickName?: string;
  phone?: string;
  status?: string;
  roleIds?: string[];
  departmentIds?: string[];
  updatedBy?: string;
  visibleMenus?: string[];
}

export interface UpdateUserProfileInput {
  id: string;
  name?: string;
  nickName?: string;
  bio?: string;
  profilePicture?: string;
  gender?: string;
  maritalStatus?: string;
  birthday?: Date;
  address?: string;
  phone?: string;
}

export interface UserOutput {
  id: string;
  name: string;
  nickName?: string;
  bio?: string;
  email: string;
  profilePicture?: string;
  status: string;
  gender?: string;
  maritalStatus?: string;
  birthday?: Date;
  address?: string;
  phone?: string;
  roleIds: string[];
  isSuperadmin: boolean;
  departmentIds: string[];
  permissions: string[];
  currentTeam?: string;
  onBoardingCompleted: boolean;
  lastLogin?: Date;
  visibleMenus?: string[];
  existedRole?: string | null;
}

export interface PaginatedUsersOutput {
  items: UserOutput[];
  total: number;
  page: number;
  limit: number;
}

export interface UserFilterInput {
  search?: string;
  status?: string;
  roleId?: string;
  departmentId?: string;
}
