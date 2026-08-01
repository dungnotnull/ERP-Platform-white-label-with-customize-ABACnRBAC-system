import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEmployeeFormSchema,
  EmployeeFormInput,
  ROLE_OPTIONS,
  normalizeEmployeeRole
} from "./EmployeeFormSchema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/Form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api/apiClient.service";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import { EMPLOYEE_NAME_MAX_LENGTH } from "@/shared/constants/employee.constant";
import type { InternalUser } from "./types";

// -------------------------------
// Interface
// -------------------------------

interface EmployeeFormProps {
  initialData?: InternalUser | null;
  onSuccess: () => void;
  onCancel?: () => void;
  departments: any[];
  positions: any[];
}

// -------------------------------
// API CALL FUNCTION
// -------------------------------
const saveEmployee = async (data: {
  id?: string;
  name: string;
  email?: string;
  employeeCode?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  role?: string;
  isActive?: string;
}) => {
  if (data.id) {
    const { id, ...body } = data;
    return apiClient.put(
      `${apiRoutes[ApiRouteNames.INTERNAL_USERS]}/${id}`,
      body
    );
  }

  return apiClient.post(apiRoutes[ApiRouteNames.INTERNAL_USERS], {
    name: data.name,
    email: data.email,
    employeeCode: data.employeeCode ?? "",
    departmentId: data.departmentId,
    positionId: data.positionId,
    role: data.role,
    isActive: data.isActive ?? "true"
  });
};

// -------------------------------
// MAIN COMPONENT
// -------------------------------
export default function EmployeeForm({
  initialData,
  onSuccess,
  onCancel,
  departments,
  positions
}: EmployeeFormProps) {
  const isEditMode = !!initialData;
  const { t, i18n } = useTranslation();

  const schema = useMemo(() => createEmployeeFormSchema(t), [t, i18n.language]);

  const buildDefaultValues = (
    data?: InternalUser | null
  ): EmployeeFormInput => ({
    name: data?.name || "",
    email: data?.email || "",
    employeeCode: data?.employeeCode || "",
    department:
      data?.department && typeof data.department === "object"
        ? data.department.id
        : typeof data?.department === "string"
          ? data.department
          : "",
    position:
      data?.position && typeof data.position === "object"
        ? data.position.id
        : typeof data?.position === "string"
          ? data.position
          : "",
    role: normalizeEmployeeRole(data?.role),
    isActive: data?.isActive ?? true
  });

  const form = useForm<EmployeeFormInput>({
    resolver: zodResolver(schema) as Resolver<EmployeeFormInput>,
    defaultValues: buildDefaultValues(initialData)
  });

  useEffect(() => {
    form.clearErrors();
  }, [i18n.language, form]);

  useEffect(() => {
    form.reset(buildDefaultValues(initialData));
  }, [initialData, form.reset]);

  const mutation = useMutation({
    mutationFn: saveEmployee,
    onSuccess: () => {
      toast.success(
        isEditMode
          ? t("employees.form.updateSuccess")
          : t("employees.form.createSuccess")
      );
      onSuccess();
    },
    onError: (error: unknown) => {
      console.error("Save error:", error);
      toast.error(resolveApiErrorMessage(error, t));
    }
  });

  const onSubmit = (values: EmployeeFormInput) => {
    const departmentId =
      values.department && values.department !== "all"
        ? values.department
        : undefined;
    const positionId =
      values.position && values.position !== "all"
        ? values.position
        : undefined;

    if (isEditMode && initialData?.id) {
      mutation.mutate({
        id: initialData.id,
        name: values.name,
        employeeCode: values.employeeCode ?? undefined,
        departmentId,
        positionId,
        role: values.role ?? "MEMBER",
        isActive: values.isActive ? "true" : "false"
      });
      return;
    }

    mutation.mutate({
      name: values.name,
      email: values.email,
      employeeCode: values.employeeCode?.trim() ?? "",
      departmentId: values.department,
      positionId: values.position,
      role: values.role ?? "MEMBER",
      isActive: values.isActive ? "true" : "false"
    });
  };

  return (
    <Form form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("employees.name")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("employees.form.namePlaceholder")}
                    maxLength={EMPLOYEE_NAME_MAX_LENGTH}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel required={!isEditMode}>
                  {t("employees.email")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("employees.form.emailPlaceholder")}
                    readOnly={isEditMode}
                    disabled={isEditMode}
                    className={
                      isEditMode ? "bg-gray-100 cursor-not-allowed" : undefined
                    }
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employeeCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("employees.code")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder="NV12345"
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>
                  {t("employees.department.label")}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue
                        placeholder={t("employees.department.label")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
                    {isEditMode && (
                      <SelectItem value="all">
                        {t("employees.department.all")}
                      </SelectItem>
                    )}
                    {departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>
                        {getLocalizedOrganizationName(
                          department,
                          i18n.language
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("employees.position.label")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue
                        placeholder={t("employees.position.label")}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
                    {isEditMode && (
                      <SelectItem value="all">
                        {t("employees.position.all")}
                      </SelectItem>
                    )}
                    {positions.map(position => (
                      <SelectItem key={position.id} value={position.id}>
                        {getLocalizedOrganizationName(position, i18n.language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("employees.role.label")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={normalizeEmployeeRole(field.value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <SelectValue placeholder={t("employees.role.label")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
                    {ROLE_OPTIONS.map(roleName => (
                      <SelectItem key={roleName} value={roleName}>
                        {t("employees.role." + roleName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="col-span-2 flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={checked =>
                      field.onChange(checked as boolean)
                    }
                  />
                </FormControl>
                <FormLabel className="!mt-0">
                  {t("employees.status.active")} ({t("public.active")})
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={mutation.isPending}
            >
              {t("common.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? t("common.handling")
              : isEditMode
                ? t("common.update")
                : t("common.addNew")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
