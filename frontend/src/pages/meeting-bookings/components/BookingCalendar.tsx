import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Room, BookingEvent } from "../types";
import { TIME_COL_WIDTH, ROOM_COL_WIDTH } from "../constants";
import RoomHeader from "./RoomHeader";
import TimeGrid from "./TimeGrid";

interface BookingCalendarProps {
  currentDate: Date;
  rooms: Room[];
  events: BookingEvent[];
  onEventClick: (event: BookingEvent) => void;
  isLoading?: boolean;
}

export default function BookingCalendar({
  currentDate,
  rooms,
  events,
  onEventClick,
  isLoading = false
}: BookingCalendarProps) {
  const { t } = useTranslation();

  const eventsByRoom = useMemo(() => {
    const map: Record<string, BookingEvent[]> = {};
    for (const room of rooms) map[room.id] = [];
    for (const ev of events) {
      if (map[ev.roomId]) map[ev.roomId].push(ev);
    }
    return map;
  }, [rooms, events]);

  const contentWidth = TIME_COL_WIDTH + (ROOM_COL_WIDTH * rooms.length);

  if (rooms.length === 0 && !isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-12">
        <div className="text-gray-500">
          {t("meetingPages.bookings.noRooms")}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full" style={{ minWidth: contentWidth }}>
        <RoomHeader rooms={rooms} />
        <TimeGrid
          rooms={rooms}
          currentDate={currentDate}
          eventsByRoom={eventsByRoom}
          onEventClick={onEventClick}
          isLoading={false}
        />
      </div>
    </div>
  );
}
