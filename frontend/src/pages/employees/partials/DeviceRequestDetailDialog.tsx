import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";

import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { useTranslation } from "react-i18next";

interface DeviceRequestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any | null;
}

export default function DeviceRequestDetailDialog({
  open,
  onOpenChange,
  data
}: DeviceRequestDetailDialogProps) {
  const { t } = useTranslation();

  if (!data) return null;

  const statusColor =
    data.status === "COMPLETED"
      ? "bg-green-100 text-green-800"
      : data.status === "APPROVED"
        ? "bg-blue-100 text-blue-800"
        : data.status === "REJECTED"
          ? "bg-red-100 text-red-800"
          : "bg-yellow-100 text-yellow-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("device.requests.detail")}</DialogTitle>
          <DialogDescription>{t("device.requests.detail")}</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="space-y-6">
          {/* ================= USER ================= */}
          <div>
            <h3 className="font-semibold mb-3">{t("device.requests.user")}</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">{t("employees.name")}</div>

                <div className="font-medium">{data.user?.name ?? "-"}</div>
              </div>

              <div>
                <div className="text-gray-500">{t("employees.code")}</div>

                <div className="font-medium">
                  {data.user?.employeeCode ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">{t("employees.email")}</div>

                <div className="font-medium">{data.user?.email ?? "-"}</div>
              </div>

              <div>
                <div className="text-gray-500">{t("permissions.role")}</div>

                <div className="font-medium">{data.user?.role ?? "-"}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ================= REQUEST INFO ================= */}
          <div>
            <h3 className="font-semibold mb-3">
              {t("device.requests.information")}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">
                  {t("device.requests.type.label")}
                </div>

                <div className="font-medium">
                  {t(`device.requests.type.${data.type}`)}
                </div>
              </div>

              <div>
                <div className="text-gray-500">
                  {t("employees.status.label")}
                </div>

                <div className="mt-1">
                  <Badge className={statusColor}>
                    {t(`device.requests.status.${data.status}`)}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-gray-500">
                  {t("device.requests.requestedBy")}
                </div>

                <div className="font-medium">
                  {data.requestedByUser?.name ?? "-"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">{t("employees.email")}</div>

                <div className="font-medium">
                  {data.requestedByUser?.email ?? "-"}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-gray-500">
                  {t("device.requests.reason")}
                </div>

                <div className="font-medium">{data.reason ?? "-"}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* ================= DEVICES ================= */}
          <div>
            <h3 className="font-semibold mb-3">{t("device.deviceName")}</h3>

            <div className="space-y-3">
              {data.items?.length ? (
                data.items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="
                                            border
                                            rounded-lg
                                            p-4
                                            flex
                                            items-center
                                            justify-between
                                        "
                  >
                    <div>
                      <div className="font-medium">
                        {item.deviceType?.name ?? "-"}
                      </div>

                      <div className="text-sm text-gray-500">
                        {item.deviceType?.description ?? ""}
                      </div>
                    </div>

                    <Badge>x{item.quantity}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">-</div>
              )}
            </div>
          </div>

          <Separator />

          {/* ================= DATES ================= */}
          <div>
            <h3 className="font-semibold mb-3">
              {t("device.requests.timeline")}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">
                  {t("device.requests.createdAt")}
                </div>

                <div className="font-medium">
                  {data.createdAt
                    ? new Date(data.createdAt).toLocaleString("vi-VN")
                    : "-"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">
                  {t("device.requests.updatedAt")}
                </div>

                <div className="font-medium">
                  {data.updatedAt
                    ? new Date(data.updatedAt).toLocaleString("vi-VN")
                    : "-"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">
                  {t("device.requests.approvedAt")}
                </div>

                <div className="font-medium">
                  {data.approvedAt
                    ? new Date(data.approvedAt).toLocaleString("vi-VN")
                    : "-"}
                </div>
              </div>

              <div>
                <div className="text-gray-500">
                  {t("device.requests.completedAt")}
                </div>

                <div className="font-medium">
                  {data.completedAt
                    ? new Date(data.completedAt).toLocaleString("vi-VN")
                    : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
