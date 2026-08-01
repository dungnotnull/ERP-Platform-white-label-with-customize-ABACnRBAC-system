import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createDepartmentFormSchema,
  type DepartmentFormValues
} from "./DepartmentFormSchema";
import { DEPARTMENT_NAME_MAX_LENGTH } from "@/shared/constants/organization.constant";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/Form";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api/apiClient.service";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";

export interface DepartmentFormInitial {
  id?: string;
  code?: string;
  nameVi?: string;
  nameJa?: string;
  name?: string;
  description?: string;
}

interface DepartmentFormProps {
  initialData?: DepartmentFormInitial | null;
  onSuccess: () => void;
}

async function saveDepartment(data: DepartmentFormValues & { id?: string }) {
  const payload = {
    code: data.code,
    nameVi: data.nameVi,
    nameJa: data.nameJa?.trim() || undefined,
    description: data.description
  };

  if (data.id) {
    return apiClient.put(`${apiRoutes[ApiRouteNames.DEPARTMENTS]}/${data.id}`, {
      nameVi: payload.nameVi,
      nameJa: payload.nameJa,
      description: payload.description
    });
  }
  return apiClient.post(apiRoutes[ApiRouteNames.DEPARTMENTS], payload);
}

export default function DepartmentForm({
  initialData,
  onSuccess
}: DepartmentFormProps) {
  const { t, i18n } = useTranslation();
  const isEditMode = !!initialData?.id;

  const schema = useMemo(
    () => createDepartmentFormSchema(t),
    [t, i18n.language]
  );

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: initialData?.code ?? "",
      nameVi: initialData?.nameVi ?? initialData?.name ?? "",
      nameJa: initialData?.nameJa ?? "",
      description: initialData?.description ?? ""
    }
  });

  useEffect(() => {
    form.clearErrors();
  }, [i18n.language, form]);

  const mutation = useMutation({
    mutationFn: saveDepartment,
    onSuccess: () => {
      toast.success(
        isEditMode
          ? t("teams.departmentForm.updateSuccess")
          : t("teams.departmentForm.createSuccess")
      );
      onSuccess();
    },
    onError: error => {
      toast.error(
        resolveApiErrorMessage(error, t, "teams.departmentForm.saveFailed")
      );
    }
  });

  const onSubmit = (values: DepartmentFormValues) => {
    mutation.mutate({
      ...values,
      ...(isEditMode ? { id: initialData!.id } : {})
    });
  };

  return (
    <Form form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel required={!isEditMode}>
                {t("teams.departmentForm.code")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isEditMode}
                  placeholder={t("teams.departmentForm.codePlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nameVi"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("teams.departmentForm.nameVi")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={DEPARTMENT_NAME_MAX_LENGTH}
                  placeholder={t("teams.departmentForm.nameViPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nameJa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("teams.departmentForm.nameJa")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={DEPARTMENT_NAME_MAX_LENGTH}
                  placeholder={t("teams.departmentForm.nameJaPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("teams.departmentForm.description")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("teams.departmentForm.descriptionPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {isEditMode ? t("common.save") : t("common.addNew")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
