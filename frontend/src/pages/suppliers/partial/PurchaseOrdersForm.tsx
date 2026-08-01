import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";

import {
  createPurchaseOrderSchema,
  PurchaseOrderFormValues
} from "./PurchaseOrderSchema";

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
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";

import type { PurchaseOrder } from "./types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/Popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "@/components/ui/Command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const savePurchaseOrder = async (
  data: PurchaseOrderFormValues & { id?: string }
) => {
  const apiUrl = config.getApiUrl(apiRoutes[ApiRouteNames.PURCHASE_ORDERS]);

  if (data.id) {
    const response = await apiClient.put(`${apiUrl}/${data.id}`, data);
    return response.data;
  } else {
    const response = await apiClient.post(apiUrl, data);
    return response.data;
  }
};

interface PurchaseOrdersFormProps {
  initialData?: PurchaseOrder | null;
  supplierOptions: { id: string; name: string }[];
  onSuccess: () => void;
  readOnly?: boolean;
  items: Array<{ deviceId: string; quantity: number; unitPrice: number }>;
}

interface DeviceType {
  id: string;
  name: string;
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default function PurchaseOrdersForm({
  initialData,
  supplierOptions,
  onSuccess,
  readOnly = false
}: PurchaseOrdersFormProps) {
  const isEditMode = !!initialData;
  const { t, i18n } = useTranslation();
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);

  const schema = useMemo(
    () => createPurchaseOrderSchema(t),
    [t, i18n.language]
  );

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const url = config.getApiUrl(apiRoutes[ApiRouteNames.DEVICE_TYPES]);
        const res = await apiClient.get(url);
        setDeviceTypes(
          Array.isArray(res.data) ? res.data : res.data?.data || []
        );
      } catch (error) {
        console.error("Failed to fetch device types:", error);
      }
    };
    fetchTypes();
  }, []);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(
      schema
    ) as unknown as Resolver<PurchaseOrderFormValues>,
    defaultValues: {
      id: initialData?.id ?? undefined,
      supplierId: initialData?.supplierId ?? "",
      orderDate: initialData?.orderDate ?? undefined,
      invoiceNumber: initialData?.invoiceNumber ?? null,
      notes: initialData?.notes ?? null,
      totalAmount: initialData?.totalAmount ?? 0,
      items:
        initialData?.items?.map(it => ({
          deviceTypeId: it.deviceTypeId,
          deviceName: it.deviceName ?? "",
          quantity: Number(it.quantity ?? 0),
          unitPrice: Number(it.unitPrice ?? 0)
        })) ?? [],
      status: initialData?.status,
      createdAt: initialData?.createdAt ?? null,
      updatedAt: initialData?.updatedAt ?? null
    }
  });

  const mutation = useMutation({
    mutationFn: (data: PurchaseOrderFormValues) =>
      savePurchaseOrder({ ...data, id: initialData?.id }),
    onSuccess: () => {
      toast.success(t("common.success"));
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(
        resolveApiErrorMessage(error, t, "common.errors.operationFailed")
      );
    }
  });

  const onSubmit = (data: PurchaseOrderFormValues) => {
    if (readOnly) return;
    mutation.mutate(data);
  };

  useEffect(() => {
    const items = form.getValues("items") || [];

    const subtotal = items.reduce((acc: number, item: any) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return acc + qty * price;
    }, 0);

    form.setValue("totalAmount", subtotal, { shouldDirty: true });
  }, [form.watch("items")]);

  const status = form.getValues("status") as string | undefined;

  return (
    <Form form={form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ===== 2 columns section ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier */}
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("supplier.name")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between bg-white",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={readOnly}
                      >
                        {field.value
                          ? supplierOptions.find(s => s.id === field.value)
                              ?.name
                          : t("purchase.supplier")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-white text-gray-900 shadow-xl border border-gray-200">
                    <Command
                      className="bg-white"
                      filter={(value, search) =>
                        normalize(value).includes(normalize(search)) ? 1 : 0
                      }
                    >
                      <CommandInput
                        className="border-0 focus:ring-0 focus:outline-none"
                        placeholder={t("purchase.supplier")}
                      />
                      <CommandEmpty>{t("common.noResult")}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => field.onChange("")}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !field.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {t("common.clear")}
                        </CommandItem>
                        {supplierOptions.map(s => (
                          <CommandItem
                            key={s.id}
                            value={s.name}
                            onSelect={() => field.onChange(s.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === s.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Order Date */}
          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("purchase.purchaseDate")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={readOnly}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Invoice Number */}
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("purchase.order.invoiceNumber")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("purchase.order.invoiceNumber")}
                    disabled={readOnly}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Total Amount */}
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("purchase.totalAmount")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    disabled={readOnly}
                    {...field}
                    value={field.value ?? ""}
                    onChange={e =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* ===== end 2 columns section ===== */}

        {/* ===== Items Section ===== */}
        <FormField
          control={form.control}
          name="items"
          render={({ field }) => {
            const items = field.value || [];

            const addItem = () => {
              field.onChange([
                ...items,
                { deviceTypeId: "", deviceName: "", quantity: 1, unitPrice: 0 }
              ]);
            };

            const updateItem = (index: number, patch: any) => {
              const updated = items.map((row: any, i: number) =>
                i === index ? { ...row, ...patch } : row
              );
              field.onChange(updated);
            };

            const removeItem = (index: number) => {
              field.onChange(items.filter((_: any, i: number) => i !== index));
            };

            const calculateLineTotal = (item: any) =>
              (item.quantity || 0) * (item.unitPrice || 0);

            const subtotal = items.reduce(
              (acc: number, it: any) => acc + calculateLineTotal(it),
              0
            );

            return (
              <FormItem>
                <FormLabel className="text-lg font-semibold">
                  {t("purchase.purchaseDetail")}
                </FormLabel>

                <div className="space-y-2">
                  {/* items table */}
                  <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/90 shadow-[var(--shadow-neo-sm)]">
                    <table className="min-w-[880px] w-full text-sm neumorphic-table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 border w-[220px]">
                            {t("device.deviceType")}
                          </th>
                          <th className="p-2 border w-[220px]">
                            {t("purchase.item.deviceName")}
                          </th>
                          <th className="p-2 border w-[100px]">
                            {t("purchase.item.quantity")}
                          </th>
                          <th className="p-2 border w-[120px]">
                            {t("purchase.item.unitPrice")}
                          </th>
                          <th className="p-2 border w-[120px]">
                            {t("purchase.item.totalPrice")}
                          </th>
                          <th className="p-2 border w-[60px]"></th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((item: any, index: number) => (
                          <tr key={index}>
                            {/* Device Type */}
                            <td className="p-2 border">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between bg-white",
                                      !item.deviceTypeId &&
                                        "text-muted-foreground"
                                    )}
                                    disabled={readOnly}
                                  >
                                    {item.deviceTypeId
                                      ? deviceTypes.find(
                                          d => d.id === item.deviceTypeId
                                        )?.name
                                      : t("common.selectOption")}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 bg-white text-gray-900 shadow-xl border border-gray-200">
                                  <Command
                                    className="bg-white"
                                    filter={(value, search) =>
                                      normalize(value).includes(
                                        normalize(search)
                                      )
                                        ? 1
                                        : 0
                                    }
                                  >
                                    <CommandInput
                                      className="border-0 focus:ring-0 focus:outline-none"
                                      placeholder={t("common.selectOption")}
                                    />
                                    <CommandEmpty>
                                      {t("common.noResult")}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {deviceTypes.map(d => (
                                        <CommandItem
                                          key={d.id}
                                          value={d.name}
                                          onSelect={() =>
                                            updateItem(index, {
                                              deviceTypeId: d.id
                                            })
                                          }
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              item.deviceTypeId === d.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {d.name}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </td>

                            {/* Device Name */}
                            <td className="p-2 border">
                              <Input
                                disabled={readOnly}
                                value={item.deviceName || ""}
                                onChange={e =>
                                  updateItem(index, {
                                    deviceName: e.target.value
                                  })
                                }
                                placeholder={t("common.enterDeviceName")}
                              />
                            </td>

                            {/* Qty */}
                            <td className="p-2 border">
                              <Input
                                disabled={readOnly}
                                type="number"
                                value={item.quantity}
                                min={1}
                                onChange={e =>
                                  updateItem(index, {
                                    quantity: parseInt(e.target.value) || 0
                                  })
                                }
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="p-2 border">
                              <Input
                                disabled={readOnly}
                                type="number"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={e =>
                                  updateItem(index, {
                                    unitPrice: parseFloat(e.target.value) || 0
                                  })
                                }
                              />
                            </td>

                            {/* Total */}
                            <td className="p-2 border text-right font-semibold">
                              {calculateLineTotal(item).toLocaleString()}
                            </td>

                            {/* Delete */}
                            <td className="p-2 border text-center">
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  aria-label={t("common.delete")}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      + {t("common.addNew")}
                    </button>
                  )}

                  {/* subtotal */}
                  {items.length > 0 && (
                    <div className="text-right font-bold text-lg mt-2">
                      {t("purchase.item.totalPrice")}:{" "}
                      {subtotal.toLocaleString()}
                    </div>
                  )}
                </div>

                <FormMessage />
              </FormItem>
            );
          }}
        />

        {/* ===== Notes full row ===== */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("purchase.notes")}</FormLabel>
              <FormControl>
                <textarea
                  className="border rounded px-2 py-1 w-full min-h-[120px]"
                  disabled={readOnly}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ===== Current Status ===== */}
        {isEditMode && (
          <div className="flex justify-between items-center border rounded p-3 bg-gray-50">
            <span className="text-sm text-gray-600">
              {t("purchase.status.label")}:
            </span>

            <span
              className={`px-3 py-1 rounded text-sm font-semibold
                ${
                  status === "approved"
                    ? "bg-green-300 text-blue-800"
                    : status === "pending"
                      ? "bg-red-500 text-gray-800"
                      : "bg-yellow-100 text-yellow-800"
                }
              `}
            >
              {t(`purchase.status.${status || "draft"}`)}
            </span>
          </div>
        )}

        {/* ===== Submit Button ===== */}
        {!readOnly && (
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={
                mutation.isPending || form.getValues("status") === "approved"
              }
            >
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
