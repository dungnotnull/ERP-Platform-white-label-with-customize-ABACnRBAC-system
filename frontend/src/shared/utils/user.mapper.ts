import { DecodedToken } from "@/shared/@types/authentication.type.ts";
import { Permission } from "@/shared/@types/permission.type.ts";
import { User } from "@/shared/@types/user.type.ts";
import TokenService from "@/services/token.service.ts";

type BackendUser = Partial<User> & {
  id?: string;
  _id?: string;
  roleIds?: string[];
  roleId?: string | { _id?: string; id?: string; name?: string };
  role?: string;
  permissions?: Array<Permission | string>;
  roles?: string[];
  lastLogin?: string | Date | null;
  birthday?: string | Date | null;
  existedRole?: string | null;
};

function toIsoString(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function mapPermissions(
  permissions?: Array<Permission | string>
): Permission[] {
  if (!permissions?.length) return [];

  return permissions.map(permission => {
    if (typeof permission === "string") {
      return {
        _id: permission,
        name: permission,
        status: "ACTIVE"
      };
    }

    return {
      _id: permission._id ?? permission.name,
      name: permission.name,
      status: permission.status ?? "ACTIVE",
      description: permission.description,
      deletedAt: permission.deletedAt ?? null,
      deletedBy: permission.deletedBy ?? null,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      __v: permission.__v
    };
  });
}

function mapRoleId(
  raw: BackendUser,
  token?: DecodedToken | null
): string | { _id: string; name?: string } {
  if (raw.roleId && typeof raw.roleId === "object") {
    const roleObject = raw.roleId;
    return {
      _id: roleObject._id ?? roleObject.id ?? "",
      name: roleObject.name ?? token?.role
    };
  }

  if (typeof raw.roleId === "string" && raw.roleId) {
    return raw.roleId;
  }

  if (raw.roleIds?.length) {
    return raw.roleIds[0];
  }

  if (token?.roleIds?.length) {
    return token.roleIds[0];
  }

  return token?.role ?? "";
}

export function normalizeUserProfile(raw: BackendUser): User {
  const token = TokenService.decodeToken(TokenService.getAccessToken());
  const userId = raw._id ?? raw.id ?? token?.sub ?? "";
  const roleId = mapRoleId(raw, token);

  const tokenPermissions = (token?.permissions ?? []).map(name => ({
    _id: name,
    name,
    status: "ACTIVE"
  }));

  const profilePermissions = mapPermissions(raw.permissions);
  const permissions =
    profilePermissions.length > 0 ? profilePermissions : tokenPermissions;

  const roles = [
    ...(raw.roles ?? []),
    ...(raw.role ? [raw.role] : []),
    ...(token?.role ? [token.role] : [])
  ].filter(Boolean);

  return {
    _id: userId,
    id: userId,
    name: raw.name ?? token?.email ?? "",
    email: raw.email ?? token?.email ?? "",
    status: raw.status ?? "ACTIVE",
    profilePicture: raw.profilePicture ?? null,
    currentTeam: raw.currentTeam ?? null,
    roleId,
    roleIds:
      raw.roleIds ?? (typeof roleId === "string" ? [roleId] : [roleId._id]),
    isSuperadmin: raw.isSuperadmin ?? false,
    role: raw.role ?? token?.role,
    onBoardingCompleted: raw.onBoardingCompleted ?? false,
    lastLogin: toIsoString(raw.lastLogin),
    gender: raw.gender ?? null,
    maritalStatus: raw.maritalStatus ?? null,
    birthday: toIsoString(raw.birthday),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    address: raw.address,
    phone: raw.phone,
    createdBy: raw.createdBy,
    nickName: raw.nickName,
    bio: raw.bio,
    __v: raw.__v ?? 0,
    updatedBy: raw.updatedBy ?? "",
    permissions,
    roles: [...new Set(roles)],
    visibleMenus: raw.visibleMenus,
    existedRole: raw.existedRole ?? null
  };
}
