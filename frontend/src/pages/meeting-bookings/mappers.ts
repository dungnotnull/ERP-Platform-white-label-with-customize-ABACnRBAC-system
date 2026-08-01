import i18n from "@/lib/i18n/i18n";
import {
  BookingTimelineApi,
  MeetingRoomApi,
  DepartmentUserApi
} from "@/shared/queries/meeting-bookings.queries";
import { Room, BookingEvent } from "./types";
import {
  DepartmentOption,
  MeetingRoomOption,
  ParticipantOption,
  TaskFormInput
} from "./partials/TaskFormSchema";

type DepartmentLite = {
  id: string;
  nameVi: string;
  nameJa: string;
};

const EXCLUDED_BOOKING_DEPARTMENT_KEYS = new Set([
  "thuctapsinh",
  "研修生",
  "インターン生",
  "intern"
]);

function normalizeDepartmentKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\u3040-\u30ff\u3400-\u9fff]/g, "")
    .toLowerCase();
}

/** Ẩn "THỰC TẬP SINH" khỏi dropdown phòng ban của form booking (chỉ FE). */
export function isExcludedBookingDepartmentOption(
  department: Pick<DepartmentOption, "name"> | DepartmentLite
): boolean {
  const names =
    "nameVi" in department
      ? [department.nameVi, department.nameJa]
      : [department.name];

  return names
    .filter((value): value is string => Boolean(value?.trim()))
    .some(value =>
      EXCLUDED_BOOKING_DEPARTMENT_KEYS.has(normalizeDepartmentKey(value))
    );
}

export const toRoomCards = (rooms: MeetingRoomApi[]): Room[] =>
  rooms.map(room => ({
    id: room.id,
    name: i18n.language === "ja" && room.jpName ? room.jpName : room.name,
    capacity:
      i18n.language === "ja" ? `${room.capacity}席` : `${room.capacity} chỗ`
  }));

const toHm = (iso: string) => {
  const date = new Date(iso);
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
};

export const toCalendarEvents = (
  bookings: BookingTimelineApi[],
  departments: DepartmentLite[]
): BookingEvent[] => {
  const deptNameById = new Map(
    departments.map(dept => [
      dept.id,
      i18n.language === "ja" ? dept.nameJa : dept.nameVi
    ])
  );

  return bookings.flatMap(booking => {
    const title =
      booking.title?.trim() ||
      deptNameById.get(booking.departmentIds?.[0] ?? "") ||
      (i18n.language === "ja" ? "会議予約" : "Đặt phòng");
    const tag = booking.conflictedUsers?.length
      ? i18n.language === "ja"
        ? "競合あり"
        : "Xung đột"
      : undefined;

    return (booking.roomIds || []).map(roomId => ({
      id: booking.id,
      roomId,
      title,
      start: toHm(booking.startTime),
      end: toHm(booking.endTime),
      tag,
      date: booking.startTime.slice(0, 10),
      departmentId: booking.departmentIds?.[0],
      departments: booking.departments,
      participantIds: booking.participantIds || [],
      memo: booking.note || "",
      conflictedUsers: booking.conflictedUsers || []
    }));
  });
};

export const toDepartmentOptions = (
  departments: DepartmentLite[]
): DepartmentOption[] =>
  departments.map(dept => ({
    id: dept.id,
    name: i18n.language === "ja" ? dept.nameJa : dept.nameVi
  }));

export const toParticipantOptions = (
  users: DepartmentUserApi[],
  departmentName: string
): ParticipantOption[] =>
  users.map(user => ({
    id: user.id,
    name: user.name,
    department: departmentName
  }));

export const toMeetingRoomOptions = (
  rooms: MeetingRoomApi[]
): MeetingRoomOption[] =>
  rooms.map(room => ({
    id: room.id,
    name: i18n.language === "ja" && room.jpName ? room.jpName : room.name,
    capacity: room.capacity
  }));

export const toCreateOrUpdatePayload = (values: TaskFormInput) => {
  const startTime = new Date(`${values.date}T${values.startTime}:00`);
  const endTime = new Date(`${values.date}T${values.endTime}:00`);

  return {
    title: values.title.trim(),
    roomIds: values.meetingRoomIds,
    departmentIds: [values.departmentId],
    participantIds: values.participantIds,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    note: values.memo?.trim() || ""
  };
};
