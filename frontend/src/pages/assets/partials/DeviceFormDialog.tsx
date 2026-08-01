import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/services/api/apiClient.service";

import {
  createDeviceFormSchema,
  type DeviceFormValues
} from "./deviceFormSchema";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { toast } from "react-toastify";
import config from "@/shared/constants/config.constant";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { useTranslation } from "react-i18next";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";

export default function DeviceFormDialog({
  open,
  onClose,
  onSuccess,
  editDevice = null,
  deviceTypes = [],
  deviceStatus = []
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editDevice?: any | null;
  deviceTypes: any[];
  deviceStatus: any[];
}) {
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  const schema = useMemo(() => createDeviceFormSchema(t), [t, i18n.language]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm<DeviceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      serialNumber: "",
      model: "",
      manufacturer: "",
      purchaseDate: "",
      purchasePrice: "",
      warrantyExpiryDate: "",
      notes: "",
      deviceTypeId: "",
      deviceStatusId: ""
    }
  });

  const currentStatuses = deviceStatus;

  useEffect(() => {
    if (open) {
      if (editDevice) {
        reset({
          name: editDevice.name || "",
          serialNumber: editDevice.serialNumber || "",
          model: editDevice.model || "",
          manufacturer: editDevice.manufacturer || "",
          purchaseDate: editDevice.purchaseDate?.split("T")[0] || "",
          purchasePrice: editDevice.purchasePrice?.toString() || "",
          warrantyExpiryDate:
            editDevice.warrantyExpiryDate?.split("T")[0] || "",
          notes: editDevice.notes || "",
          deviceTypeId: editDevice.deviceTypeId || "",
          deviceStatusId: editDevice.deviceStatusId || ""
        });
      } else {
        reset();
      }
    } else {
      reset();
    }
  }, [open, editDevice, currentStatuses.length, reset]);

  const onSubmit = async (values: DeviceFormValues) => {
    try {
      setLoading(true);

      const payload = {
        ...values,

        purchasePrice: values.purchasePrice
          ? Number(values.purchasePrice)
          : null
      };

      const url = editDevice
        ? config.getApiUrl(
            `${apiRoutes[ApiRouteNames.UPDATE_DEVICE]}${editDevice.id}`
          )
        : config.getApiUrl(apiRoutes[ApiRouteNames.CREATE_DEVICE]);

      const method = editDevice ? "put" : "post";

      await apiClient[method](url, payload);

      toast.success(
        editDevice
          ? t("device.update") + " " + t("device.success")
          : t("device.addNew") + " " + t("device.success")
      );

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);

      toast.error(resolveApiErrorMessage(error, t, "assets.errors.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>
            {editDevice ? t("device.update") : t("device.addNew")}
          </DialogTitle>
          <DialogDescription>
            {editDevice ? t("device.update") : t("device.addNew")}
          </DialogDescription>
        </DialogHeader>

        {/* Form fields */}
        <form
          key={`${editDevice?.id ?? "new"}-${i18n.language}`}
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>{t("assets.name")}</Label>
              <Input {...register("name")} />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label required>{t("device.serialNumber")}</Label>
              <Input {...register("serialNumber")} />
              {errors.serialNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.serialNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label>{t("device.model")}</Label>
              <Input {...register("model")} />
            </div>

            <div>
              <Label>{t("device.manufacturer")}</Label>
              <Input {...register("manufacturer")} />
            </div>

            <div>
              <Label>{t("assets.label.purchaseDate")}</Label>
              <Input type="date" {...register("purchaseDate")} />
            </div>

            <div>
              <Label> {t("assets.label.purchasePrices")} (VNĐ)</Label>
              <Input
                type="number"
                min={0}
                step="1"
                {...register("purchasePrice")}
                onKeyDown={e => {
                  if (e.key === "-" || e.key === "e" || e.key === "E") {
                    e.preventDefault();
                  }
                }}
              />
              {errors.purchasePrice && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.purchasePrice.message}
                </p>
              )}
            </div>

            <div>
              <Label>{t("assets.label.warrantyExpiryDate")}</Label>
              <Input type="date" {...register("warrantyExpiryDate")} />
              {errors.warrantyExpiryDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.warrantyExpiryDate.message}
                </p>
              )}
            </div>

            <div>
              <Label required>{t("device.deviceType")}</Label>
              <Select
                value={watch("deviceTypeId")}
                onValueChange={v =>
                  setValue("deviceTypeId", v, {
                    shouldValidate: true
                  })
                }
              >
                <SelectTrigger className="w-full bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder={t("device.deviceType")} />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
                  {deviceTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deviceTypeId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.deviceTypeId.message}
                </p>
              )}
            </div>

            <div>
              <Label required>{t("employees.status.label")}</Label>
              <Select
                value={watch("deviceStatusId")}
                onValueChange={v =>
                  setValue("deviceStatusId", v, {
                    shouldValidate: true
                  })
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder={t("employees.status.label")} />
                </SelectTrigger>

                <SelectContent className="bg-white">
                  {currentStatuses
                    .filter((status: any) => {
                      // CREATE
                      if (!editDevice) {
                        return status.name !== "handed_over";
                      }

                      const currentDeviceStatus = currentStatuses.find(
                        (s: any) =>
                          String(s.id) === String(editDevice.deviceStatusId)
                      );

                      const currentStatusName = currentDeviceStatus?.name;

                      // Nếu đang handed_over
                      // chỉ hiển thị chính status hiện tại
                      if (currentStatusName === "handed_over") {
                        return status.id === editDevice.deviceStatusId;
                      }

                      // Các status khác:
                      // không cho chọn handed_over
                      return status.name !== "handed_over";
                    })
                    .map((status: any) => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          {status.color && (
                            <span
                              className="w-3 h-3 rounded-full inline-block"
                              style={{ backgroundColor: status.color }}
                            />
                          )}

                          {t(`assets.status.${status.name}`)}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.deviceStatusId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.deviceStatusId.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label>{t("assets.label.note")}</Label>
              <Textarea
                {...register("notes")}
                placeholder={t("assets.label.note")}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              // className="bg-blue-600 text-white"
            >
              {loading
                ? t("common.handling")
                : editDevice
                  ? t("common.update")
                  : t("common.addNew")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
