import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DeviceRequestFormSchema,
  DeviceRequestFormValues
} from "./DeviceRequestFormSchema";
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/Select";
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
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api/apiClient.service";
import config from "@/shared/constants/config.constant";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import type { InternalUser } from "../partials/types";
import { useUserProfile } from "@/shared/hooks/useUserProfile";

interface DeviceRequestFormProps {
  users: InternalUser[];
  deviceTypes: any[];
  onSuccess: () => void;
}

export default function DeviceRequestForm({
  users,
  deviceTypes,
  onSuccess
}: DeviceRequestFormProps) {
  const { t } = useTranslation();
  const { user } = useUserProfile();
  const deviceTypeList = Array.isArray(deviceTypes) ? deviceTypes : [];
  const userList = Array.isArray(users) ? users : [];
  const requestedByUserId = user?._id || "admin-user-id";

  type CreateDeviceRequestPayload = {
    userId: string;
    type: "NEW_ASSIGNMENT" | "REPLACEMENT" | "REPAIR";
    reason?: string;
    requestedByUserId: string;

    items: {
      deviceTypeId: string;
      quantity: number;
    }[];
  };

  const form = useForm<DeviceRequestFormValues>({
    resolver: zodResolver(DeviceRequestFormSchema),
    defaultValues: {
      userId: "",
      deviceTypeId: "",
      type: "NEW_ASSIGNMENT",
      quantity: 1,
      reason: ""
    }
  });

  const mutation = useMutation<unknown, unknown, CreateDeviceRequestPayload>({
    mutationFn: async data => {
      const url = config.getApiUrl(apiRoutes[ApiRouteNames.DEVICE_REQUESTS]);
      return apiClient.post(url, data);
    },
    onSuccess: () => {
      toast.success(t("device.requests.createSuccess"));
      onSuccess();
    },
    onError: (error: unknown) => {
      toast.error(
        resolveApiErrorMessage(error, t, "device.requests.createFailed")
      );
    }
  });

  return (
    <Form form={form}>
      <form
        onSubmit={form.handleSubmit(values => {
          mutation.mutate({
            userId: values.userId,
            type: values.type,
            reason: values.reason,
            requestedByUserId,

            items: [
              {
                deviceTypeId: values.deviceTypeId,
                quantity: values.quantity
              }
            ]
          });
        })}
      >
        {/* GRID 2 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* USER */}
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("device.requests.user")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between bg-white"
                    >
                      {field.value
                        ? userList.find(u => u.id === field.value)?.name
                        : t("device.requests.filter.allEmployees")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="bg-white text-gray-900 shadow-xl">
                    <Command className="bg-white">
                      <CommandInput
                        className="border-0 focus:ring-0 focus:outline-none"
                        placeholder={t("device.requests.filter.allEmployees")}
                      />
                      <CommandEmpty>{t("common.noResult")}</CommandEmpty>
                      <CommandGroup>
                        {userList
                          .filter(u => u.isActive !== false)
                          .map(u => (
                            <CommandItem
                              key={u.id}
                              onSelect={() => field.onChange(u.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === u.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {u.name}
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

          {/* DEVICE TYPE */}
          <FormField
            control={form.control}
            name="deviceTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("assets.label.type")}</FormLabel>

                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between bg-white border border-gray-300"
                      >
                        {field.value
                          ? deviceTypeList.find(d => d.id === field.value)?.name
                          : t("device.requests.filter.allDevices")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-full p-0 bg-white text-gray-900 shadow-xl border border-gray-200"
                    align="start"
                  >
                    <Command className="bg-white">
                      <CommandInput
                        placeholder={t("device.requests.filter.allDevices")}
                        className="border-0 focus:ring-0 focus:outline-none"
                      />
                      <CommandEmpty>{t("common.noResult")}</CommandEmpty>

                      <CommandGroup>
                        {deviceTypeList.map(d => (
                          <CommandItem
                            key={d.id}
                            value={d.name}
                            onSelect={() => field.onChange(d.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === d.id
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

                <FormMessage />
              </FormItem>
            )}
          />

          {/* REQUEST TYPE */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>
                  {t("device.requests.type.label")}
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white text-gray-900 border shadow-lg">
                    <SelectItem value="NEW_ASSIGNMENT">
                      {t("device.requests.type.NEW_ASSIGNMENT")}
                    </SelectItem>
                    <SelectItem value="REPLACEMENT">
                      {t("device.requests.type.REPLACEMENT")}
                    </SelectItem>
                    <SelectItem value="REPAIR">
                      {t("device.requests.type.REPAIR")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* QUANTITY */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>{t("common.quantity")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    className="bg-white"
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* NOTES - FULL WIDTH */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("assets.label.note")}</FormLabel>
              <FormControl>
                <textarea
                  className="w-full border rounded-md p-3 h-28 bg-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ACTION */}
        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-lg border hover:bg-blue-900"
          >
            {t("common.addNew")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
