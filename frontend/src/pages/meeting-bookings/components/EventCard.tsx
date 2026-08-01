import { BookingEvent } from "../types";
import { toMinutes } from "../utils";
import { START_HOUR, HOUR_HEIGHT } from "../constants";
import { useTranslation } from "react-i18next";

interface EventCardProps {
  event: BookingEvent;
  onClick?: (event: BookingEvent) => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  const { i18n } = useTranslation();
  const startMin = toMinutes(event.start) - START_HOUR * 60;
  const endMin = toMinutes(event.end) - START_HOUR * 60;
  const top = (startMin / 60) * HOUR_HEIGHT + 0;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT - 4, 4);
  const compact = height < 40;

  const departmentNames = event?.departments
    ?.map(dept => (i18n.language === "ja" ? dept.nameJa : dept.nameVi))
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="absolute left-1 right-1 overflow-hidden rounded-[5px] border-l-[5px] border-[#337EFE] bg-[#E6F3FF] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-blue-100 cursor-pointer"
      style={{ top, height }}
      onClick={() => onClick?.(event)}
    >
      {compact ? (
        <div className="flex h-full items-center justify-between gap-1 px-[10px] pt-0">
          <span className="truncate text-[11px] font-medium text-[#337EFE]">
            {event.title}
          </span>
          <span className="shrink-0 text-[10px] text-gray-500">
            {event.start}
          </span>
        </div>
      ) : (
        <div className="flex h-full flex-col px-[10px] py-1 justify-start pt-2">
          <span className="truncate text-xs font-semibold text-[#337EFE]">
            {event.title}
          </span>
          <span className="text-wrap text-[11px] text-gray-500">
            {event.start} - {event.end}
            {departmentNames ? `【${departmentNames}】` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
