import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createSupplierFormSchema,
  SupplierFormValues
} from "./SupplierFormSchema";
import { useMemo } from "react";
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
import config from "@/shared/constants/config.constant";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { resolveSupplierApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import type { Supplier } from "./types";

// -------------------------------
// API CALL FUNCTION
// -------------------------------
const saveSupplier = async (data: SupplierFormValues & { id?: string }) => {
  const apiUrl = config.getApiUrl(apiRoutes[ApiRouteNames.SUPPLIERS]);

  if (data.id) {
    const response = await apiClient.put(`${apiUrl}/${data.id}`, data);
    return response.data;
  } else {
    const response = await apiClient.post(apiUrl, data);
    return response.data;
  }
};

// -------------------------------
// MAIN COMPONENT
// -------------------------------
interface SupplierFormProps {
  initialData?: Supplier | null;
  onSuccess: () => void;
  readOnly?: boolean;
}

export default function SupplierForm({
  initialData,
  onSuccess,
  readOnly
}: SupplierFormProps) {
  const isEditMode = !!initialData;
  const { t, i18n } = useTranslation();

  const schema = useMemo(() => createSupplierFormSchema(t), [t, i18n.language]);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      contactPerson: initialData?.contactPerson || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      website: initialData?.website || "",
      notes: initialData?.notes || ""
      // isActive: initialData?.isActive ?? true,
    }
  });

  const mutation = useMutation({
    mutationFn: saveSupplier,
    onSuccess: () => {
      toast.success(
        isEditMode
          ? t("common.update") + " " + t("common.success")
          : t("common.addNew") + " " + t("common.success")
      );
      onSuccess();
    },
    onError: (error: unknown) => {
      console.error("Save error:", error);
      toast.error(resolveSupplierApiErrorMessage(error, t));
    }
  });

  const onSubmit = (values: SupplierFormValues) => {
    const payload = { ...values };
    if (isEditMode && initialData?.id) {
      (payload as any).id = initialData.id;
    }
    mutation.mutate(payload);
  };

  return (
    <Form form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* GRID 2 COLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("supplier.name")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={readOnly}
                    placeholder={t("supplier.name")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Person */}
          <FormField
            control={form.control}
            name="contactPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("supplier.contactPerson")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={readOnly}
                    placeholder={t("supplier.contactPerson")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("supplier.phone")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={readOnly}
                    placeholder={t("supplier.phone")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("supplier.email")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={readOnly}
                    placeholder={t("supplier.email")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("supplier.address")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={readOnly}
                    placeholder={t("supplier.address")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("supplier.website")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={readOnly}
                    placeholder={t("supplier.website")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>{" "}
        {/* END GRID */}
        {/* NOTE - FULL WIDTH */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("supplier.note")}</FormLabel>
              <FormControl>
                <textarea
                  disabled={readOnly}
                  className="w-full border rounded-md p-2 h-24"
                  placeholder={t("supplier.note")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* BUTTON */}
        {!readOnly && (
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? t("common.handling")
                : isEditMode
                  ? t("common.update")
                  : t("common.addNew")}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
