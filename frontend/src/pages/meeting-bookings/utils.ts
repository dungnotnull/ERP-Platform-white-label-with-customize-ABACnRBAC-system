import i18n from "@/lib/i18n/i18n";

export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export const BOOKING_TIME_SLOT_MINUTES = 30;
export const BOOKING_TIME_SLOT_START = "07:00";
export const BOOKING_TIME_SLOT_END = "18:00";

export function buildTimeSlots(
  start = BOOKING_TIME_SLOT_START,
  end = BOOKING_TIME_SLOT_END,
  intervalMinutes = BOOKING_TIME_SLOT_MINUTES
): string[] {
  const slots: string[] = [];
  let cursor = toMinutes(start);
  const endMinutes = toMinutes(end);

  while (cursor <= endMinutes) {
    const hour = Math.floor(cursor / 60);
    const minute = cursor % 60;
    slots.push(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    );
    cursor += intervalMinutes;
  }

  return slots;
}

export function formatTimeOptionLabel(time: string) {
  const [hour, minute] = time.split(":");
  return `${Number(hour)}:${minute}`;
}

export function getEndTimeSlots(startTime: string, slots: string[]) {
  if (!startTime) return slots;
  return slots.filter(slot => slot > startTime);
}

export function snapToNearestTimeSlot(time: string, slots: string[]): string {
  if (!time || slots.length === 0) return "";
  if (slots.includes(time)) return time;

  const target = toMinutes(time);
  return slots.reduce((closest, slot) => {
    const closestDiff = Math.abs(toMinutes(closest) - target);
    const slotDiff = Math.abs(toMinutes(slot) - target);
    return slotDiff < closestDiff ? slot : closest;
  }, slots[0]);
}

export function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const locale = i18n.language;

  if (locale === "ja") {
    return `${y}年${m}月${d}日`;
  } else if (locale === "vi") {
    return `Ngày ${d} tháng ${m} năm ${y}`;
  }
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseFormDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function toFormDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatFormDateLabel(value: string): string {
  const date = parseFormDate(value);
  if (!date) return "";

  if (i18n.language === "ja") {
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getMonth() + 1}月${date.getDate()}日 (${weekdays[date.getDay()]})`;
  }

  if (i18n.language === "vi") {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return toFormDateValue(date);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isBeforeToday(dateValue: string): boolean {
  const date = parseFormDate(dateValue);
  if (!date) return false;
  return date < startOfToday();
}

export function buildBookingDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function isStartTimeInPast(date: string, startTime: string): boolean {
  if (!date || !startTime) return false;
  return buildBookingDateTime(date, startTime) <= new Date();
}

export function getAvailableStartTimeSlots(
  dateValue: string,
  slots: string[]
): string[] {
  if (!dateValue || isBeforeToday(dateValue)) return slots;

  const todayValue = toFormDateValue(new Date());
  if (dateValue !== todayValue) return slots;

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  return slots.filter(slot => toMinutes(slot) > nowMinutes);
}
