import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTaskFormSchema,
  emptyTaskFormValues,
  TaskFormInput,
  DepartmentOption,
  MeetingRoomOption
} from "./TaskFormSchema";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/Form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/Popover";
import { Calendar } from "@/components/ui/Calendar";
import { CalendarDays } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
// import { startOfToday } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/services/api/apiClient.service";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { useTranslation } from "react-i18next";
import { TaskItem } from "./types";
import { BookingEvent } from "../types";
import ParticipantsField, { ConflictWarningMark } from "./Participantsfield";
import BookingHistoryInfo from "./BookingHistoryInfo";
import { useBookingDetailQuery } from "@/shared/queries/meeting-bookings.queries";
import NoticeDialog from "@/components/ui/NoticeDialog";
import {
  isExcludedBookingDepartmentOption,
  toCreateOrUpdatePayload
} from "../mappers";
import {
  buildBookingRange,
  getConflictedParticipantIds,
  getConflictedRoomIds,
} from "../conflictUtils";
import { useBookingTimelineQuery } from "@/shared/queries/meeting-bookings.queries";
import {
  buildTimeSlots,
  formatFormDateLabel,
  formatTimeOptionLabel,
  getEndTimeSlots,
  parseFormDate,
  snapToNearestTimeSlot,
  toFormDateValue
} from "../utils";
import { cn } from "@/lib/utils";

const BOOKING_TIME_SLOTS = buildTimeSlots();

const ERROR_BORDER =
  "border-red-400 focus:border-red-400 focus:ring-red-300 focus-visible:ring-red-300";

const FORM_INPUT_CLASS =
  "h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-none hover:border-gray-300 hover:shadow-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-none";

const TIME_SELECT_CLASS = cn(
  FORM_INPUT_CLASS,
  "w-full cursor-pointer appearance-none px-1 text-center"
);

const DATE_PICKER_CLASS = cn(
  FORM_INPUT_CLASS,
  "flex w-full items-center justify-between gap-2 text-left"
);

const FORM_SELECT_TRIGGER_CLASS =
  "w-full bg-white border border-gray-300 rounded-md text-sm font-normal text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&_[data-placeholder]]:text-gray-900";

const FORM_ROW_BASE =
  "grid grid-cols-1 gap-y-1.5 space-y-0 md:grid-cols-[112px_minmax(0,1fr)] md:gap-x-3 md:gap-y-0";

const FORM_ROW_CLASS = cn(FORM_ROW_BASE, "items-start md:items-center");

const FORM_ROW_START_CLASS = cn(FORM_ROW_BASE, "items-start md:items-start");

const TIME_SELECT_WIDTH_CLASS =
  "w-[50px] shrink-0 mobile:w-[54px] sm:w-[58px] text-xs mobile:text-sm";

function TimeSlotSelect({
  value,
  options,
  onChange,
  onBlur,
  invalid,
  disabled = false,
  placeholder = "--:--"
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Select
      value={value || undefined}
      disabled={disabled}
      onValueChange={onChange}
      onOpenChange={open => {
        if (!open) onBlur?.();
      }}
    >
      <SelectTrigger
        disabled={disabled}
        className={cn(
          TIME_SELECT_CLASS,
          TIME_SELECT_WIDTH_CLASS,
          "justify-center shadow-none [&>span]:line-clamp-none [&>svg]:hidden",
          value ? "text-gray-900" : "text-gray-400",
          invalid && ERROR_BORDER
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        align="start"
        sideOffset={4}
        className="max-h-60 min-w-[var(--radix-select-trigger-width)]"
      >
        {options.map(slot => (
          <SelectItem
            key={slot}
            value={slot}
            className="justify-center py-2 pl-2 pr-2 text-sm [&>span:first-child]:hidden"
          >
            {formatTimeOptionLabel(slot)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TaskFormProps {
  initialData?: BookingEvent | TaskItem | null;
  onSuccess: () => void;
  onCancel?: () => void;
  departments: DepartmentOption[];
  meetingRooms: MeetingRoomOption[];
  currentUserId: string;
  loading?: boolean;
}

const saveBooking = async (data: {
  id?: string;
  title: string;
  roomIds: string[];
  departmentIds: string[];
  participantIds: string[];
  startTime: string;
  endTime: string;
  note?: string;
  expectedVersion?: number;
}) => {
  if (data.id) {
    const { id, expectedVersion, ...body } = data;
    return apiClient.put(`${apiRoutes[ApiRouteNames.BOOKINGS]}/${id}`, {
      ...body,
      expectedVersion,
    });
  }

  return apiClient.post(apiRoutes[ApiRouteNames.BOOKINGS], data);
};

function iconFor(
  field: "time" | "department" | "history" | "participants" | "room" | "memo"
) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    className: "h-[13px] w-[13px] shrink-0 md:h-[15px] md:w-[15px]"
  } as const;
  switch (field) {
    case "time":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 7v5l3 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "department":
      return (
        <svg {...common}>
          <path
            d="M4 21V5a1 1 0 011-1h6a1 1 0 011 1v16M15 21v-9a1 1 0 011-1h3a1 1 0 011 1v9M4 21h16M8 8h.01M8 12h.01M8 16h.01"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "participants":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M3 20c0-3 2.7-5 6-5s6 2 6 5M16 4.5c1.7.4 3 2 3 3.8 0 1.8-1.3 3.3-3 3.8M21 20c0-2.5-2-4.3-4.5-4.9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "room":
      return (
        <svg {...common}>
          <path
            d="M5 21V4a1 1 0 011-1h9a1 1 0 011 1v17M5 21h13M14 12h.01M9 3v18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "memo":
      return (
        <svg {...common}>
          <path
            d="M4 4h16v16H4V4zM8 9h8M8 13h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

function FieldLabel({
  field,
  required,
  children,
  className
}: {
  field: "time" | "department" | "history" | "participants" | "room" | "memo";
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <FormLabel className={cn("flex items-center gap-1.5", className)}>
      <span className="text-gray-500">{iconFor(field)}</span>
      <span className="whitespace-nowrap text-sm font-normal text-gray-900 md:text-sm">
        {children}
        {required && <span className="ml-0.5 text-red-500">※</span>}
      </span>
    </FormLabel>
  );
}

export default function TaskForm({
  initialData,
  onSuccess,
  onCancel,
  departments,
  meetingRooms,
  loading = false
}: TaskFormProps) {
  const isEditMode = !!initialData;
  const { t } = useTranslation();
  const {
    data: bookingDetail,
    isLoading: loadingBookingDetail,
    isFetching: fetchingBookingDetail
  } = useBookingDetailQuery(initialData?.id, { enabled: isEditMode });
  const isHistoryLoading =
    loadingBookingDetail || (fetchingBookingDetail && !bookingDetail);

  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const [showDeleteNotice, setShowDeleteNotice] = useState(false);
  const [showErrorNotice, setShowErrorNotice] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const schema = useMemo(() => createTaskFormSchema(t), [t]);

  const buildDefaultValues = (
    data?: BookingEvent | TaskItem | null
  ): TaskFormInput => {
    if (!data) return emptyTaskFormValues;

    if ("roomId" in data) {
      const startTime = snapToNearestTimeSlot(data.start, BOOKING_TIME_SLOTS);
      let endTime = snapToNearestTimeSlot(data.end, BOOKING_TIME_SLOTS);
      if (startTime && endTime && endTime <= startTime) {
        endTime = getEndTimeSlots(startTime, BOOKING_TIME_SLOTS)[0] ?? endTime;
      }

      return {
        title: data.title ?? "",
        date: data.date || new Date().toISOString().split("T")[0],
        startTime,
        endTime,
        departmentId: data.departmentId ?? "",
        participantIds: data.participantIds ?? [],
        meetingRoomIds: data.roomId ? [data.roomId] : [],
        memo: data.memo ?? ""
      };
    }

    const startTime = snapToNearestTimeSlot(data.startTime, BOOKING_TIME_SLOTS);
    let endTime = snapToNearestTimeSlot(data.endTime, BOOKING_TIME_SLOTS);
    if (startTime && endTime && endTime <= startTime) {
      endTime = getEndTimeSlots(startTime, BOOKING_TIME_SLOTS)[0] ?? endTime;
    }

    return {
      title: data.title ?? "",
      date: data.date,
      startTime,
      endTime,
      departmentId: data.departmentId,
      participantIds: data.participantIds,
      meetingRoomIds: data.meetingRoomIds ?? [],
      memo: data.memo ?? ""
    };
  };

  const form = useForm<TaskFormInput>({
    resolver: zodResolver(schema) as Resolver<TaskFormInput>,
    defaultValues: buildDefaultValues(initialData)
  });

  const initialDataSignature = useMemo(() => {
    if (!initialData) return "new";

    if ("roomId" in initialData) {
      return [
        initialData.id,
        initialData.roomId,
        initialData.title,
        initialData.date,
        initialData.start,
        initialData.end,
        initialData.departmentId,
        (initialData.participantIds ?? []).join(","),
        initialData.memo ?? ""
      ].join("|");
    }

    return [
      initialData.id,
      initialData.title,
      initialData.date,
      initialData.startTime,
      initialData.endTime,
      initialData.departmentId,
      (initialData.participantIds ?? []).join(","),
      (initialData.meetingRoomIds ?? []).join(","),
      initialData.memo ?? ""
    ].join("|");
  }, [initialData]);

  useEffect(() => {
    form.reset(buildDefaultValues(initialData));
  }, [initialDataSignature, form]);

  const mutation = useMutation({
    mutationFn: saveBooking,
    onSuccess: () => {
      setShowSuccessNotice(true);
    },
    onError: () => {
      setShowErrorNotice(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: { id: string; expectedVersion?: number }) =>
      apiClient.delete(`${apiRoutes[ApiRouteNames.BOOKINGS]}/${data.id}`, {
        data: { expectedVersion: data.expectedVersion },
      }),
    onSuccess: () => {
      setShowDeleteNotice(false);
      setShowSuccessNotice(true);
    },
    onError: () => {
      setShowDeleteNotice(false);
      setShowErrorNotice(true);
    },
  });

  const selectedMeetingRoomIds = form.watch("meetingRoomIds");
  const dateValue = form.watch("date");
  const startTimeValue = form.watch("startTime");
  const endTimeValue = form.watch("endTime");
  const participantIdsValue = form.watch("participantIds");
  const departmentIdValue = form.watch("departmentId");
  const selectableDepartments = useMemo(() => {
    const filtered = departments.filter(
      department => !isExcludedBookingDepartmentOption(department)
    );
    const selected = departments.find(
      department => department.id === departmentIdValue
    );
    if (
      selected &&
      isExcludedBookingDepartmentOption(selected) &&
      !filtered.some(department => department.id === selected.id)
    ) {
      return [selected, ...filtered];
    }
    return filtered;
  }, [departments, departmentIdValue]);
  const parsedTimelineDate = useMemo(
    () => (dateValue ? parseFormDate(dateValue) : null),
    [dateValue],
  );
  const hasCompleteSchedule = Boolean(
    dateValue && startTimeValue && endTimeValue,
  );
  const { data: dayBookings = [], isFetching: isTimelineFetching } =
    useBookingTimelineQuery(parsedTimelineDate ?? new Date(), {
      enabled: Boolean(parsedTimelineDate),
    });
  const bookingRange = useMemo(
    () => buildBookingRange(dateValue, startTimeValue, endTimeValue),
    [dateValue, startTimeValue, endTimeValue],
  );

  const excludeBookingId = initialData?.id;
  const conflictParticipantIds = useMemo(() => {
    if (!isEditMode || !bookingRange) return [];

    return getConflictedParticipantIds(
      dayBookings,
      bookingRange,
      participantIdsValue,
      excludeBookingId,
    );
  }, [
    isEditMode,
    bookingRange,
    dayBookings,
    participantIdsValue,
    excludeBookingId,
  ]);
  const conflictRoomIds = useMemo(() => {
    if (!bookingRange) return [];

    return getConflictedRoomIds(dayBookings, bookingRange, excludeBookingId);
  }, [bookingRange, dayBookings, excludeBookingId]);
  const selectedRoom = meetingRooms.find(
    room => room.id === selectedMeetingRoomIds[0]
  );
  const shouldLockScheduleFields =
    Boolean(parsedTimelineDate) && isTimelineFetching;
  const startTimeOptions = BOOKING_TIME_SLOTS;
  const endTimeOptions = useMemo(
    () => getEndTimeSlots(startTimeValue, startTimeOptions),
    [startTimeValue, startTimeOptions]
  );

  const timeErrors = form.formState.errors;
  const isSubmitted = form.formState.isSubmitted;
  const touchedFields = form.formState.touchedFields;
  const [deferTimeErrors, setDeferTimeErrors] = useState(false);

  const showDateError =
    !!timeErrors.date &&
    (isSubmitted || Boolean(touchedFields.date) || deferTimeErrors);
  const showStartTimeError =
    !!timeErrors.startTime &&
    !deferTimeErrors &&
    (Boolean(touchedFields.startTime) ||
      (isSubmitted && Boolean(form.watch("date"))));
  const showEndTimeError =
    !!timeErrors.endTime &&
    !deferTimeErrors &&
    (Boolean(touchedFields.endTime) ||
      (isSubmitted && Boolean(form.watch("date"))));

  const timeErrorMessage =
    (showDateError ? timeErrors.date?.message : undefined) ||
    (showStartTimeError ? timeErrors.startTime?.message : undefined) ||
    (showEndTimeError ? timeErrors.endTime?.message : undefined);

  const onSubmit = (values: TaskFormInput) => {
    if (isEditMode && loadingBookingDetail) {
      return;
    }

    const payload = toCreateOrUpdatePayload(values);
    mutation.mutate({
      id: initialData?.id,
      ...payload,
      expectedVersion: bookingDetail?.version,
    });
  };

  const handleBookingErrorClose = (open: boolean) => {
    setShowErrorNotice(open);
    if (!open) {
      window.location.reload();
    }
  };

  return (
    <Form form={form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit, () => setDeferTimeErrors(false))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 pb-3">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <div
                  className={cn(
                    "flex items-center gap-2 border-b pb-1 transition-colors",
                    field.value?.trim()
                      ? "border-blue-600"
                      : "border-gray-200 hover:border-gray-300 focus-within:border-gray-400"
                  )}
                >
                  <FormControl className="min-w-0 flex-1">
                    <Input
                      {...field}
                      placeholder={t("meetingPages.form.titlePlaceholder")}
                      maxLength={255}
                      className="h-auto rounded-none border-0 bg-transparent px-0 py-1.5 text-xl font-normal text-gray-900 shadow-none hover:shadow-none focus-visible:border-0 focus-visible:ring-0 focus-visible:shadow-none placeholder:text-gray-500 md:text-2xl"
                    />
                  </FormControl>
                  <span
                    className="shrink-0 pb-px text-xl text-red-500 md:text-2xl"
                    aria-hidden
                  >
                    ※
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pt-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field: dateField }) => (
              <FormItem className={FORM_ROW_CLASS}>
                <FieldLabel field="time" required>
                  {t("meetingPages.form.time")}
                </FieldLabel>
                <div className="min-w-0 space-y-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <FormControl className="min-w-0 flex-1">
                      <Popover
                        open={isDatePickerOpen}
                        onOpenChange={open => {
                          if (shouldLockScheduleFields) return;
                          setIsDatePickerOpen(open);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            disabled={shouldLockScheduleFields}
                            className={cn(
                              DATE_PICKER_CLASS,
                              "min-w-0",
                              shouldLockScheduleFields &&
                                "cursor-not-allowed opacity-60",
                              showDateError && ERROR_BORDER
                            )}
                          >
                            <span
                              className={cn(
                                "min-w-0 truncate",
                                dateField.value
                                  ? "text-gray-900"
                                  : "text-gray-400"
                              )}
                            >
                              {dateField.value
                                ? formatFormDateLabel(dateField.value)
                                : t("meetingPages.form.datePlaceholder")}
                            </span>
                            <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto border-0 p-0"
                          align="start"
                        >
                          <Calendar
                            mode="single"
                            selected={parseFormDate(dateField.value)}
                            // TODO: bật lại khi cần chặn chọn ngày quá khứ
                            // disabled={{ before: startOfToday() }}
                            onSelect={date => {
                              if (!date) return;
                              const value = toFormDateValue(date);
                              dateField.onChange(value);
                              setIsDatePickerOpen(false);
                              setDeferTimeErrors(true);
                              form.clearErrors([
                                "date",
                                "startTime",
                                "endTime"
                              ]);

                              const availableStarts = BOOKING_TIME_SLOTS;
                              const currentStart = form.getValues("startTime");
                              if (
                                currentStart &&
                                !availableStarts.includes(currentStart)
                              ) {
                                const nextStart = availableStarts[0] ?? "";
                                form.setValue("startTime", nextStart);
                                form.setValue(
                                  "endTime",
                                  nextStart
                                    ? (getEndTimeSlots(
                                        nextStart,
                                        BOOKING_TIME_SLOTS
                                      )[0] ?? "")
                                    : ""
                                );
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field: startField }) => (
                          <FormControl>
                            <TimeSlotSelect
                              value={startField.value}
                              options={startTimeOptions}
                              invalid={showStartTimeError}
                              disabled={shouldLockScheduleFields}
                              onChange={value => {
                                setDeferTimeErrors(false);
                                startField.onChange(value);
                                const currentEnd = form.getValues("endTime");
                                if (currentEnd && currentEnd <= value) {
                                  form.setValue(
                                    "endTime",
                                    getEndTimeSlots(
                                      value,
                                      BOOKING_TIME_SLOTS
                                    )[0] ?? ""
                                  );
                                }
                                void form.trigger(["startTime", "endTime"]);
                              }}
                              onBlur={() => {
                                startField.onBlur();
                                void form.trigger(["startTime", "endTime"]);
                              }}
                            />
                          </FormControl>
                        )}
                      />
                      <span className="text-gray-400">~</span>
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field: endField }) => (
                          <FormControl>
                            <TimeSlotSelect
                              value={endField.value}
                              options={endTimeOptions}
                              invalid={showEndTimeError}
                              disabled={shouldLockScheduleFields}
                              onChange={value => {
                                setDeferTimeErrors(false);
                                endField.onChange(value);
                                void form.trigger(["startTime", "endTime"]);
                              }}
                              onBlur={() => {
                                endField.onBlur();
                                void form.trigger(["startTime", "endTime"]);
                              }}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                  </div>
                  {timeErrorMessage && (
                    <p className="text-sm font-medium text-red-500">
                      {timeErrorMessage}
                    </p>
                  )}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field, fieldState }) => (
              <FormItem className={FORM_ROW_CLASS}>
                <FieldLabel field="department" required>
                  {t("meetingPages.form.department")}
                </FieldLabel>
                <div className="min-w-0 space-y-1">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger
                        className={cn(
                          FORM_SELECT_TRIGGER_CLASS,
                          fieldState.error && ERROR_BORDER
                        )}
                      >
                        <SelectValue
                          placeholder={t("meetingPages.form.department")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
                      {selectableDepartments.map(department => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {isEditMode ? (
            <FormItem className={cn(FORM_ROW_START_CLASS, "min-w-0")}>
              <FieldLabel field="history" className="md:pt-2">
                {t("meetingPages.form.historyInfo")}
              </FieldLabel>
              <div className="min-w-0">
                <BookingHistoryInfo
                  creator={bookingDetail?.creator}
                  lastEditor={bookingDetail?.lastEditor}
                  isLoading={isHistoryLoading}
                />
              </div>
            </FormItem>
          ) : null}

          <FormField
            control={form.control}
            name="participantIds"
            render={({ field, fieldState }) => (
              <FormItem className={cn(FORM_ROW_START_CLASS, "min-w-0")}>
                <FieldLabel field="participants" className="md:pt-2">
                  {t("meetingPages.form.participants")}
                </FieldLabel>
                <div className="min-w-0 space-y-1">
                  <FormControl>
                    <ParticipantsField
                      value={field.value}
                      onChange={field.onChange}
                      conflictIds={conflictParticipantIds}
                      departmentOptions={departments}
                      invalid={!!fieldState.error}
                      reloadKey={initialData?.id}
                      initialParticipants={bookingDetail?.participants}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meetingRoomIds"
            render={({ field, fieldState }) => (
              <FormItem className={FORM_ROW_CLASS}>
                <FieldLabel field="room" required>
                  {t("meetingPages.form.meetingRoom")}
                </FieldLabel>
                <div className="min-w-0 space-y-1">
                  <div className="flex min-w-0 flex-col gap-1.5 mobile:flex-col sm:flex-row sm:items-center sm:gap-2">
                    <div className="flex min-w-0 items-center gap-1.5 sm:w-[52%]">
                      <div className="min-w-0 flex-1">
                        <Select
                          disabled={shouldLockScheduleFields}
                          value={field.value[0] ?? ""}
                          onValueChange={value => field.onChange([value])}
                        >
                          <FormControl>
                            <SelectTrigger
                              disabled={shouldLockScheduleFields}
                              className={cn(
                                FORM_SELECT_TRIGGER_CLASS,
                                "min-w-0",
                                shouldLockScheduleFields &&
                                  "cursor-not-allowed opacity-60",
                                fieldState.error && ERROR_BORDER
                              )}
                            >
                              <SelectValue
                                placeholder={t("meetingPages.form.meetingRoom")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
                            {meetingRooms.map(room => {
                              const isConflicted =
                                hasCompleteSchedule &&
                                conflictRoomIds.includes(room.id);

                              return (
                                <SelectItem key={room.id} value={room.id}>
                                  <span className="flex w-full items-center justify-between gap-2">
                                    <span>{room.name}</span>
                                    {isConflicted ? (
                                      <ConflictWarningMark />
                                    ) : null}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {selectedRoom && (
                      <span className="shrink-0 self-end whitespace-nowrap text-[11px] text-gray-400 mobile:text-xs sm:self-auto">
                        {t("meetingPages.form.capacityUpTo", {
                          count: selectedRoom.capacity
                        })}
                      </span>
                    )}
                  </div>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="memo"
            render={({ field }) => (
              <FormItem className={FORM_ROW_START_CLASS}>
                <FieldLabel field="memo" className="md:pt-2">
                  {t("meetingPages.form.memo")}
                </FieldLabel>
                <div className="min-w-0 space-y-1">
                  <FormControl>
                    <textarea
                      {...field}
                      rows={3}
                      placeholder={t("meetingPages.form.memoPlaceholder")}
                      className="min-h-[72px] w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 z-10 shrink-0 space-y-3 border-t border-gray-100 bg-white pt-3">
          <p className="text-right text-[11px] leading-relaxed text-gray-400 mobile:text-xs">
            <span className="text-red-500">
              ※{t("meetingPages.form.requiredLegend")}
            </span>
            <span className="ml-3 text-amber-500">⚠</span>
            {t("meetingPages.form.conflictLegend")}
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            {isEditMode ? (
              <button
                type="button"
                onClick={() => setShowDeleteNotice(true)}
                disabled={
                  mutation.isPending || deleteMutation.isPending || loading
                }
                className="flex items-center gap-1.5 self-start text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a1 1 0 01-1 1H8a1 1 0 01-1-1V7h10zM10 11v6M14 11v6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("meetingPages.form.deleteBooking")}
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}

            <div className="flex w-full gap-2 sm:w-auto">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={
                    mutation.isPending || deleteMutation.isPending || loading
                  }
                  className="h-11 flex-1 rounded-full sm:flex-none sm:px-5"
                >
                  {t("common.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  mutation.isPending ||
                  deleteMutation.isPending ||
                  loading ||
                  (isEditMode && loadingBookingDetail)
                }
                className="h-11 flex-1 rounded-full bg-blue-600 sm:flex-none sm:px-5 hover:bg-blue-700"
              >
                {mutation.isPending || deleteMutation.isPending
                  ? t("common.handling")
                  : t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <NoticeDialog
        open={showDeleteNotice}
        onOpenChange={setShowDeleteNotice}
        variant="danger"
        title={t("notice.delete.title")}
        message={t("notice.delete.message")}
        subMessage={t("notice.delete.subMessage")}
        showCancel
        confirmText={t("notice.ok")}
        cancelText={t("notice.cancel")}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!initialData?.id) return;
          deleteMutation.mutate({
            id: initialData.id,
            expectedVersion: bookingDetail?.version,
          });
        }}
      />

      <NoticeDialog
        open={showErrorNotice}
        onOpenChange={handleBookingErrorClose}
        variant="danger"
        title={t("meetingPages.form.errors.genericTitle")}
        message={t("meetingPages.form.errors.generic")}
        subMessage={t("meetingPages.form.errors.genericSub")}
        confirmText={t("notice.ok")}
        onConfirm={() => {}}
      />

      <NoticeDialog
        open={showSuccessNotice}
        onOpenChange={setShowSuccessNotice}
        variant="success"
        title={t("notice.success.title")}
        message={
          isEditMode
            ? t("meetingPages.form.updateSuccess")
            : t("meetingPages.form.createSuccess")
        }
        confirmText={t("notice.ok")}
        onConfirm={() => {
          setShowSuccessNotice(false);
          onSuccess();
        }}
      />
    </Form>
  );
}
