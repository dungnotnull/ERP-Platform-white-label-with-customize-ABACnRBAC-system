import type { BookingTimelineApi } from "@/shared/queries/meeting-bookings.queries";

type TimeRange = {
  start: Date;
  end: Date;
};

export function buildBookingRange(
  date: string,
  startTime: string,
  endTime: string,
): TimeRange | null {
  if (!date || !startTime || !endTime) return null;

  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }

  return { start, end };
}

export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && a.end > b.start;
}

function getOverlappingBookings(
  bookings: BookingTimelineApi[],
  range: TimeRange,
  excludeBookingId?: string,
): BookingTimelineApi[] {
  return bookings.filter((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) return false;

    return rangesOverlap(range, {
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
    });
  });
}

export function getConflictedParticipantIds(
  bookings: BookingTimelineApi[],
  range: TimeRange,
  participantIds: string[],
  excludeBookingId?: string,
): string[] {
  const overlapping = getOverlappingBookings(bookings, range, excludeBookingId);

  return participantIds.filter((participantId) =>
    overlapping.some((booking) => booking.participantIds?.includes(participantId)),
  );
}

export function getConflictedRoomIds(
  bookings: BookingTimelineApi[],
  range: TimeRange,
  excludeBookingId?: string,
): string[] {
  const overlapping = getOverlappingBookings(bookings, range, excludeBookingId);
  const conflictedRoomIds = new Set<string>();

  for (const booking of overlapping) {
    for (const roomId of booking.roomIds ?? []) {
      conflictedRoomIds.add(roomId);
    }
  }

  return Array.from(conflictedRoomIds);
}
