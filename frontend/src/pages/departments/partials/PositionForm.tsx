import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPositionFormSchema,
  type PositionFormValues
} from "./PositionFormSchema";
import { POSITION_NAME_MAX_LENGTH } from "@/shared/constants/organization.constant";
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

export interface PositionFormInitial {
  id?: string;
  nameVi?: string;
  nameJa?: string;
  name?: string;
  level?: number | null;
}

interface PositionFormProps {
  initialData?: PositionFormInitial | null;
  onSuccess: () => void;
}

async function savePosition(data: PositionFormValues & { id?: string }) {
  const levelNum =
    data.level !== undefined && data.level !== ""
      ? Number.parseInt(data.level, 10)
      : undefined;
  const body = {
    nameVi: data.nameVi,
    nameJa: data.nameJa?.trim() || undefined,
    ...(levelNum !== undefined && !Number.isNaN(levelNum)
      ? { level: levelNum }
      : {})
  };

  if (data.id) {
    return apiClient.put(
      `${apiRoutes[ApiRouteNames.POSITIONS]}/${data.id}`,
      body
    );
  }
  return apiClient.post(apiRoutes[ApiRouteNames.POSITIONS], body);
}

export default function PositionForm({
  initialData,
  onSuccess
}: PositionFormProps) {
  const { t, i18n } = useTranslation();
  const isEditMode = !!initialData?.id;

  const schema = useMemo(() => createPositionFormSchema(t), [t, i18n.language]);

  const form = useForm<PositionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameVi: initialData?.nameVi ?? initialData?.name ?? "",
      nameJa: initialData?.nameJa ?? "",
      level:
        initialData?.level !== undefined && initialData?.level !== null
          ? String(initialData.level)
          : ""
    }
  });

  useEffect(() => {
    form.clearErrors();
  }, [i18n.language, form]);

  const mutation = useMutation({
    mutationFn: savePosition,
    onSuccess: () => {
      toast.success(
        isEditMode
          ? t("teams.positionForm.updateSuccess")
          : t("teams.positionForm.createSuccess")
      );
      onSuccess();
    },
    onError: error => {
      toast.error(
        resolveApiErrorMessage(error, t, "teams.positionForm.saveFailed")
      );
    }
  });

  const onSubmit = (values: PositionFormValues) => {
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
          name="nameVi"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>{t("teams.positionForm.nameVi")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={POSITION_NAME_MAX_LENGTH}
                  placeholder={t("teams.positionForm.nameViPlaceholder")}
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
              <FormLabel>{t("teams.positionForm.nameJa")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={POSITION_NAME_MAX_LENGTH}
                  placeholder={t("teams.positionForm.nameJaPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("teams.positionForm.level")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  placeholder={t("teams.positionForm.levelPlaceholder")}
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
