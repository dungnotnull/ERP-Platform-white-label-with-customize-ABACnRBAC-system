import type { MouseEvent } from "react";
import { Briefcase, Building2, CirclePlus } from "lucide-react";
import type { TFunction } from "i18next";
import { useLocalizedOrganizationName } from "@/hooks/useLocalizedOrganizationName";
import { MultilineScrollText } from "@/components/cells/multilineScrollTextCell";

type AssignField = "department" | "position";

interface EmployeeRow {
  department?: {
    id?: string;
    name?: string;
    nameVi?: string;
    nameJa?: string;
    code?: string;
  } | null;
  position?: {
    id?: string;
    name?: string;
    nameVi?: string;
    nameJa?: string;
  } | null;
  departmentId?: string;
  positionId?: string;
}

interface EmployeeAssignFieldCellProps {
  row: EmployeeRow;
  field: AssignField;
  onAssign: (field: AssignField) => void;
  t: TFunction;
}

function hasDepartment(row: EmployeeRow): boolean {
  return Boolean(
    row.department?.id ||
      row.department?.nameVi ||
      row.department?.name ||
      row.departmentId
  );
}

function hasPosition(row: EmployeeRow): boolean {
  return Boolean(
    row.position?.id ||
      row.position?.nameVi ||
      row.position?.name ||
      row.positionId
  );
}

export default function EmployeeAssignFieldCell({
  row,
  field,
  onAssign,
  t
}: EmployeeAssignFieldCellProps) {
  const isDepartment = field === "department";
  const assigned = isDepartment ? hasDepartment(row) : hasPosition(row);
  const FieldIcon = isDepartment ? Building2 : Briefcase;
  const departmentLabel = useLocalizedOrganizationName(row.department);
  const positionLabel = useLocalizedOrganizationName(row.position);

  const label = isDepartment
    ? departmentLabel || row.department?.code || "—"
    : positionLabel || "—";

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onAssign(field);
  };

  if (!assigned) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-amber-400 bg-amber-50 px-2 py-1 text-sm font-medium text-amber-800 transition-colors hover:border-amber-500 hover:bg-amber-100"
        onClick={handleClick}
        aria-label={
          isDepartment
            ? t("employees.department.assign")
            : t("employees.position.assign")
        }
      >
        <CirclePlus className="h-4 w-4 shrink-0" aria-hidden />
        <FieldIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span>
          {isDepartment
            ? t("employees.department.assign")
            : t("employees.position.assign")}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full min-w-0 items-start gap-1.5 text-left text-gray-900 transition-colors hover:text-blue-700 hover:underline"
      onClick={handleClick}
    >
      <FieldIcon
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400"
        aria-hidden
      />
      <MultilineScrollText value={label} className="flex-1 min-w-0" />
    </button>
  );
}
