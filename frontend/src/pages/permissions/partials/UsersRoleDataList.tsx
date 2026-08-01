import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import CustomSelect from "@/components/patterns/CustomSelect";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination";
import { SecretKeyConfirmDialog } from "@/components/patterns/SecretKeyConfirmDialog";
import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { RoleOutput, DepartmentOutput } from "@/shared/@types/permission.type";
import { User } from "@/shared/@types/user.type";
import { toast } from "react-toastify";
import { Shield, ShieldOff } from "lucide-react";
import _ from "lodash";
import { fetchRolesByDepartments } from "@/shared/queries/permission.queries";
import { useUserProfile } from "@/shared/hooks/useUserProfile";
import { DEFAULT_VISIBLE_MENUS, MENU_OPTIONS } from "@/shared/constants/menu.constants";

interface UsersRoleDataListProps {
  roles: RoleOutput[];
  departments: DepartmentOutput[];
}

const usersApi = apiRoutes[ApiRouteNames.USERS] ?? "/users";
const EMPTY_STRING_ARRAY: string[] = [];

function normalizeRoleIds(user: User): string[] {
  if (Array.isArray(user.roleIds) && user.roleIds.length > 0) {
    return user.roleIds.map(r =>
      typeof r === "object" && r && "_id" in r ? (r as any)._id : (r as string)
    );
  }
  const r = user.roleId;
  if (r && typeof r === "object" && "_id" in r) return [r._id];
  if (typeof r === "string" && r) return [r];
  return [];
}

export function UsersRoleDataList({
  roles,
  departments
}: UsersRoleDataListProps) {
  const { t, i18n } = useTranslation();
  const { user: currentUser, refetch: refetchProfile } = useUserProfile();
  const [users, setUsers] = useState<User[]>([]);
  const [userRoleDraft, setUserRoleDraft] = useState<Record<string, string[]>>(
    {}
  );
  const [userDeptDraft, setUserDeptDraft] = useState<Record<string, string[]>>(
    {}
  );
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [userPageIndex, setUserPageIndex] = useState(0);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userTotal, setUserTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [userRolesByDept, setUserRolesByDept] = useState<
    Record<string, RoleOutput[]>
  >({});
  const [superadminDialogOpen, setSuperadminDialogOpen] = useState(false);
  const [superadminTarget, setSuperadminTarget] = useState<{
    userId: string;
    email: string;
    setTo: boolean;
  } | null>(null);
  const [superadminLoading, setSuperadminLoading] = useState(false);
  const [userMenuDraft, setUserMenuDraft] = useState<Record<string, string[]>>({});
  const [savingMenuUserId, setSavingMenuUserId] = useState<string | null>(null);

  const getGlobalRoles = useCallback((): RoleOutput[] => {
    return roles.filter(role => role.departmentIds.length === 0);
  }, [roles]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(userPageIndex + 1));
      params.set("limit", String(userPageSize));
      const trimmedSearch = search.trim();

      if (trimmedSearch.length >= 2) params.set("search", trimmedSearch);
      if (roleFilter && roleFilter !== "all") params.set("roleId", roleFilter);
      if (departmentFilter && departmentFilter !== "all")
        params.set("departmentId", departmentFilter);

      const res = await apiClient.get<any>(`${usersApi}?${params.toString()}`);

      const payload = res.data ?? res;
      const list = payload.items ?? payload.users ?? [];
      const total =
        payload.total ?? payload.pagination?.totalCount ?? list.length;

      const userList = Array.isArray(list) ? list : [];
      setUsers(userList);
      setUserTotal(total);

      const globalRoles = getGlobalRoles();

      const draftRole: Record<string, string[]> = {};
      const draftDept: Record<string, string[]> = {};
      const rolesByDept: Record<string, RoleOutput[]> = {};
      const draftMenu: Record<string, string[]> = {};

      const uniqueDeptKeySet = new Set<string>();
      const deptKeyToUsers = new Map<string, string[]>();

      for (const u of userList) {
        const uid = u._id || u.id;
        if (!uid) continue;

        draftRole[uid] = normalizeRoleIds(u);
        const deptIds = u.departmentIds ?? [];
        draftDept[uid] = deptIds;
        draftMenu[uid] = u.visibleMenus ?? DEFAULT_VISIBLE_MENUS;

        const sortedIds = [...deptIds].filter(Boolean).sort();
        const deptKey = sortedIds.join(",");
        uniqueDeptKeySet.add(deptKey);

        if (!deptKeyToUsers.has(deptKey)) {
          deptKeyToUsers.set(deptKey, []);
        }
        deptKeyToUsers.get(deptKey)!.push(uid);
      }

      const deptKeyToRoles = new Map<string, RoleOutput[]>();
      await Promise.all(
        Array.from(uniqueDeptKeySet).map(async deptKey => {
          const ids = deptKey ? deptKey.split(",") : [];
          const deptRoles =
            ids.length > 0 ? await fetchRolesByDepartments(ids) : [];
          deptKeyToRoles.set(deptKey, _.unionBy(deptRoles, globalRoles, "id"));
        })
      );

      for (const [deptKey, userIds] of deptKeyToUsers) {
        const rolesForDept = deptKeyToRoles.get(deptKey) ?? globalRoles;
        for (const uid of userIds) {
          rolesByDept[uid] = rolesForDept;
        }
      }

      setUserRoleDraft(draftRole);
      setUserDeptDraft(draftDept);
      setUserRolesByDept(rolesByDept);
      setUserMenuDraft(draftMenu);
    } catch (e) {
      console.error(e);
      toast.error(t("permissions.errors.loadUsers"));
    }
    // `t` / fetchRolesByDepartments cố ý không đưa vào deps — tránh recreate fetchUsers mỗi render → Maximum update depth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userPageIndex,
    userPageSize,
    search,
    roleFilter,
    departmentFilter,
    getGlobalRoles
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserPermissions = async (userId: string) => {
    const roleIds = userRoleDraft[userId];
    const departmentIds = userDeptDraft[userId] ?? [];
    if (!roleIds || roleIds.length === 0) {
      toast.error(t("permissions.errors.atLeastOneRole"));
      return;
    }
    setSavingUserId(userId);
    try {
      await apiClient.put(
        (apiRoutes[ApiRouteNames.UPDATE_USER] ?? "/users/:id").replace(
          ":id",
          userId
        ),
        { roleIds, departmentIds }
      );
      toast.success(t("permissions.updateRoleSuccess"));
      await fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error(t("permissions.errors.updateRoleFailed"));
    } finally {
      setSavingUserId(null);
    }
  };

  const handleSetSuperadmin = async (secretKey: string) => {
    if (!superadminTarget) return;
    setSuperadminLoading(true);
    try {
      await apiClient.put(`${usersApi}/${superadminTarget.userId}/superadmin`, {
        isSuperadmin: superadminTarget.setTo,
        secretKey
      });
      toast.success(t("permissions.setSuperadminSuccess"));
      setSuperadminDialogOpen(false);
      setSuperadminTarget(null);
      await fetchUsers();
    } catch (e) {
      console.error(e);
      toast.error(t("permissions.setSuperadminFailed"));
    } finally {
      setSuperadminLoading(false);
    }
  };

  const setUserRoleDraftById = (userId: string, roleIds: string[]) => {
    setUserRoleDraft(prev => ({ ...prev, [userId]: roleIds }));
  };

  const setUserDeptDraftById = async (userId: string, deptIds: string[]) => {
    setUserDeptDraft(prev => ({ ...prev, [userId]: deptIds }));

    const fetchedRoles = await fetchRolesByDepartments(deptIds);
    const globalRoles = getGlobalRoles();
    const allRoles = _.unionBy(fetchedRoles, globalRoles, "id");

    setUserRolesByDept(prev => ({ ...prev, [userId]: allRoles }));

    const currentRoleIds = userRoleDraft[userId] ?? [];
    const globalRoleIds = _.map(globalRoles, "id");
    const fetchedRoleIds = _.map(fetchedRoles, "id");
    const validRoleIds = _.union(
      _.intersection(currentRoleIds, fetchedRoleIds),
      _.intersection(currentRoleIds, globalRoleIds)
    );

    setUserRoleDraft(prev => ({ ...prev, [userId]: validRoleIds }));
  };

  const updateUserVisibleMenus = async (userId: string) => {
    const visibleMenus = userMenuDraft[userId];
    setSavingMenuUserId(userId);
    try {
      await apiClient.put(
        (apiRoutes[ApiRouteNames.UPDATE_USER] ?? "/users/:id").replace(":id", userId),
        { visibleMenus }
      );
      toast.success(t("permissions.updateMenuSuccess"));
      await fetchUsers();

      const currentUserId = currentUser?.id || currentUser?._id;
      if (currentUserId === userId) {
        await refetchProfile();
      }
    } catch (e) {
      console.error(e);
      toast.error(t("permissions.errors.updateMenuFailed"));
    } finally {
      setSavingMenuUserId(null);
    }
  };

  const setUserMenuDraftById = (userId: string, menuIds: string[]) => {
    setUserMenuDraft(prev => ({ ...prev, [userId]: menuIds }));
  };

  const totalUserPages =
    userPageSize > 0 ? Math.max(1, Math.ceil(userTotal / userPageSize)) : 1;

  const handleUserPageChange = (pageIndex: number) => {
    setUserPageIndex(pageIndex);
  };

  const handleUserPageSizeChange = (pageSize: number) => {
    setUserPageSize(pageSize);
    setUserPageIndex(0);
  };

  const getDepartmentName = (deptId: string): string => {
    const dept = departments.find(d => d.id === deptId);
    return dept
      ? getLocalizedOrganizationName(dept, i18n.language) || deptId
      : deptId;
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {t("permissions.userList")}
        </h2>
        <div className="flex gap-3 items-center flex-wrap">
          <Input
            value={search}
            onChange={e => {
              setUserPageIndex(0);
              setSearch(e.target.value);
            }}
            className="h-9 w-48"
            placeholder={
              t("device.requests.filter.placeholder") ?? "Tìm theo tên/email"
            }
          />
          <Select
            value={departmentFilter}
            onValueChange={val => {
              setUserPageIndex(0);
              setDepartmentFilter(val);
            }}
          >
            <SelectTrigger className="h-9 w-44 bg-white border border-gray-300">
              <SelectValue
                placeholder={t("permissions.userDepartments") ?? "Phòng ban"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("employees.department.all") ?? "Tất cả phòng ban"}
              </SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id}>
                  {getLocalizedOrganizationName(d, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={roleFilter}
            onValueChange={val => {
              setUserPageIndex(0);
              setRoleFilter(val);
            }}
          >
            <SelectTrigger className="h-9 w-44 bg-white border border-gray-300">
              <SelectValue placeholder={t("permissions.userRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("employees.role.all") ?? "Tất cả vai trò"}
              </SelectItem>
              {roles.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="neumorphic-table-wrapper">
        <table className="neumorphic-table min-w-[1600px]">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left p-3 font-semibold text-gray-700 w-[200px]">
                {t("permissions.userEmail")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700 w-[450px]">
                {t("permissions.userName")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700 min-w-[220px]">
                {t("permissions.userDepartments") || "Quyền phòng ban"}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700 min-w-[220px]">
                {t("permissions.userRoles")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700 min-w-[280px]">
                {t("permissions.visibleMenus")}
              </th>
              <th className="p-3 w-[200px]">{t("permissions.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const userId = user._id || (user.id as string);
              const currentRoleIds = normalizeRoleIds(user);
              const draftRoleIds = userRoleDraft[userId] ?? currentRoleIds;
              const roleSame =
                draftRoleIds.length === currentRoleIds.length &&
                draftRoleIds.every(id => currentRoleIds.includes(id));

              const userDepartmentIds = user.departmentIds ?? [];
              const draftDeptIds = userDeptDraft[userId] ?? userDepartmentIds;
              const deptSame =
                draftDeptIds.length === userDepartmentIds.length &&
                draftDeptIds.every(id => userDepartmentIds.includes(id));

              const same = roleSame && deptSame;
              const isSuperadmin = user.isSuperadmin ?? false;
              const availableRoles = userRolesByDept[userId] ?? [];

              const groupedRoleOptions = _.groupBy(availableRoles, role => {
                if (role.departmentIds.length === 0) return "__global__";
                return role.departmentIds
                  .map(deptId => getDepartmentName(deptId))
                  .join(", ");
              });

              const roleOptions = _.orderBy(
                Object.entries(groupedRoleOptions).map(([group, roles]) => {
                  const isGlobal = group === "__global__";
                  return {
                    group: isGlobal
                      ? t("permissions.allDepartments") || "Tất cả phòng ban"
                      : group,
                    isGlobal,
                    roles: roles.map(r => ({
                      value: r.id,
                      label: r.name,
                      group: isGlobal
                        ? t("permissions.allDepartments") || "Tất cả phòng ban"
                        : group,
                      isGlobal
                    }))
                  };
                }),
                ["isGlobal", "group"],
                ["desc", "asc"]
              ).flatMap(item => item.roles);

              const deptOptions = departments.map(d => ({
                value: d.id,
                label: getLocalizedOrganizationName(d, i18n.language)
              }));

              return (
                <tr
                  key={userId}
                  className={`border-b border-gray-100 ${
                    isSuperadmin ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="p-3 text-gray-900">{user.email}</td>
                  <td className="p-3 text-gray-700">{user.name ?? "—"}</td>
                  <td className="p-3">
                    {isSuperadmin ? (
                      <span className="text-gray-400 text-sm">—</span>
                    ) : (
                      <CustomSelect
                        options={deptOptions}
                        multiSelect
                        value={draftDeptIds}
                        onValueChange={val =>
                          setUserDeptDraftById(
                            userId,
                            Array.isArray(val) ? val : val ? [val] : []
                          )
                        }
                        placeholder={
                          t("permissions.selectDepartments") || "Chọn phòng ban"
                        }
                        translateLabels={false}
                        className="max-w-[220px]"
                        triggerClassName="h-9 text-sm"
                      />
                    )}
                  </td>
                  <td className="p-3">
                    {isSuperadmin ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Superadmin
                      </span>
                    ) : (
                      <CustomSelect
                        options={roleOptions}
                        multiSelect
                        value={draftRoleIds}
                        onValueChange={val =>
                          setUserRoleDraftById(
                            userId,
                            Array.isArray(val) ? val : val ? [val] : []
                          )
                        }
                        placeholder={t("permissions.userRolePlaceholder")}
                        translateLabels={false}
                        className="max-w-[220px]"
                        triggerClassName="h-9 text-sm"
                      />
                    )}
                  </td>
                  <td className="p-3">
                    {isSuperadmin ? (
                      <span className="text-gray-400 text-sm">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CustomSelect
                          options={MENU_OPTIONS.map(opt => ({
                            value: opt.value,
                            label: t(opt.label)
                          }))}
                          multiSelect
                          value={userMenuDraft[userId] ?? EMPTY_STRING_ARRAY}
                          onValueChange={val =>
                            setUserMenuDraftById(
                              userId,
                              Array.isArray(val) ? val : val ? [val] : []
                            )
                          }
                          placeholder={t("permissions.selectMenus")}
                          translateLabels={false}
                          className="max-w-[220px]"
                          triggerClassName="h-9 text-sm"
                        />
                        <Button
                          size="sm"
                          disabled={savingMenuUserId === userId}
                          onClick={() => updateUserVisibleMenus(userId)}
                        >
                          {savingMenuUserId === userId
                            ? t("common.saving")
                            : t("common.save")}
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {!isSuperadmin && (
                        <Button
                          size="sm"
                          disabled={
                            savingUserId === userId ||
                            same ||
                            draftRoleIds.length === 0
                          }
                          onClick={() => updateUserPermissions(userId)}
                        >
                          {savingUserId === userId
                            ? t("common.saving")
                            : t("permissions.save")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={isSuperadmin ? "outline" : "default"}
                        className={
                          isSuperadmin
                            ? "text-red-600 border-red-300 hover:bg-red-50"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                        }
                        onClick={() => {
                          setSuperadminTarget({
                            userId,
                            email: user.email ?? "",
                            setTo: !isSuperadmin
                          });
                          setSuperadminDialogOpen(true);
                        }}
                        title={
                          isSuperadmin
                            ? t("permissions.removeSuperadmin")
                            : t("permissions.assignSuperadmin")
                        }
                      >
                        {isSuperadmin ? (
                          <ShieldOff className="w-4 h-4 mr-1" />
                        ) : (
                          <Shield className="w-4 h-4 mr-1" />
                        )}
                        {isSuperadmin
                          ? t("permissions.removeSuperadmin")
                          : t("permissions.assignSuperadmin")}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {t("permissions.noUsers")}
          </div>
        )}
      </div>
      <div className="border-t border-gray-200">
        <DataListPagination
          onPageChange={handleUserPageChange}
          onPageSizeChange={handleUserPageSizeChange}
          totalPages={totalUserPages}
          pageSizeOptions={[10, 20, 50, 100]}
          pageIndex={userPageIndex}
          pageSize={userPageSize}
          totalItems={userTotal}
        />
      </div>

      <SecretKeyConfirmDialog
        open={superadminDialogOpen}
        onOpenChange={open => {
          setSuperadminDialogOpen(open);
          if (!open) setSuperadminTarget(null);
        }}
        title={
          superadminTarget?.setTo
            ? t("permissions.superadminConfirmTitle")
            : t("permissions.removeSuperadminConfirmTitle")
        }
        description={
          superadminTarget?.setTo
            ? t("permissions.superadminConfirmDesc")
            : t("permissions.removeSuperadminConfirmDesc")
        }
        onConfirm={handleSetSuperadmin}
        loading={superadminLoading}
      />
    </section>
  );
}
