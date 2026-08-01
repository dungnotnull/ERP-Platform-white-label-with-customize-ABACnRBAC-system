import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LocalizedOrganizationNameText } from "@/components/LocalizedOrganizationNameText";
import PageTopBar from "@/components/PageTopBar";
import { ListOrderedIcon } from "lucide-react";
import BackButton from "@/components/BackButton";
import CustomLoader from "@/components/ui/CustomLoader";
import { toast } from "react-toastify";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import EmployeeDevicesPanel from "@/pages/employees/partials/EmployeeDevicesPanel";
import { fetchEmployeeDetail } from "@/shared/utils/employeeDevice.util";
import { queryKeys } from "@/shared/queries/keys";
import { invalidateInternalUsersQueries } from "@/shared/queries/internalUser.queries";

export default function EmployeeDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: employee,
    isLoading,
    refetch
  } = useQuery({
    queryKey: queryKeys.employeeDetail(id ?? ""),
    queryFn: async () => {
      try {
        return await fetchEmployeeDetail(id!);
      } catch (err) {
        toast.error(resolveApiErrorMessage(err, t, "employees.loadFailed"));
        throw err;
      }
    },
    enabled: Boolean(id)
  });

  const reloadEmployee = async () => {
    await refetch();
    await invalidateInternalUsersQueries(queryClient);
  };

  if (isLoading || !employee) {
    return (
      <div className="flex items-center justify-center py-12 h-screen">
        <CustomLoader />
      </div>
    );
  }

  return (
    <>
      <div className="pr-5 md:pr-[50px] md:pl-0">
        <PageTopBar
          title={t("employees.detailEmployee")}
          description={t("employees.detailEmployee")}
          Icon={ListOrderedIcon}
        />

        <BackButton className="gap-2" />
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <strong>{t("employees.name")}:</strong> {employee.name}
        </div>
        <div>
          <strong>{t("employees.email")}:</strong> {employee.email}
        </div>
        <div>
          <strong>{t("employees.code")}:</strong> {employee.employeeCode}
        </div>

        <div>
          <strong>{t("employees.department.label")}:</strong>{" "}
          <LocalizedOrganizationNameText
            item={employee.department}
            fallback="-"
          />
        </div>
        <div>
          <strong>{t("employees.position.label")}:</strong>{" "}
          <LocalizedOrganizationNameText
            item={employee.position}
            fallback="-"
          />
        </div>
        <div>
          <strong>{t("employees.status.label")}:</strong>{" "}
          {employee.isActive
            ? t("employees.status.active")
            : t("employees.status.inactive")}
        </div>
      </div>

      <div className="px-6 pb-6">
        <EmployeeDevicesPanel
          devices={employee.assignedDevices ?? []}
          onDevicesChanged={reloadEmployee}
        />
      </div>
    </>
  );
}
