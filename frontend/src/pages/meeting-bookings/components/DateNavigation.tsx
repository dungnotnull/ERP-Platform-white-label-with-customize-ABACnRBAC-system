import { ChevronLeft, ChevronRight, Funnel } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addDays, isSameDay } from "../utils";
import { useTranslation } from "react-i18next";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { useState } from "react";

interface Room {
  id: string;
  name: string;
}

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  rooms?: Room[];
  selectedRoomId?: string | null;
  onRoomChange?: (roomId: string | null) => void;
}

export default function DateNavigation({
  currentDate,
  onDateChange,
  rooms = [],
  selectedRoomId = null,
  onRoomChange
}: DateNavigationProps) {
  const { t , i18n} = useTranslation();
  const today = new Date();
  const [isRoomFilterOpen, setIsRoomFilterOpen] = useState(false);

  const todayText = t("common.today", { defaultValue: "今日" });
  const prevDayLabel = t("meetingPages.previousDay", {
    defaultValue: "前の日"
  });
  const nextDayLabel = t("meetingPages.nextDay", { defaultValue: "次の日" });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
    }
  };

  const handleRoomSelect = (roomId: string | null) => {
    onRoomChange?.(roomId);
    setIsRoomFilterOpen(false);
  };

  const formatShortDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  };

  const formatDate = (date: Date) => {
    const locale = i18n.language || "vi";
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();

    if (locale === "ja") {
      return `${y}年${m}月${d}日`;
    }
    return `Ngày ${d} tháng ${m} năm ${y}`;
  };

  return (
    <div className="sticky top-0 z-[49] md:z-[11] self-start flex w-full shrink-0 items-center justify-center border-b border-gray-100 md:bg-[#F7F7F7] pr-4 md:pl-2 pb-3 md:pt-3 sm:px-4 mt-0 rounded-[12px] md:w-[98%]">
      <div className="flex w-full max-w-[640px] flex-wrap items-center justify-center gap-2 sm:gap-3">
        {/* Desktop/Tablet layout - single row */}
        <div className="hidden sm:flex w-full items-center justify-center gap-3">
          <Button
            variant={isSameDay(currentDate, today) ? "default" : "outline"}
            size="sm"
            onClick={() => onDateChange(today)}
            className="min-w-[92px] rounded-full text-sm"
          >
            {todayText}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="min-w-[9.5rem] text-center text-base font-semibold tracking-wider text-primary hover:underline focus:outline-none sm:text-xl ml-2">
                {formatDate(currentDate)}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-0 p-0 z-[9999]" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateChange(addDays(currentDate, -1))}
              aria-label={prevDayLabel}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDateChange(addDays(currentDate, 1))}
              aria-label={nextDayLabel}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Mobile layout - two separate gray areas with gap */}
        <div className="flex w-full sm:hidden items-stretch md:items-center justify-between md:justify-center gap-2">
          {/* First gray area: Date navigation */}
          <div className="flex items-center gap-3 bg-[#F7F7F7] rounded-md px-3 py-2 flex-1 justify-center">
            <Button
              variant={isSameDay(currentDate, today) ? "default" : "outline"}
              size="sm"
              onClick={() => onDateChange(today)}
              className="min-w-[60px] rounded-full text-xs"
            >
              {todayText}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <button className="min-w-[5.5rem] text-center text-sm font-semibold tracking-wider text-primary hover:underline focus:outline-none ml-1">
                  {formatShortDate(currentDate)}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto border-0 p-0 z-[9999]" align="center">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={handleDateSelect}
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDateChange(addDays(currentDate, -1))}
                aria-label={prevDayLabel}
                className="h-7 w-7 rounded-full"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDateChange(addDays(currentDate, 1))}
                aria-label={nextDayLabel}
                className="h-7 w-7 rounded-full"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          {/* Second gray area: Room filter with Funnel icon */}
          {onRoomChange && rooms.length > 0 && (
            <Popover open={isRoomFilterOpen} onOpenChange={setIsRoomFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-[52px] w-[52px] rounded-md bg-[#F7F7F7] hover:bg-gray-200"
                >
                  <Funnel size={20} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[160px] p-2 z-[9999]" align="end">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleRoomSelect(null)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs text-left rounded-md hover:bg-gray-100 ${
                      !selectedRoomId ? "bg-blue-50 text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {t("meetingPages.filter.allRooms", { defaultValue: "すべて" })}
                  </button>
                  {rooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomSelect(room.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs text-left rounded-md hover:bg-gray-100 ${
                        selectedRoomId === room.id ? "bg-blue-50 text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
