import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import {
  Shield,
  PlusCircle,
  Pencil,
  Trash2,
  Route,
  Info,
  ChevronDown,
  ChevronRight,
  UserCog,
  Users
} from "lucide-react";
import _ from "lodash";
import PageTopBar from "@/components/PageTopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { toast } from "react-toastify";
import { UsersRoleDataList } from "./partials/UsersRoleDataList";
import CustomSelect from "@/components/patterns/CustomSelect";
import { SecretKeyConfirmDialog } from "@/components/patterns/SecretKeyConfirmDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AbacPoliciesList } from "./partials/AbacPoliciesList";
import type {
  EndpointPermission,
  RoleOutput,
  DiscoveredRoute
} from "@/shared/@types/permission.type";
import CustomLoader from "@/components/ui/CustomLoader";
import {
  useModulesQuery,
  useEndpointPermissionsQuery,
  useRolesQuery,
  usePermissionDepartmentsQuery
} from "@/shared/queries/permission.queries";

const PERMISSION_ENUM = [
  "read",
  "create",
  "update",
  "delete",
  "approve",
  "export",
  "import"
] as const;
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function methodBadgeColor(method: string): string {
  switch (method) {
    case "GET":
      return "bg-emerald-100 text-emerald-800";
    case "POST":
      return "bg-blue-100 text-blue-800";
    case "PUT":
      return "bg-amber-100 text-amber-800";
    case "PATCH":
      return "bg-yellow-100 text-yellow-800";
    case "DELETE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function PermissionsManagement() {
  const { t, i18n } = useTranslation();

  // ---- React Query hooks for shared data ----
  const { data: modules = [], isLoading: modulesLoading } = useModulesQuery();
  const {
    data: endpointPermissions = [],
    isLoading: epLoading,
    refetch: refetchEndpointPermissions
  } = useEndpointPermissionsQuery();
  const {
    data: roles = [],
    isLoading: rolesLoading,
    refetch: refetchRoles
  } = useRolesQuery();
  const { data: departments = [] } = usePermissionDepartmentsQuery();

  // ---- Endpoint Permissions Local State ----
  const [epSearch, setEpSearch] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );
  const [epModalOpen, setEpModalOpen] = useState(false);
  const [editingEp, setEditingEp] = useState<EndpointPermission | null>(null);
  const [epModule, setEpModule] = useState("");
  const [epMethod, setEpMethod] = useState("GET");
  const [epPathPattern, setEpPathPattern] = useState("");
  const [epPermission, setEpPermission] = useState("");
  const [epDescription, setEpDescription] = useState("");
  const [savingEp, setSavingEp] = useState(false);
  const [deletingEpId, setDeletingEpId] = useState<string | null>(null);
  const [discoveredRoutes, setDiscoveredRoutes] = useState<DiscoveredRoute[]>(
    []
  );
  const [routesLoading, setRoutesLoading] = useState(false);

  // ---- Roles Local State ----
  const [rolePermDraft, setRolePermDraft] = useState<Record<string, string[]>>(
    {}
  );
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [createRoleModalOpen, setCreateRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleOutput | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleDepartmentIds, setNewRoleDepartmentIds] = useState<string[]>(
    []
  );
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>(
    []
  );
  const [creatingRole, setCreatingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);

  // ---- Delete Confirmation State ----
  const [epToDelete, setEpToDelete] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleOutput | null>(null);

  // ---- Role Grouping State ----
  const [expandedRoleDepts, setExpandedRoleDepts] = useState<Set<string>>(
    new Set(["all"])
  );

  // ---- Draft Sync ----
  useEffect(() => {
    setRolePermDraft(prev => {
      const draft: Record<string, string[]> = {};
      let changed = Object.keys(prev).length !== roles.length;

      roles.forEach(r => {
        const nextIds = r.endpointPermissionIds ?? [];
        draft[r.id] = nextIds;
        const prevIds = prev[r.id];
        if (
          !prevIds ||
          prevIds.length !== nextIds.length ||
          prevIds.some((id, index) => id !== nextIds[index])
        ) {
          changed = true;
        }
      });

      return changed ? draft : prev;
    });
  }, [roles]);

  // ---- Initialize expanded modules ----
  useEffect(() => {
    if (endpointPermissions.length === 0) return;

    setExpandedModules(prev => {
      if (prev.size > 0) return prev;
      const grouped = _.groupBy(endpointPermissions, "module");
      const firstModule = _.sortBy(Object.keys(grouped))[0];
      return firstModule ? new Set([firstModule]) : prev;
    });
  }, [endpointPermissions]);

  // ---- Fetch discovered routes ----
  const fetchDiscoveredRoutes = useCallback(async (module: string) => {
    if (!module) {
      setDiscoveredRoutes([]);
      return;
    }
    setRoutesLoading(true);
    try {
      const data = await apiClient.get<DiscoveredRoute[]>(
        `${apiRoutes[ApiRouteNames.EP_ROUTES]}?module=${encodeURIComponent(module)}`
      );
      setDiscoveredRoutes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setDiscoveredRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  // ---- Handlers ----
  const toggleModuleExpanded = (module: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  const toggleRoleDeptExpanded = (deptId: string) => {
    setExpandedRoleDepts(prev => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  const updateRolePermissions = async (roleId: string) => {
    const permissionIds = rolePermDraft[roleId] ?? [];
    setSavingRoleId(roleId);
    try {
      await apiClient.put(
        (apiRoutes[ApiRouteNames.ROLE_PERMISSIONS] ?? "/roles/:id").replace(
          ":id",
          roleId
        ),
        { permissionIds }
      );
      toast.success(t("permissions.updateRolePermissionsSuccess"));
      await refetchRoles();
    } catch (e) {
      console.error(e);
      toast.error(t("permissions.errors.updateFailed"));
    } finally {
      setSavingRoleId(null);
    }
  };

  const openAddEp = () => {
    setEditingEp(null);
    setEpModule("");
    setEpMethod("GET");
    setEpPathPattern("");
    setEpPermission("");
    setEpDescription("");
    setDiscoveredRoutes([]);
    setEpModalOpen(true);
  };

  const openEditEp = (ep: EndpointPermission) => {
    setEditingEp(ep);
    setEpModule(ep.module);
    setEpMethod(ep.method);
    setEpPathPattern(ep.pathPattern);
    setEpPermission(ep.permission);
    setEpDescription(ep.description ?? "");
    setDiscoveredRoutes([]);
    setEpModalOpen(true);
  };

  const saveEp = async () => {
    const moduleVal = epModule.trim();
    const permission = epPermission.trim();
    if (!moduleVal || !epPathPattern.trim() || !permission) {
      toast.error(t("permissions.errors.allFieldsRequired"));
      return;
    }
    setSavingEp(true);
    try {
      const body = {
        method: epMethod,
        pathPattern: epPathPattern.trim(),
        module: moduleVal,
        permission,
        description: epDescription.trim() || undefined
      };
      if (editingEp) {
        await apiClient.put(
          `${apiRoutes[ApiRouteNames.ENDPOINT_PERMISSIONS]}/${editingEp.id}`,
          body
        );
        toast.success(t("permissions.updateEndpointRuleSuccess"));
      } else {
        await apiClient.post(
          apiRoutes[ApiRouteNames.ENDPOINT_PERMISSIONS] ??
            "/endpoint-permissions",
          body
        );
        toast.success(t("permissions.createEndpointRuleSuccess"));
      }
      setEpModalOpen(false);
      await refetchEndpointPermissions();
    } catch (e) {
      console.error(e);
      toast.error(
        editingEp
          ? t("permissions.errors.updateEndpointRuleFailed")
          : t("permissions.errors.createEndpointRuleFailed")
      );
    } finally {
      setSavingEp(false);
    }
  };

  const deleteEp = (id: string) => {
    setEpToDelete(id);
  };

  const handleDeleteEpConfirm = async (secretKey: string) => {
    if (!epToDelete) return;
    setDeletingEpId(epToDelete);
    try {
      await apiClient.delete(
        `${apiRoutes[ApiRouteNames.ENDPOINT_PERMISSIONS]}/${epToDelete}`,
        {
          data: { secretKey }
        }
      );
      toast.success(t("permissions.deleteEndpointRuleSuccess"));
      await refetchEndpointPermissions();
      setEpToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error(t("permissions.errors.deleteEndpointRuleFailed"));
    } finally {
      setDeletingEpId(null);
    }
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setNewRoleName("");
    setNewRoleDescription("");
    setNewRoleDepartmentIds([]);
    setNewRolePermissionIds([]);
    setCreateRoleModalOpen(true);
  };

  const openEditRole = (role: RoleOutput) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description ?? "");
    setNewRoleDepartmentIds(role.departmentIds ?? []);
    setNewRolePermissionIds(role.endpointPermissionIds ?? []);
    setCreateRoleModalOpen(true);
  };

  const saveRole = async () => {
    const name = newRoleName.trim();
    if (!name) {
      toast.error(t("permissions.errors.roleNameRequired"));
      return;
    }
    setCreatingRole(true);
    try {
      const payload = {
        name,
        description: newRoleDescription.trim() || undefined,
        departmentIds:
          newRoleDepartmentIds.length > 0 ? newRoleDepartmentIds : undefined,
        permissionIds: newRolePermissionIds
      };

      if (editingRole) {
        await apiClient.put(
          `${apiRoutes[ApiRouteNames.ROLES]}/${editingRole.id}`,
          payload
        );
        toast.success(
          t("permissions.updateRoleSuccess") || "Role updated successfully"
        );
      } else {
        await apiClient.post(
          apiRoutes[ApiRouteNames.ROLES] ?? "/roles",
          payload
        );
        toast.success(t("permissions.createRoleSuccess"));
      }
      setCreateRoleModalOpen(false);
      await refetchRoles();
    } catch (e) {
      console.error(e);
      toast.error(
        editingRole
          ? t("permissions.errors.updateRoleFailed") || "Failed to update role"
          : t("permissions.errors.createRoleFailed")
      );
    } finally {
      setCreatingRole(false);
    }
  };

  const deleteRole = (role: RoleOutput) => {
    if (role.isSystem) {
      toast.error(t("permissions.errors.cannotDeleteSystemRole"));
      return;
    }
    setRoleToDelete(role);
  };

  const handleDeleteRoleConfirm = async (secretKey: string) => {
    if (!roleToDelete) return;
    setDeletingRoleId(roleToDelete.id);
    try {
      await apiClient.delete(
        `${apiRoutes[ApiRouteNames.ROLES]}/${roleToDelete.id}`,
        {
          data: { secretKey }
        }
      );
      toast.success(t("permissions.deleteRoleSuccess"));
      await refetchRoles();
      setRoleToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error(t("permissions.errors.deleteRoleFailed"));
    } finally {
      setDeletingRoleId(null);
    }
  };

  // ---- Computed Values ----
  const filteredPermissions = epSearch.trim()
    ? endpointPermissions.filter(
        ep =>
          ep.module.toLowerCase().includes(epSearch.toLowerCase()) ||
          ep.method.toLowerCase().includes(epSearch.toLowerCase()) ||
          ep.pathPattern.toLowerCase().includes(epSearch.toLowerCase()) ||
          ep.permission.toLowerCase().includes(epSearch.toLowerCase())
      )
    : endpointPermissions;

  const groupedPermissions = _.groupBy(filteredPermissions, "module");
  const sortedModules = _.sortBy(Object.keys(groupedPermissions));

  const permissionOptions = _(endpointPermissions)
    .groupBy("module")
    .entries()
    .sortBy(([module]) => module)
    .flatMap(([module, eps]) =>
      _.sortBy(eps, ["permission", "method"]).map(ep => ({
        value: ep.id,
        label: ep.permission,
        description: `${ep.method} ${ep.pathPattern}`,
        group: module
      }))
    )
    .value();

  const departmentOptions = [
    { value: "all", label: t("permissions.allDepartments") },
    ...departments.map(d => ({
      value: d.id,
      label: getLocalizedOrganizationName(d, i18n.language)
    }))
  ];

  const groupedRoles: {
    deptId: string;
    deptName: string;
    roles: RoleOutput[];
  }[] = [];

  const globalRoles = roles.filter(
    r => !r.departmentIds || r.departmentIds.length === 0
  );
  if (globalRoles.length > 0) {
    groupedRoles.push({
      deptId: "all",
      deptName: t("permissions.allDepartments") || "All Departments",
      roles: globalRoles
    });
  }

  departments.forEach(dept => {
    const deptRoles = roles.filter(
      r => r.departmentIds && r.departmentIds.includes(dept.id)
    );
    if (deptRoles.length > 0) {
      groupedRoles.push({
        deptId: dept.id,
        deptName: getLocalizedOrganizationName(dept, i18n.language),
        roles: deptRoles
      });
    }
  });

  // ---- Render ----
  if (modulesLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CustomLoader />
      </div>
    );
  }

  return (
    <div className="pr-5 md:pr-[50px] md:pl-0">
      <PageTopBar title={t("permissions.title")} Icon={Shield} />

      <Tabs defaultValue="rbac" className="w-full mt-4">
        <TabsList className="flex border-b border-gray-200 mb-6 justify-start gap-4 h-auto p-0 bg-transparent rounded-none flex-wrap">
          <TabsTrigger
            value="rbac"
            className="px-1 py-2.5 md:px-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent data-[state=active]:bg-transparent shadow-none"
          >
            {t("permissions.rbacTab")}
          </TabsTrigger>
          <TabsTrigger
            value="abac"
            className="py-2.5 px-1 md:px-4 text-sm font-semibold border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none bg-transparent data-[state=active]:bg-transparent shadow-none"
          >
            {t("permissions.abacTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="rbac"
          className="space-y-6 mt-0 focus-visible:ring-0 focus-visible:outline-none"
        >
          {/* Section 1: How Authorization Works */}
          <section className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900 flex gap-3">
            <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="font-semibold">{t("permissions.howItWorks")}</div>
              <div>
                <span className="font-medium">
                  {t("permissions.step1Title")}:{" "}
                </span>
                {t("permissions.step1Desc")}
              </div>
              <div>
                <span className="font-medium">
                  {t("permissions.step2Title")}:{" "}
                </span>
                {t("permissions.step2Desc")}
              </div>
              <div>
                <span className="font-medium">
                  {t("permissions.step3Title")}:{" "}
                </span>
                {t("permissions.step3Desc")}
              </div>
            </div>
          </section>

          {/* Section 2: Endpoint Permission Rules (Module-Grouped Table) */}
          <section className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Route size={20} />
                  {t("permissions.endpointPermissions")}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  value={epSearch}
                  onChange={e => setEpSearch(e.target.value)}
                  placeholder={t("permissions.searchEndpointRules")}
                  className="h-9 w-44 md:w-64"
                />
                <Button onClick={openAddEp} className="flex items-center gap-2">
                  <PlusCircle size={18} />
                  {t("permissions.addEndpointRule")}
                </Button>
              </div>
            </div>

            <div className="neumorphic-table-wrapper">
              {epLoading ? (
                <div className="flex items-center justify-center py-12">
                  <CustomLoader />
                </div>
              ) : sortedModules.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {t("common.noData")}
                </div>
              ) : (
                <div>
                  {sortedModules.map(moduleName => {
                    const items = groupedPermissions[moduleName];
                    const isExpanded = expandedModules.has(moduleName);
                    return (
                      <div
                        key={moduleName}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <div className="min-w-[800px]">
                          <button
                            onClick={() => toggleModuleExpanded(moduleName)}
                            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                          {isExpanded ? (
                            <ChevronDown size={18} className="text-gray-600" />
                          ) : (
                            <ChevronRight size={18} className="text-gray-600" />
                          )}
                          <span className="font-semibold text-gray-800">
                            {moduleName}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded bg-violet-100 text-violet-800 text-xs font-medium">
                            {items.length}
                          </span>
                          </button>
                        </div>
                        {isExpanded && (
                          <table className="neumorphic-table min-w-[800px]">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="text-left p-3 font-semibold text-gray-700 w-[90px]">
                                  {t("permissions.endpointMethod")}
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700 min-w-[200px]">
                                  {t("permissions.endpointPathPattern")}
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700 min-w-[140px]">
                                  {t("permissions.permissionName")}
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700 min-w-[150px]">
                                  {t("permissions.descriptionLabel")}
                                </th>
                                <th className="p-3 w-[140px]">
                                  {t("permissions.actions")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map(ep => (
                                <tr
                                  key={ep.id}
                                  className="border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                                >
                                  <td className="p-3">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${methodBadgeColor(
                                        ep.method
                                      )}`}
                                    >
                                      {ep.method}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-sm text-gray-800">
                                    {ep.pathPattern}
                                  </td>
                                  <td className="p-3 text-gray-700">
                                    {ep.permission}
                                  </td>
                                  <td className="p-3 text-gray-600 text-sm">
                                    {ep.description ?? "—"}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditEp(ep)}
                                      >
                                        <Pencil size={14} className="mr-1" />
                                        {t("common.edit")}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteEp(ep.id)}
                                        disabled={deletingEpId === ep.id}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                      >
                                        <Trash2 size={14} className="mr-1" />
                                        {t("common.delete")}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Dynamic Rule Creation/Edition Modal */}
          <Dialog open={epModalOpen} onOpenChange={setEpModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingEp
                    ? t("permissions.editEndpointRule")
                    : t("permissions.addEndpointRule")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.moduleLabel")} *
                  </label>
                  <Select
                    value={epModule}
                    onValueChange={val => {
                      setEpModule(val);
                      setEpPathPattern("");
                      fetchDiscoveredRoutes(val);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("permissions.selectModule")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map(m => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.displayName || m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.endpointMethod")} *
                  </label>
                  <Select value={epMethod} onValueChange={setEpMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HTTP_METHODS.map(m => (
                        <SelectItem key={m} value={m}>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold mr-2 ${methodBadgeColor(
                              m
                            )}`}
                          >
                            {m}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.endpointPathPattern")} *
                  </label>
                  {!epModule ? (
                    <Input
                      disabled
                      placeholder={t("permissions.selectModuleFirst")}
                      className="bg-gray-50"
                    />
                  ) : routesLoading ? (
                    <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-gray-50">
                      <CustomLoader />
                      <span className="text-sm text-gray-500">
                        {t("permissions.loadingRoutes")}
                      </span>
                    </div>
                  ) : discoveredRoutes.length > 0 ? (
                    <Select
                      value={epPathPattern}
                      onValueChange={setEpPathPattern}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("permissions.selectPath")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {discoveredRoutes.map((route, idx) => (
                          <SelectItem
                            key={`${route.method}-${route.path}-${idx}`}
                            value={route.path}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{route.path}</span>
                              {route.isAssigned ? (
                                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  {t("permissions.assigned")}
                                </span>
                              ) : (
                                <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {t("permissions.unassigned")}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={epPathPattern}
                      onChange={e => setEpPathPattern(e.target.value)}
                      placeholder="/users/:id"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.permissionName")} *
                  </label>
                  <Select
                    value={epPermission}
                    onValueChange={setEpPermission}
                    disabled={!epModule}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("permissions.selectPermission")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_ENUM.map(p => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.descriptionLabel")}
                  </label>
                  <Input
                    value={epDescription}
                    onChange={e => setEpDescription(e.target.value)}
                    placeholder={t("permissions.descriptionPlaceholder")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEpModalOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={saveEp}
                  disabled={
                    savingEp ||
                    !epModule ||
                    !epPathPattern.trim() ||
                    !epPermission
                  }
                >
                  {savingEp
                    ? t("common.saving")
                    : editingEp
                      ? t("common.update")
                      : t("common.addNew")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Section 4: Role-Permission Assignment */}
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <UserCog size={20} />
                {t("permissions.roleManagement")}
              </h2>
              <Button
                onClick={openCreateRole}
                className="flex items-center gap-2"
              >
                <PlusCircle size={18} />
                {t("permissions.createRole")}
              </Button>
            </div>
            <div className="neumorphic-table-wrapper">
              {groupedRoles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {t("common.noData")}
                </div>
              ) : (
                <div>
                  {groupedRoles.map(group => {
                    const isExpanded = expandedRoleDepts.has(group.deptId);
                    return (
                      <div
                        key={group.deptId}
                        className="border-b border-gray-200 last:border-b-0"
                      >
                        <div className="min-w-[700px]">
                          <button
                            onClick={() => toggleRoleDeptExpanded(group.deptId)}
                            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown size={18} className="text-gray-600" />
                            ) : (
                              <ChevronRight size={18} className="text-gray-600" />
                            )}
                            <span className="font-semibold text-gray-800">
                              {group.deptName}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                              {group.roles.length}
                            </span>
                            </button>
                          </div>
                        {isExpanded && (
                          <table className="neumorphic-table min-w-[700px]">
                            <thead className="bg-gray-100 border-b border-gray-200">
                              <tr>
                                <th className="text-left p-3 font-semibold text-gray-700 min-w-[200px]">
                                  {t("permissions.roleName")}
                                </th>
                                <th className="text-left p-3 font-semibold text-gray-700 min-w-[250px]">
                                  {t("permissions.permissions")}
                                </th>
                                <th className="p-3 min-w-[200px]">
                                  {t("permissions.actions")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.roles.map(role => {
                                const currentIds =
                                  role.endpointPermissionIds ?? [];
                                const draftIds =
                                  rolePermDraft[role.id] ?? currentIds;
                                const same =
                                  draftIds.length === currentIds.length &&
                                  draftIds.every(id => currentIds.includes(id));
                                return (
                                  <tr
                                    key={role.id}
                                    className="border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                                  >
                                    <td className="p-3">
                                      <div className="text-gray-900 font-medium">
                                        {role.name}
                                      </div>
                                      {role.description && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {role.description}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <CustomSelect
                                        options={permissionOptions}
                                        multiSelect
                                        value={draftIds}
                                        onValueChange={val =>
                                          setRolePermDraft(prev => ({
                                            ...prev,
                                            [role.id]: Array.isArray(val)
                                              ? val
                                              : val
                                                ? [val]
                                                : []
                                          }))
                                        }
                                        placeholder={t(
                                          "permissions.selectPermissions"
                                        )}
                                        translateLabels={false}
                                        className="w-full md:max-w-[80%]"
                                        triggerClassName="h-9 text-sm"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          disabled={
                                            savingRoleId === role.id || same
                                          }
                                          onClick={() =>
                                            updateRolePermissions(role.id)
                                          }
                                        >
                                          {savingRoleId === role.id
                                            ? t("common.saving")
                                            : t("common.save")}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openEditRole(role)}
                                        >
                                          <Pencil size={14} className="mr-1" />
                                          {t("common.edit")}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => deleteRole(role)}
                                          disabled={
                                            deletingRoleId === role.id ||
                                            role.isSystem
                                          }
                                          className={
                                            role.isSystem
                                              ? "opacity-50 cursor-not-allowed"
                                              : "text-red-600 border-red-200 hover:bg-red-50"
                                          }
                                        >
                                          <Trash2 size={14} className="mr-1" />
                                          {t("common.delete")}
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Create/Edit Role Modal */}
          <Dialog
            open={createRoleModalOpen}
            onOpenChange={setCreateRoleModalOpen}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingRole
                    ? t("permissions.editRole") || "Edit Role"
                    : t("permissions.createRole")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.roleName")} *
                  </label>
                  <Input
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    placeholder={t("permissions.roleNamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.descriptionLabel")}
                  </label>
                  <Input
                    value={newRoleDescription}
                    onChange={e => setNewRoleDescription(e.target.value)}
                    placeholder={t("permissions.descriptionPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.departments")}
                  </label>
                  <CustomSelect
                    options={departmentOptions}
                    multiSelect
                    value={newRoleDepartmentIds}
                    onValueChange={val =>
                      setNewRoleDepartmentIds(
                        Array.isArray(val) ? val : val ? [val] : []
                      )
                    }
                    placeholder={t("permissions.selectDepartments")}
                    translateLabels={false}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("permissions.departmentsHint")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("permissions.permissions")} *
                  </label>
                  <CustomSelect
                    options={permissionOptions}
                    multiSelect
                    value={newRolePermissionIds}
                    onValueChange={val =>
                      setNewRolePermissionIds(
                        Array.isArray(val) ? val : val ? [val] : []
                      )
                    }
                    placeholder={t("permissions.selectPermissions")}
                    translateLabels={false}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateRoleModalOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={saveRole}
                  disabled={creatingRole || !newRoleName.trim()}
                >
                  {creatingRole
                    ? t("common.saving")
                    : editingRole
                      ? t("common.update") || "Update"
                      : t("common.addNew")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Ep Dialog */}
          <SecretKeyConfirmDialog
            open={!!epToDelete}
            onOpenChange={isOpen => {
              if (!isOpen) setEpToDelete(null);
            }}
            title={
              t("permissions.confirmDeleteEndpointRule") ||
              "Confirm delete endpoint rule?"
            }
            description={
              t("permissions.secretKeyDeleteDesc") ||
              "Please enter the secret key to confirm deletion of this endpoint permission."
            }
            onConfirm={handleDeleteEpConfirm}
            loading={!!deletingEpId}
          />

          {/* Delete Role Dialog */}
          <SecretKeyConfirmDialog
            open={!!roleToDelete}
            onOpenChange={isOpen => {
              if (!isOpen) setRoleToDelete(null);
            }}
            title={t("permissions.confirmDeleteRole") || "Confirm delete role?"}
            description={
              t("permissions.secretKeyDeleteRoleDesc") ||
              "Please enter the secret key to confirm deletion of this role."
            }
            onConfirm={handleDeleteRoleConfirm}
            loading={!!deletingRoleId}
          />

          {/* Section 5: User-Role Assignment */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Users size={20} />
              {t("permissions.userRoleAssignment")}
            </h2>
            <UsersRoleDataList roles={roles} departments={departments} />
          </section>
        </TabsContent>

        <TabsContent
          value="abac"
          className="mt-0 focus-visible:ring-0 focus-visible:outline-none"
        >
          <AbacPoliciesList roles={roles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
