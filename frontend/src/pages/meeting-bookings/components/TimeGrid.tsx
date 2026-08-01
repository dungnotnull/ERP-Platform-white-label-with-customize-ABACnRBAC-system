import { useMemo } from "react";
import { Room, BookingEvent } from "../types";
import {
  START_HOUR,
  END_HOUR,
  HOUR_HEIGHT,
  TIME_COL_WIDTH
} from "../constants";
import EventCard from "./EventCard";
import NowLine from "./NowLine";
import { isSameDay } from "../utils";

interface TimeGridProps {
  rooms: Room[];
  currentDate: Date;
  eventsByRoom: Record<string, any[]>;
  onEventClick?: (event: BookingEvent) => void;
  isLoading?: boolean;
}

export default function TimeGrid({
  rooms,
  currentDate,
  eventsByRoom,
  onEventClick,
  isLoading
}: TimeGridProps) {
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) list.push(h);
    return list;
  }, []);

  const gridHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
  const today = new Date();

  return (
    <div className="flex w-full min-w-0">
      <div
        className="sticky left-0 top-[52px] z-[48] shrink-0 bg-white md:top-0"
        style={{ width: TIME_COL_WIDTH }}
      >
        {hours.map(h => (
          <div
            key={h}
            className="relative border-r border-gray-100 text-right"
            style={{ height: HOUR_HEIGHT }}
          >
            <span className="absolute right-1.5 top-1 text-[11px] text-gray-400">
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        ))}
      </div>

      {rooms.map(room => (
        <div
          key={room.id}
          className={rooms.length === 1
            ? "relative flex flex-1 border-r border-gray-100"
            : "relative w-[140px] shrink-0 border-r border-gray-100 md:w-auto md:flex-1 md:min-w-0"
          }
        >
          {hours.map(h => (
            <div
              key={h}
              className="border-b border-gray-100"
              style={{ height: HOUR_HEIGHT }}
            />
          ))}

          {isSameDay(currentDate, today) && <NowLine gridHeight={gridHeight} />}

          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300" />
              </div>
            </div>
          ) : (
            eventsByRoom[room.id]?.map(ev => (
              <EventCard key={ev.id} event={ev} onClick={onEventClick} />
            ))
          )}
        </div>
      ))}
    </div>
  );
}
