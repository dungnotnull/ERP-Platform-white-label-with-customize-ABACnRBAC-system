import { Permission } from "@/shared/@types/permission.type.ts";

/** Compatible with legacy @dym-vietnam/internal-shared User */
export interface User {
  _id: string;
  name: string;
  email: string;
  status: string;
  profilePicture: string | null;
  currentTeam: string | null;
  roleId: string | { _id: string; name?: string };
  onBoardingCompleted: boolean;
  lastLogin: string | null;
  gender: string | null;
  maritalStatus: string | null;
  birthday: string | null;
  createdAt?: string;
  updatedAt?: string;
  address?: string;
  phone?: string;
  createdBy?: string;
  nickName?: string;
  bio?: string;
  __v?: number;
  updatedBy?: string;
  permissions: Permission[];
  permissionPaths?: string[];
  roles?: string[];
  /** New backend fields kept for compatibility */
  id?: string;
  roleIds?: string[];
  departmentIds?: string[];
  isSuperadmin?: boolean;
  role?: string;
  visibleMenus?: string[];
  existedRole?: string | null;
}
