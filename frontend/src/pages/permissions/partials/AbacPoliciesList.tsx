import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ShieldAlert,
  Settings2,
  Plus,
  Trash,
  CheckCircle2,
  XCircle
} from "lucide-react";
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
import CustomSelect from "@/components/patterns/CustomSelect";
import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { toast } from "react-toastify";
import type { AbacPolicy, PolicyCondition } from "@/shared/@types/abac.type";
import type { RoleOutput } from "@/shared/@types/permission.type";
import { SecretKeyConfirmDialog } from "@/components/patterns/SecretKeyConfirmDialog";
import CustomLoader from "@/components/ui/CustomLoader";

interface Props {
  roles: RoleOutput[];
}

export function AbacPoliciesList({ roles }: Props) {
  const { t } = useTranslation();

  const RESOURCES = [
    { value: "device", label: t("abac.resources.device") },
    { value: "supplier", label: t("abac.resources.supplier") },
    { value: "user", label: t("abac.resources.user") },
    { value: "department", label: t("abac.resources.department") },
    { value: "purchase-order", label: t("abac.resources.purchaseOrder") }
  ];

  const ACTIONS_LIST = [
    { value: "create", label: t("abac.actions.create") },
    { value: "read", label: t("abac.actions.read") },
    { value: "update", label: t("abac.actions.update") },
    { value: "delete", label: t("abac.actions.delete") },
    { value: "approve", label: t("abac.actions.approve") },
    { value: "export", label: t("abac.actions.export") },
    { value: "import", label: t("abac.actions.import") }
  ];

  const FIELDS = [
    { value: "resource.departmentId", label: t("abac.fields.resourceDeptId") },
    { value: "resource.createdBy", label: t("abac.fields.resourceCreatedBy") },
    { value: "resource.userId", label: t("abac.fields.resourceUserId") },
    { value: "resource.isActive", label: t("abac.fields.resourceIsActive") },
    { value: "user.departmentId", label: t("abac.fields.userDeptId") },
    { value: "user.role", label: t("abac.fields.userRole") }
  ];

  const OPERATORS = [
    { value: "equals", label: t("abac.operators.equals") },
    { value: "notEquals", label: t("abac.operators.notEquals") },
    { value: "in", label: t("abac.operators.in") },
    { value: "notIn", label: t("abac.operators.notIn") },
    { value: "contains", label: t("abac.operators.contains") },
    { value: "gt", label: t("abac.operators.gt") },
    { value: "lt", label: t("abac.operators.lt") },
    { value: "exists", label: t("abac.operators.exists") }
  ];

  // ---- Policies State ----
  const [policies, setPolicies] = useState<AbacPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // ---- Form State ----
  const [editingPolicy, setEditingPolicy] = useState<AbacPolicy | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [effect, setEffect] = useState<"allow" | "deny">("allow");
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [conditions, setConditions] = useState<PolicyCondition[]>([]);

  // ---- Delete Confirmation State ----
  const [policyToDelete, setPolicyToDelete] = useState<AbacPolicy | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<AbacPolicy[]>(
        apiRoutes[ApiRouteNames.ABAC_POLICIES] ?? "/abac-policies"
      );
      setPolicies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error(t("abac.error.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // ---- Toggle Status ----
  const toggleActiveStatus = async (policy: AbacPolicy) => {
    if (!policy.id && !policy._id) return;
    const targetId = policy.id || policy._id!;
    try {
      await apiClient.put(
        `${apiRoutes[ApiRouteNames.ABAC_POLICIES]}/${targetId}`,
        {
          isActive: !policy.isActive
        }
      );
      toast.success(
        !policy.isActive
          ? t("abac.success.activated")
          : t("abac.success.deactivated")
      );
      await fetchPolicies();
    } catch (e) {
      console.error(e);
      toast.error(t("abac.error.updateStatusFailed"));
    }
  };

  // ---- CRUD Handlers ----
  const openCreateModal = () => {
    setEditingPolicy(null);
    setName("");
    setDescription("");
    setEffect("allow");
    setResource("device");
    setAction("read");
    setSelectedRoleIds([]);
    setConditions([]);
    setModalOpen(true);
  };

  const openEditModal = (policy: AbacPolicy) => {
    setEditingPolicy(policy);
    setName(policy.name);
    setDescription(policy.description ?? "");
    setEffect(policy.effect);
    setResource(policy.resource);
    setAction(policy.action);
    setSelectedRoleIds(policy.roleIds ?? []);
    setConditions(policy.conditions ?? []);
    setModalOpen(true);
  };

  const savePolicy = async () => {
    if (!name.trim() || !resource || !action) {
      toast.error(t("abac.error.fieldsRequired"));
      return;
    }

    for (const c of conditions) {
      if (!c.field || !c.operator) {
        toast.error(t("abac.error.conditionsIncomplete"));
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        effect,
        resource,
        action,
        roleIds: selectedRoleIds,
        conditions
      };

      if (editingPolicy) {
        const targetId = editingPolicy.id || editingPolicy._id!;
        await apiClient.put(
          `${apiRoutes[ApiRouteNames.ABAC_POLICIES]}/${targetId}`,
          payload
        );
        toast.success(t("abac.success.updated"));
      } else {
        await apiClient.post(
          apiRoutes[ApiRouteNames.ABAC_POLICIES] ?? "/abac-policies",
          payload
        );
        toast.success(t("abac.success.created"));
      }
      setModalOpen(false);
      await fetchPolicies();
    } catch (e) {
      console.error(e);
      toast.error(
        editingPolicy
          ? t("abac.error.updateFailed")
          : t("abac.error.createFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const deletePolicy = (policy: AbacPolicy) => {
    setPolicyToDelete(policy);
  };

  const handleDeleteConfirm = async (secretKey: string) => {
    if (!policyToDelete) return;
    const targetId = policyToDelete.id || policyToDelete._id!;
    setDeletingId(targetId);
    try {
      await apiClient.delete(
        `${apiRoutes[ApiRouteNames.ABAC_POLICIES]}/${targetId}`,
        { data: { secretKey } }
      );
      toast.success(t("abac.success.deleted"));
      await fetchPolicies();
      setPolicyToDelete(null);
    } catch (e) {
      console.error(e);
      toast.error(t("abac.error.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Condition Row Helpers ----
  const addConditionRow = () => {
    setConditions(prev => [
      ...prev,
      {
        field: "resource.departmentId",
        operator: "equals",
        value: "{{user.departmentId}}",
        valueType: "template"
      }
    ]);
  };

  const removeConditionRow = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const updateConditionRow = (
    index: number,
    updates: Partial<PolicyCondition>
  ) => {
    setConditions(prev =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    );
  };

  // ---- Computed Values ----
  const filteredPolicies = searchQuery.trim()
    ? policies.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description &&
            p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.action.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : policies;

  const roleOptions = roles.map(r => ({
    value: r.id,
    label: r.name
  }));

  return (
    <div className="space-y-4">
      {/* Search and Action Board */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("abac.searchPlaceholder")}
            className="h-9 w-64"
          />
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <PlusCircle size={18} />
          {t("abac.addPolicy")}
        </Button>
      </div>

      {/* Policies Table */}
      <div className="neumorphic-table-wrapper">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <CustomLoader />
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("abac.noPolicies")}
          </div>
        ) : (
          <table className="neumorphic-table min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm min-w-[180px]">
                  {t("abac.header.nameDesc")}
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm w-[150px]">
                  {t("abac.header.resource")}
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm w-[120px]">
                  {t("abac.header.action")}
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm w-[100px]">
                  {t("abac.header.effect")}
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm min-w-[150px]">
                  {t("abac.header.conditions")}
                </th>
                <th className="text-left p-3 font-semibold text-gray-700 text-sm w-[100px]">
                  {t("abac.header.status")}
                </th>
                <th className="p-3 min-w-[180px] text-right font-semibold text-gray-700 text-sm">
                  {t("abac.header.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map(p => {
                const targetId = p.id || p._id || "";
                return (
                  <tr
                    key={targetId}
                    className="border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                  >
                    <td className="p-3">
                      <div className="text-gray-900 font-semibold text-sm">
                        {p.name}
                      </div>
                      {p.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {p.description}
                        </div>
                      )}
                      {p.roleIds && p.roleIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="text-[10px] text-gray-400 font-medium self-center mr-1">
                            {t("abac.appliesTo")}
                          </span>
                          {p.roleIds.map(rid => {
                            const rObj = roles.find(r => r.id === rid);
                            return (
                              <span
                                key={rid}
                                className="bg-slate-100 text-slate-800 text-[10px] font-medium px-1.5 py-0.5 rounded"
                              >
                                {rObj?.name ?? rid}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="bg-sky-50 text-sky-800 text-xs font-semibold px-2 py-0.5 rounded border border-sky-100 uppercase">
                        {p.resource}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-violet-50 text-violet-800 text-xs font-semibold px-2 py-0.5 rounded border border-violet-100 lowercase">
                        {p.action}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.effect === "allow" ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2 py-0.5 rounded flex items-center w-fit gap-1">
                          <CheckCircle2 size={12} /> Allow
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2 py-0.5 rounded flex items-center w-fit gap-1">
                          <XCircle size={12} /> Deny
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {p.conditions && p.conditions.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {p.conditions.map((c, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 text-xs text-gray-700 font-mono"
                            >
                              <span className="text-gray-900 font-medium">
                                {c.field}
                              </span>
                              <span className="text-indigo-600 font-bold">
                                {c.operator}
                              </span>
                              <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
                                {c.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 italic flex items-center gap-1">
                          <ShieldAlert size={12} /> {t("abac.noConditions")}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleActiveStatus(p)}
                        className="focus:outline-none transition"
                      >
                        {p.isActive ? (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full cursor-pointer hover:bg-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200">
                            Inactive
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(p)}
                        >
                          <Pencil size={14} className="mr-1" />
                          {t("abac.edit")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePolicy(p)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 size={14} className="mr-1" />
                          {t("abac.delete")}
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

      {/* Create / Edit Policy Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy
                ? t("abac.dialog.updateTitle")
                : t("abac.dialog.createTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("abac.form.nameLabel")}
                </label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t("abac.form.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("abac.form.effectLabel")}
                </label>
                <Select
                  value={effect}
                  onValueChange={(val: any) => setEffect(val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allow">
                      {t("abac.form.allow")}
                    </SelectItem>
                    <SelectItem value="deny">{t("abac.form.deny")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t("abac.form.descriptionLabel")}
              </label>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t("abac.form.descriptionPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("abac.form.resourceLabel")}
                </label>
                <Select value={resource} onValueChange={setResource}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("abac.form.resourcePlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t("abac.form.actionLabel")}
                </label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("abac.form.actionPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS_LIST.map(a => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t("abac.form.rolesLabel")}
              </label>
              <CustomSelect
                options={roleOptions}
                multiSelect
                value={selectedRoleIds}
                onValueChange={val =>
                  setSelectedRoleIds(
                    Array.isArray(val) ? val : val ? [val] : []
                  )
                }
                placeholder={t("abac.form.rolesPlaceholder")}
                translateLabels={false}
              />
            </div>

            {/* Conditions Section */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Settings2 size={16} /> {t("abac.form.conditionsTitle")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={addConditionRow}
                >
                  <Plus size={14} className="mr-1" />{" "}
                  {t("abac.form.addCondition")}
                </Button>
              </div>

              {conditions.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-lg bg-slate-50 text-xs text-slate-500">
                  {t("abac.form.noConditions")}
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100"
                    >
                      {/* Field */}
                      <div className="flex-1 min-w-[120px]">
                        <Select
                          value={cond.field}
                          onValueChange={val =>
                            updateConditionRow(idx, { field: val })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELDS.map(f => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator */}
                      <div className="w-[120px]">
                        <Select
                          value={cond.operator}
                          onValueChange={(val: any) =>
                            updateConditionRow(idx, { operator: val })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map(op => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value Type */}
                      <div className="w-[110px]">
                        <Select
                          value={cond.valueType}
                          onValueChange={(val: any) =>
                            updateConditionRow(idx, { valueType: val })
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="static">
                              {t("abac.form.staticValue")}
                            </SelectItem>
                            <SelectItem value="template">
                              {t("abac.form.templateValue")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value */}
                      <div className="flex-1 min-w-[120px]">
                        {cond.valueType === "template" ? (
                          <Select
                            value={cond.value}
                            onValueChange={val =>
                              updateConditionRow(idx, { value: val })
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue
                                placeholder={t("abac.form.valuePlaceholder")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="{{user.id}}">
                                {t("abac.form.templateUserId")}
                              </SelectItem>
                              <SelectItem value="{{user.departmentId}}">
                                {t("abac.form.templateUserDept")}
                              </SelectItem>
                              <SelectItem value="{{user.role}}">
                                {t("abac.form.templateUserRole")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={cond.value}
                            onChange={e =>
                              updateConditionRow(idx, { value: e.target.value })
                            }
                            placeholder={t("abac.form.valuePlaceholder")}
                            className="h-9"
                          />
                        )}
                      </div>

                      {/* Delete Action */}
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => removeConditionRow(idx)}
                        className="text-red-500 border-red-100 hover:bg-red-50 p-2 h-9 w-9"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={savePolicy} disabled={saving || !name.trim()}>
              {saving
                ? t("abac.form.saving")
                : editingPolicy
                  ? t("abac.form.update")
                  : t("abac.form.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <SecretKeyConfirmDialog
        open={!!policyToDelete}
        onOpenChange={isOpen => {
          if (!isOpen) setPolicyToDelete(null);
        }}
        title={t("abac.deleteDialog.title")}
        description={t("abac.deleteDialog.description")}
        onConfirm={handleDeleteConfirm}
        loading={!!deletingId}
      />
    </div>
  );
}
