import { Button } from "@/components/ui/Button";
import { Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DepartmentOverviewItem } from "../types";
import { LocalizedOrganizationNameText } from "@/components/LocalizedOrganizationNameText";

interface DepartmentsManageListProps {
  departments: DepartmentOverviewItem[];
  onEdit: (department: DepartmentOverviewItem) => void;
  onDelete: (department: DepartmentOverviewItem) => void;
}

export default function DepartmentsManageList({
  departments,
  onEdit,
  onDelete
}: DepartmentsManageListProps) {
  const { t } = useTranslation();

  const manageable = departments.filter(d => d.id !== "__unassigned__");

  if (manageable.length === 0) {
    return <p className="text-sm text-gray-500 py-4">{t("common.noData")}</p>;
  }

  return (
    <div className="neumorphic-table-wrapper">
      <table className="neumorphic-table">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm">
            <th className="p-3">{t("teams.departmentForm.code")}</th>
            <th className="p-3">{t("teams.departmentForm.name")}</th>
            <th className="p-3">{t("teams.employeeCount")}</th>
            <th className="p-3 w-[140px]">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {manageable.map(department => (
            <tr key={department.id} className="border-b last:border-b-0">
              <td className="p-3 font-medium">{department.code}</td>
              <td className="p-3">
                <LocalizedOrganizationNameText item={department} />
              </td>
              <td className="p-3">{department.employeeCount}</td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(department)}
                    aria-label={t("common.edit")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDelete(department)}
                    aria-label={t("common.delete")}
                    disabled={department.employeeCount > 0}
                    title={
                      department.employeeCount > 0
                        ? t("teams.deleteDepartment.disabledHint")
                        : undefined
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
