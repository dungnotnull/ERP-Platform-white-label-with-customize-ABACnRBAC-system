import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { queryKeys } from "@/shared/queries/keys";
import meetingBookingsApi, {
  TimelineQueryParams
} from "../services/meetingBookingsApi.service";
import { BERoom, BEBookingEvent, Room, BookingEvent } from "../types";

// Utility functions
function formatCapacity(capacity: number, locale?: string): string {
  return `${capacity} ${locale === "vi" ? "chỗ" : "席"}`;
}

function formatLocaleName(
  name: string,
  jpName?: string,
  locale?: string
): string {
  if (locale === "ja" && jpName) return jpName;
  return name;
}

// Fallback room list when API fails or returns empty
const FALLBACK_ROOMS_BASE = [
  { id: "mtgA", name: "MTG A", capacity: 16 },
  { id: "mtgB", name: "MTG B", capacity: 10 },
  { id: "mtgC", name: "MTG C", capacity: 6 },
  { id: "pv1", name: "PV 1", capacity: 3 },
  { id: "pv2", name: "PV 2", capacity: 3 },
  { id: "pv3", name: "PV 3", capacity: 3 },
  { id: "pv4", name: "PV 4", capacity: 3 },
  { id: "seminar", name: "SEMINAR", capacity: 150 }
];

function getFallbackRooms(locale?: string): Room[] {
  return FALLBACK_ROOMS_BASE.map(room => ({
    id: room.id,
    name: room.name,
    capacity: formatCapacity(room.capacity, locale)
  }));
}

export function useMeetingRooms(search?: string) {
  return useQuery<BERoom[]>({
    queryKey: queryKeys.meetingRooms(search),
    queryFn: () => meetingBookingsApi.getRooms(search ? { search } : undefined),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });
}

export function useBookingTimeline(params: TimelineQueryParams) {
  return useQuery<BEBookingEvent[]>({
    queryKey: queryKeys.bookingTimeline(params),
    queryFn: () => meetingBookingsApi.getTimeline(params),
    enabled: !!params.startDate && !!params.endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
}

export function useFormattedRooms(search?: string) {
  const { i18n } = useTranslation();
  const { data: rooms, isLoading, error } = useMeetingRooms(search);

  const formattedRooms: Room[] = useMemo(() => {
    // Use fallback if loading failed, data is empty, or there's an error
    if (error || !rooms || rooms.length === 0) {
      return getFallbackRooms(i18n.language);
    }

    return rooms.map(room => ({
      id: room.id,
      name: formatLocaleName(room.name, room.jpName, i18n.language),
      capacity: formatCapacity(room.capacity, i18n.language)
    }));
  }, [rooms, error, i18n.language]);

  return { rooms: formattedRooms, isLoading, error };
}

export function useFormattedBookingTimeline(params: TimelineQueryParams) {
  const { i18n } = useTranslation();
  const { data: bookings, isLoading, error } = useBookingTimeline(params);

  const formattedEvents: BookingEvent[] | undefined = bookings?.flatMap(
    booking => {
      const startTime = new Date(booking.startTime);
      const endTime = new Date(booking.endTime);

      // Format time as HH:mm
      const formatTime = (date: Date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      };

      const locale = i18n.language;

      return booking.roomIds.map(roomId => ({
        id: `${booking.id}-${roomId}`,
        roomId,
        title:
          locale === "vi" ? booking.title : booking.jpTitle || booking.title,
        start: formatTime(startTime),
        end: formatTime(endTime)
      }));
    }
  );

  return { events: formattedEvents, isLoading, error };
}
