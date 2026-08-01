import { useState } from "react";
import { useUrlListFilters } from "@/hooks/useUrlListFilters";
import { IdCardIcon, PlusCircle } from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import EmployeesDataList from "@/pages/employees/partials/EmployeesDataList.tsx";
import ImportEmployees from "./partials/ImportEmployees";
import ExportEmployees from "./partials/ExportEmployees";
import EmployeesFilter from "./partials/EmployeesFilter";
import EmployeeFormModal from "./partials/EmployeeFormModal";
import type { InternalUser } from "./partials/types";
import {
  useDepartmentsListQuery,
  usePositionsQuery
} from "@/shared/queries/organization.queries";
import NoteDialog from "@/components/ui/NoteDialog";

const initialFilters = {
  status: "all",
  department: "all",
  position: "all",
  search: ""
};

interface Filters {
  status: string;
  department: string;
  position: string;
  search: string;
}

export type FilterKey = keyof Filters | "reset";
export type HandleFilterChange = (key: FilterKey, value?: string) => void;

const EMPLOYEE_FILTER_URL_CONFIG = {
  keys: ["status", "department", "position", "search"] as (keyof Filters)[],
  urlKeys: { search: "q" } as Partial<Record<keyof Filters, string>>,
  searchKeys: ["search"] as (keyof Filters)[],
  omitWhen: {
    status: "all",
    department: "all",
    position: "all"
  } as Partial<Record<keyof Filters, string>>
};

export default function EmployeesManagement() {
  const { t } = useTranslation();
  const {
    draftFilters,
    appliedFilters,
    handleFilterChange,
    handleApplyFilters
  } = useUrlListFilters(initialFilters, EMPLOYEE_FILTER_URL_CONFIG);
  const [reloadDataKey, setReloadDataKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<InternalUser | null>(
    null
  );
  const { data: departments = [] } = useDepartmentsListQuery();
  const { data: positions = [] } = usePositionsQuery();

  const handleImportSuccess = () => {
    setReloadDataKey(prev => prev + 1);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: InternalUser) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setReloadDataKey(prev => prev + 1);
  };

  return (
    <div className="pr-5 md:pr-[50px] md:pl-0 ">
      <PageTopBar
        title={t("employees.title")}
        description={t("employees.description")}
        Icon={IdCardIcon}
        // searchToolbar
        // onSearch={() => {}}
      />

      <EmployeesFilter
        filters={draftFilters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        departments={departments}
        positions={positions}
      />

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <ImportEmployees onImportSuccess={handleImportSuccess} />
        <ExportEmployees />
        <Button
          onClick={handleAdd}
          className=" hover:bg-blue-900"
          size="default"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("employees.addEmployee")}
        </Button>
        {/* <Button
          onClick={() => navigate("/employee/device-summary")}
          className="hover:bg-blue-900"
        >
          <BarChart2 className="mr-2 h-4 w-4" />
          {t("assets.deviceReport")}
        </Button> */}
        {/* <Button
          onClick={() => navigate("/employee/device-requests")}
          className="hover:bg-blue-900"
        >
          <ListChecksIcon className="mr-2 h-4 w-4" />
          {t("device.requests.list")}
        </Button> */}
        <div className="flex justify-end flex-1">
          <NoteDialog
            title="employees.notes.title"
            content="employees.notes.content"
            triggerLabel="employees.notes.trigger"
          />
        </div>
      </div>

      <EmployeesDataList
        filters={appliedFilters}
        reloadKey={reloadDataKey}
        onEdit={handleEdit}
        onReload={() => setReloadDataKey(prev => prev + 1)}
        departments={departments}
        positions={positions}
      />

      <EmployeeFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        employeeToEdit={editingEmployee}
        onSuccess={handleFormSuccess}
        departments={departments}
        positions={positions}
      />
    </div>
  );
}
