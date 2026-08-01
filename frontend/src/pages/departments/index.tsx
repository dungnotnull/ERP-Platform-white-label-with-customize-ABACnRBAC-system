import PageTopBar from "@/components/PageTopBar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionItemHeader,
  AccordionTriggerOnly
} from "@/components/ui/Accordion";
import {
  AlertTriangle,
  Building,
  Edit,
  Plus,
  Trash2,
  Triangle
} from "lucide-react";
import useResponsive from "@/hooks/useResponsive";
import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import DataListMobile from "@/components/patterns/DataList/mobile";
import { Column } from "@/shared/@types/dataTable.type";
import { withButtonActions } from "@/components/patterns/DataList";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ConfirmAlert } from "@/components/patterns/ConfirmAlert";
import BarChart4 from "@/assets/images/bar-chart-4.png";
import { useTranslation } from "react-i18next";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { extractApiList } from "@/shared/utils/apiResponse.util";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import EmployeeFormModal from "@/pages/employees/partials/EmployeeFormModal";
import { softDeleteInternalUser } from "@/pages/employees/partials/employeeActions.util";
import type { InternalUser } from "@/pages/employees/partials/types";
import { normalizeEmployeeRole } from "@/pages/employees/partials/EmployeeFormSchema";
import { renderEmployeeNameCell } from "@/pages/employees/partials/employeeNameCell";
import { Button } from "@/components/ui/Button";
import DepartmentFormModal from "./partials/DepartmentFormModal";
import PositionFormModal from "./partials/PositionFormModal";
import type { DepartmentOverviewItem } from "./types";
import type { DepartmentFormInitial } from "./partials/DepartmentForm";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import { LocalizedOrganizationNameText } from "@/components/LocalizedOrganizationNameText";

interface DepartmentMemberRow {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  role: string;
  avatarUrl: string;
  isActive: boolean;
  department: { id: string; nameVi: string; nameJa: string };
  position: { id: string; nameVi: string; nameJa: string } | null;
  userRole?: string | null;
}

const Department = () => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DepartmentMemberRow | null>(
    null
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<InternalUser | null>(
    null
  );
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentFormInitial | null>(null);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isDeleteDeptDialogOpen, setIsDeleteDeptDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<DepartmentOverviewItem | null>(null);
  const [isDeletingDept, setIsDeletingDept] = useState(false);
  const { isDesktop } = useResponsive();
  const { t, i18n } = useTranslation();

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-overview", reloadKey],
    queryFn: async () => {
      try {
        const overviewPayload = await apiClient.get(
          apiRoutes[ApiRouteNames.DEPARTMENTS_OVERVIEW]
        );
        return extractApiList<DepartmentOverviewItem>(overviewPayload);
      } catch (error) {
        console.error("Failed to fetch team overview:", error);
        toast.error(t("teams.loadFailed"));
        throw error;
      }
    },
    staleTime: 30_000
  });

  const positions = useMemo(() => {
    const byId = new Map<
      string,
      NonNullable<DepartmentOverviewItem["employees"][number]["position"]>
    >();
    for (const department of departments) {
      for (const employee of department.employees) {
        if (employee.position?.id) {
          byId.set(employee.position.id, employee.position);
        }
      }
    }
    return [...byId.values()];
  }, [departments]);

  const mapEmployeeRow = (
    department: DepartmentOverviewItem,
    user: DepartmentOverviewItem["employees"][number]
  ): DepartmentMemberRow => ({
    id: user.id,
    name: user.name || "N/A",
    email: user.email || "",
    employeeCode: user.employeeCode || "",
    role: user.position
      ? getLocalizedOrganizationName(user.position, i18n.language)
      : "—",
    avatarUrl: "",
    isActive: user.isActive ?? true,
    department: {
      id: department.id,
      nameVi: department.nameVi,
      nameJa: department.nameJa
    },
    position: user.position
      ? {
          id: user.position.id,
          nameVi: user.position.nameVi,
          nameJa: user.position.nameJa
        }
      : null,
    userRole: user.role ?? null
  });

  const columns: Column<DepartmentMemberRow>[] = [
    {
      id: "avatarUrl",
      header: "",
      accessor: "avatarUrl"
    },
    {
      id: "name",
      header: t("employees.name"),
      accessor: "name",
      sortable: true,
      maxWidth: 220,
      cellClassName: "max-w-[220px]",
      cell: value => renderEmployeeNameCell(value)
    },
    {
      id: "email",
      header: t("employees.email"),
      accessor: "email"
    },
    {
      id: "employeeCode",
      header: t("employees.code"),
      accessor: "employeeCode"
    },
    {
      id: "role",
      header: t("employees.position.label"),
      accessor: "role"
    }
  ];

  const toInternalUser = (row: DepartmentMemberRow): InternalUser => ({
    id: row.id,
    name: row.name,
    email: row.email,
    employeeCode: row.employeeCode,
    department: row.department,
    position: row.position,
    role: normalizeEmployeeRole(row.userRole),
    isActive: row.isActive
  });

  const handleEditAction = (rowData?: DepartmentMemberRow) => {
    if (rowData) {
      setEditingEmployee(toInternalUser(rowData));
      setIsEmployeeModalOpen(true);
    }
  };

  const handleDeleteAction = (rowData?: DepartmentMemberRow) => {
    setUserToDelete(rowData ?? null);
    setIsDeleteDialogOpen(true);
  };

  const teamColumns = withButtonActions<DepartmentMemberRow>(columns, {
    onEdit: handleEditAction,
    onDelete: handleDeleteAction
  });

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await softDeleteInternalUser(userToDelete.id);
      toast.success(t("employees.delete.success", { name: userToDelete.name }));
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      setReloadKey(key => key + 1);
    } catch (error) {
      console.error("Delete user error:", error);
      toast.error(resolveApiErrorMessage(error, t, "employees.delete.failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmployeeFormSuccess = () => {
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
    setReloadKey(key => key + 1);
  };

  const handleDepartmentFormSuccess = () => {
    setEditingDepartment(null);
    setReloadKey(key => key + 1);
  };

  const handlePositionFormSuccess = () => {
    setReloadKey(key => key + 1);
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsDepartmentModalOpen(true);
  };

  const handleEditDepartment = (department: DepartmentOverviewItem) => {
    setEditingDepartment({
      id: department.id,
      code: department.code,
      nameVi: department.nameVi,
      nameJa: department.nameJa,
      description: department.description
    });
    setIsDepartmentModalOpen(true);
  };

  const handleDeleteDepartment = (department: DepartmentOverviewItem) => {
    setDepartmentToDelete(department);
    setIsDeleteDeptDialogOpen(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return;
    setIsDeletingDept(true);
    try {
      await apiClient.delete(
        `${apiRoutes[ApiRouteNames.DEPARTMENTS]}/${departmentToDelete.id}`
      );
      toast.success(
        t("teams.deleteDepartment.success", {
          name: getLocalizedOrganizationName(departmentToDelete, i18n.language)
        })
      );
      setIsDeleteDeptDialogOpen(false);
      setDepartmentToDelete(null);
      setReloadKey(key => key + 1);
    } catch (error) {
      console.error("Delete department error:", error);
      toast.error(
        resolveApiErrorMessage(error, t, "teams.deleteDepartment.failed")
      );
    } finally {
      setIsDeletingDept(false);
    }
  };

  const departmentsForForm = departments.map(d => ({
    id: d.id,
    nameVi: d.nameVi,
    nameJa: d.nameJa,
    code: d.code
  }));

  return (
    <div className="pr-4 md:pr-[50px] md:pl-0">
      <PageTopBar
        title={t("teams.title")}
        description={t("teams.description")}
        Icon={Building}
        headerActions={
          <>
            <Button
              type="button"
              className="w-full md:w-auto h-[50px] md:h-[50px] text-sm md:text-base flex items-center gap-2 md:gap-3 rounded-[50px]"
              onClick={handleAddDepartment}
            >
              <Plus size={28} className="md:size-[35px]" />
              {t("teams.addDepartment")}
            </Button>
            {/* <Button
              type="button"
              className="w-full md:w-[200px] h-[50px] text-sm md:text-base flex items-center gap-3 rounded-[50px]"
              onClick={() => setIsPositionModalOpen(true)}
            >
              <Plus size={35} />
              {t("teams.addPosition")}
            </Button> */}
          </>
        }
      />

      <Accordion
        type="single"
        collapsible
        className="w-full flex flex-col gap-6 md:gap-10"
      >
        {departments.map(department => (
          <AccordionItem
            key={department.id}
            value={String(department.id)}
            className="border-none"
          >
            <AccordionItemHeader
              className="    group
    relative
    overflow-hidden

    border-cyan-800
    border-l-[4px]
    bg-gradient-to-r
    from-white
    via-[#f8fbff]
    to-[#eef5ff]
    hover:border-cyan-500
    transition-all
    hover:shadow-[0_10px_30px_rgba(37,99,235,0.12)]
    shadow-[0px_4px_30px_0px_rgba(31,_38,_135,_0.15)]
    "
            >
              <AccordionTriggerOnly
                hiddenIcon
                className="justify-start items-center gap-4 md:gap-10 hover:no-underline px-4 py-4 md:px-[50px]"
              >
                <Triangle size={20} fill="#172554" className="md:size-[27px]" />
                <img
                  src={BarChart4}
                  alt={getLocalizedOrganizationName(department, i18n.language)}
                  className="w-[40px] aspect-square md:w-[50px]"
                />
                <span className="text-primary uppercase text-[18px] md:text-[30px] font-extrabold">
                  <LocalizedOrganizationNameText item={department} />
                </span>
                <span className="text-gray-400 text-[12px] md:text-[16px] font-extrabold">
                  ({t("teams.memberCount", { count: department.employeeCount })}
                  )
                </span>
              </AccordionTriggerOnly>
              {department.id !== "__unassigned__" && (
                <div className="flex items-center gap-2 shrink-0 pr-4 md:pr-[50px]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t("common.edit")}
                    onClick={() => handleEditDepartment(department)}
                  >
                    <Edit className="h-8 w-8" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t("common.delete")}
                    disabled={department.employeeCount > 0}
                    title={
                      department.employeeCount > 0
                        ? t("teams.deleteDepartment.disabledHint")
                        : undefined
                    }
                    onClick={() => handleDeleteDepartment(department)}
                  >
                    <Trash2 className="h-8 w-8" />
                  </Button>
                </div>
              )}
            </AccordionItemHeader>

            <AccordionContent className="flex flex-col gap-4 text-balance pt-4">
              {isDesktop ? (
                <div className="overflow-hidden">
                  <DataListDesktopUI<DepartmentMemberRow>
                    data={department.employees.map(user =>
                      mapEmployeeRow(department, user)
                    )}
                    columns={teamColumns}
                    isLoading={false}
                    emptyMessage={t("common.noData")}
                  />
                </div>
              ) : (
                <DataListMobile<DepartmentMemberRow & { action?: unknown }>
                  data={department.employees.map(user =>
                    mapEmployeeRow(department, user)
                  )}
                  triggerConfig={{
                    accessor: "name",
                    accessorSecondary: "email"
                  }}
                  columns={teamColumns}
                  isLoading={false}
                  emptyMessage={t("common.noData")}
                  hideTriggerLabel
                />
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <EmployeeFormModal
        open={isEmployeeModalOpen}
        onOpenChange={setIsEmployeeModalOpen}
        employeeToEdit={editingEmployee}
        onSuccess={handleEmployeeFormSuccess}
        departments={departmentsForForm}
        positions={positions}
      />

      <DepartmentFormModal
        open={isDepartmentModalOpen}
        onOpenChange={setIsDepartmentModalOpen}
        departmentToEdit={editingDepartment}
        onSuccess={handleDepartmentFormSuccess}
      />

      <PositionFormModal
        open={isPositionModalOpen}
        onOpenChange={setIsPositionModalOpen}
        onSuccess={handlePositionFormSuccess}
      />

      <ConfirmAlert
        open={isDeleteDialogOpen}
        title={t("employees.delete.title", {
          name: userToDelete?.name ?? ""
        })}
        onConfirm={confirmDelete}
        confirmText={t("common.delete")}
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={isDeleting}
        icon={
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        }
        onOpenChange={setIsDeleteDialogOpen}
      />

      <ConfirmAlert
        open={isDeleteDeptDialogOpen}
        title={t("teams.deleteDepartment.title", {
          name: getLocalizedOrganizationName(departmentToDelete, i18n.language)
        })}
        onConfirm={confirmDeleteDepartment}
        confirmText={t("common.delete")}
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={isDeletingDept}
        icon={
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        }
        onOpenChange={setIsDeleteDeptDialogOpen}
      />
    </div>
  );
};

export default Department;
