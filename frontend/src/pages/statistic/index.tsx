import PageTopBar from "@/components/PageTopBar";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Keyboard,
  LaptopMinimal,
  Printer,
  Monitor,
  MousePointer,
  Network,
  Server,
  Box,
  PcCase
} from "lucide-react";

import CircleChart from "@/components/CircleChart";
import DepartmentCard from "@/components/DepartmentCard";
import useResponsive from "@/hooks/useResponsive";
import { useLocalizedOrganizationName } from "@/hooks/useLocalizedOrganizationName";

import {
  useDeviceStatisticsQuery,
  useDevicesByDepartmentQuery,
  type DepartmentDeviceTypeStat,
  type DepartmentDevicesStat
} from "@/shared/queries/statistic.queries";

function DepartmentStatCard({
  dept,
  color,
  dimmed,
  data
}: {
  dept: DepartmentDevicesStat;
  color: string;
  dimmed: boolean;
  data: Array<{ name: string; quantity: number; icon?: typeof Keyboard }>;
}) {
  const departmentName = useLocalizedOrganizationName(dept);

  return (
    <DepartmentCard
      DepartmentName={departmentName}
      backgroundColor={color}
      dimmed={dimmed}
      data={data}
      deviceDepartmentTotal={dept.total}
    />
  );
}

export default function Statistic() {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();

  const { data: deviceStats } = useDeviceStatisticsQuery();
  const { data: departmentsData = [] } = useDevicesByDepartmentQuery();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalDevices =
    deviceStats?.activeDevices ??
    Object.values(deviceStats?.devicesByStatus ?? {}).reduce(
      (sum, count) => sum + count,
      0
    );

  /** Màu nền thống nhất — tránh nhầm sắc palette nhạt hơn với trạng thái mờ */
  const departmentActiveColor = "#5481FC";

  const getDepartmentDeviceCount = (dept: DepartmentDevicesStat): number => {
    const fromTotal = dept.total ?? 0;
    if (fromTotal > 0) {
      return fromTotal;
    }
    return (dept.deviceTypes ?? []).reduce(
      (sum, item) => sum + (item.totalAssignedDevices ?? 0),
      0
    );
  };

  const departmentHasDevices = (dept: DepartmentDevicesStat) =>
    getDepartmentDeviceCount(dept) > 0;

  const chartData = useMemo(() => {
    const statusColorMap: Record<string, string> = {
      usable: "#14532D",
      pending_repair: "#FACC15",
      broken: "#EF4444",
      handed_over: "#172554",
      maintenance: "#EA580C",
      lost: "#f10404"
    };

    const statusLabelMap: Record<string, string> = {
      usable: t("assets.status.usable"),
      pending_repair: t("assets.status.pending_repair"),
      broken: t("assets.status.broken"),
      handed_over: t("assets.status.handed_over"),
      maintenance: t("assets.status.maintenance"),
      lost: t("assets.status.lost")
    };

    const statusCounts = deviceStats?.devicesByStatus ?? {};

    const total =
      deviceStats?.activeDevices ??
      Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return Object.keys(statusColorMap).map(statusName => ({
        label: statusLabelMap[statusName],
        value: 0,
        color: statusColorMap[statusName],
        count: 0
      }));
    }

    return Object.keys(statusColorMap).map(statusName => {
      const count = statusCounts[statusName] || 0;

      return {
        label: statusLabelMap[statusName],
        value: (count / total) * 100,
        color: statusColorMap[statusName],
        count
      };
    });
  }, [deviceStats, t]);

  const departmentCards = useMemo(() => {
    return departmentsData.map(dept => {
      const hasDevices = departmentHasDevices(dept);
      const color = departmentActiveColor;

      const data = (dept.deviceTypes || []).map(
        (dt: DepartmentDeviceTypeStat) => {
          let IconComponent: typeof Keyboard | undefined;

          if (dt.deviceTypeName === "Keyboard") IconComponent = Keyboard;
          else if (dt.deviceTypeName === "Laptop")
            IconComponent = LaptopMinimal;
          else if (dt.deviceTypeName === "Monitor") IconComponent = Monitor;
          else if (dt.deviceTypeName === "Printer") IconComponent = Printer;
          else if (dt.deviceTypeName === "MousePointer")
            IconComponent = MousePointer;
          else if (dt.deviceTypeName === "Network") IconComponent = Network;
          else if (dt.deviceTypeName === "Server") IconComponent = Server;
          else if (dt.deviceTypeName === "Desktop") IconComponent = PcCase;
          else if (dt.deviceTypeName === "Other") IconComponent = Box;

          return {
            name: dt.deviceTypeName,
            quantity: dt.totalAssignedDevices,
            icon: IconComponent
          };
        }
      );

      return { dept, color, dimmed: !hasDevices, data };
    });
  }, [departmentsData]);

  return (
    <>
      <PageTopBar
        title={t("dashboard.title")}
        description={t("dashboard.description")}
        Icon={Users}
      />

      <div className="mt-6 flex flex-col xl:grid xl:grid-cols-[380px_1fr] 2xl:grid-cols-[380px_1fr] gap-8">
        {/* LEFT PANEL */}
        <div
          className="
            w-[calc(100%-20px)]
            md:w-full

            rounded-[32px]
            bg-[#EFF6FF]

            border border-white/80

            shadow-[inset_2px_2px_4px_rgba(255,255,255,0.9),inset_-2px_-2px_4px_rgba(180,200,255,0.15),0_15px_35px_rgba(59,130,246,0.08)]

            flex flex-col
            items-center

            p-5
            md:p-6

            gap-6
          "
        >
          <h3 className="text-xl font-bold text-primary">
            {t("dashboard.totalAssets")}
          </h3>

          {isMounted && (
            <div
              className="
                p-4
                rounded-full
                bg-white
                border border-slate-100

                shadow-[0_20px_40px_rgba(15,23,42,0.08)]
              "
            >
              <CircleChart
                data={chartData}
                size={isMobile ? 280 : 320}
                total={totalDevices}
              />
            </div>
          )}

          <div className="w-full flex flex-col gap-4">
            <h3 className="text-lg font-bold text-primary">
              {t("assets.status.label")}
            </h3>

            {chartData.map((item, index) => (
              <div
                key={index}
                className="
                  flex
                  items-center
                  gap-4

                  rounded-2xl

                  bg-white

                  px-5
                  py-3

                  border
                  border-slate-100

                  shadow-[0_6px_20px_rgba(15,23,42,0.05)]
                "
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: item.color
                  }}
                />

                <span className="text-slate-700 text-sm md:text-base">
                  {item.label}
                </span>

                <span className="ml-auto font-semibold text-primary">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-6">
          {departmentCards.map(({ dept, color, dimmed, data }) => (
            <div
              key={dept.departmentId}
              className="transition-all duration-300"
            >
              <DepartmentStatCard
                dept={dept}
                color={color}
                dimmed={dimmed}
                data={data}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
