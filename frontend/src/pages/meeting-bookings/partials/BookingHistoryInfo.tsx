import { useTranslation } from "react-i18next";
import type { BookingActorApi } from "@/shared/queries/meeting-bookings.queries";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

function ActorRow({
  actor,
  roleLabel
}: {
  actor: BookingActorApi;
  roleLabel: string;
}) {
  const { i18n } = useTranslation();
  const departmentName =
    (i18n.language === "ja"
      ? actor.department?.nameJa
      : actor.department?.nameVi) ?? "";

  return (
    <div className="flex items-center gap-2.5 rounded-md py-1">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-400 text-xs font-semibold text-white">
        {initials(actor.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-gray-800">
          <span>{actor.name}</span>
          <div className="flex items-center gap-1 text-xs text-[#979797] pt-0.5">
            {departmentName ? (
            <span className="truncate">{departmentName}</span>
          ) : null} - {" "}
          <span className="font-normal">{roleLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActorRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-md py-1">
      <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-gray-200" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-40 max-w-full animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

interface BookingHistoryInfoProps {
  creator?: BookingActorApi | null;
  lastEditor?: BookingActorApi | null;
  isLoading?: boolean;
  className?: string;
}

export default function BookingHistoryInfo({
  creator,
  lastEditor,
  isLoading = false,
  className
}: BookingHistoryInfoProps) {
  const { t } = useTranslation();

  if (isLoading && !creator && !lastEditor) {
    return (
      <div className={cn("min-w-0 space-y-1", className)}>
        <ActorRowSkeleton />
        <ActorRowSkeleton />
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      {creator ? (
        <ActorRow
          actor={creator}
          roleLabel={t("meetingPages.form.createdBy")}
        />
      ) : null}
      {lastEditor ? (
        <ActorRow
          actor={lastEditor}
          roleLabel={t("meetingPages.form.lastUpdatedBy")}
        />
      ) : null}
    </div>
  );
}
