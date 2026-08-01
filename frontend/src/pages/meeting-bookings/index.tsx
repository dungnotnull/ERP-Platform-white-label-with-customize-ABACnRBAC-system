"use client";

import { useMemo, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import { CalendarDays, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import BookingCalendar from "./components/BookingCalendar";
import DateNavigation from "./components/DateNavigation";
import { BookingEvent } from "./types";
import BookingForm from "./partials/BookingForm";
import { useUserProfile } from "@/shared/hooks/useUserProfile";
import {
  bookingDetailQueryOptions,
  getBookingTimelineDateKey,
  useBookingDepartmentsQuery,
  useBookingTimelineQuery,
  useMeetingRoomsQuery
} from "@/shared/queries/meeting-bookings.queries";
import {
  toCalendarEvents,
  toDepartmentOptions,
  toMeetingRoomOptions
} from "./mappers";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/queries/keys";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  VisuallyHidden
} from "@/components/ui/Dialog";

const BOOKING_MODAL_CONTENT_CLASS =
  "flex w-[calc(100%-1.25rem)] max-w-none flex-col overflow-hidden rounded-2xl bg-white p-0 max-h-[calc(100dvh-5.5rem)] md:max-h-[85vh] md:max-w-[472px] md:rounded-3xl";

const BOOKING_MODAL_BODY_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6";

type SelectedBookingRef = {
  id: string;
  roomId: string;
};

export default function MeetingBookingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBookingRef, setSelectedBookingRef] =
    useState<SelectedBookingRef | null>(null);
  const [formSessionKey, setFormSessionKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const { user: profile } = useUserProfile();
  const { data: rooms = [], isLoading: loadingRooms } = useMeetingRoomsQuery();
  const { data: departments = [], isLoading: loadingDepartments } =
    useBookingDepartmentsQuery();
  const { data: timeline = [], isLoading: loadingTimeline } =
    useBookingTimelineQuery(currentDate);

  const departmentOptions = useMemo(
    () => toDepartmentOptions(departments),
    [departments, t]
  );
  const meetingRoomOptions = useMemo(
    () => toMeetingRoomOptions(rooms),
    [rooms, t]
  );
  const calendarRooms = useMemo(
    () =>
      meetingRoomOptions
        .filter(room => !selectedRoomId || room.id === selectedRoomId)
        .map(room => ({
          id: room.id,
          name: room.name,
          capacity: t("meetingPages.form.capacityUpToInRoomHeader", { count: room.capacity })
        })),
    [meetingRoomOptions, selectedRoomId, t]
  );
  const calendarEvents = useMemo(
    () => toCalendarEvents(timeline, departments),
    [timeline, departments, t]
  );

  const editingEvent = useMemo(() => {
    if (!selectedBookingRef) return null;

    return (
      calendarEvents.find(
        event =>
          event.id === selectedBookingRef.id &&
          event.roomId === selectedBookingRef.roomId
      ) ?? null
    );
  }, [calendarEvents, selectedBookingRef]);

  const isLoading = loadingRooms || loadingTimeline || loadingDepartments;

  const openModal = () => {
    setFormSessionKey(current => current + 1);
    setIsModalOpen(true);
  };

  const handleCreateBooking = () => {
    setSelectedBookingRef(null);
    openModal();
  };

  const handleEventClick = (event: BookingEvent) => {
    void queryClient.prefetchQuery(bookingDetailQueryOptions(event.id));
    setSelectedBookingRef({ id: event.id, roomId: event.roomId });
    openModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBookingRef(null);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedBookingRef(null);
    }
  };

  const handleSuccess = async () => {
    const dateKey = getBookingTimelineDateKey(currentDate);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.bookingTimeline({ dateKey })
    });
    await queryClient.refetchQueries({
      queryKey: queryKeys.bookingTimeline({ dateKey })
    });
    if (selectedBookingRef?.id) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bookingDetail(selectedBookingRef.id)
      });
    }
    handleCloseModal();
  };

  const bookingFormKey = selectedBookingRef
    ? `${selectedBookingRef.id}-${selectedBookingRef.roomId}-${formSessionKey}`
    : `new-${formSessionKey}`;

  return (
    <div className="flex h-[calc(100dvh-64px-160px)] max-h-[calc(100dvh-64px-160px)] md:h-[calc(100dvh-64px-48px)] md:max-h-[calc(100dvh-64px-48px)] w-full flex-col overflow-hidden bg-white">
      <PageTopBar
        title={t("meetingPages.bookings.title")}
        description={t("meetingPages.bookings.description")}
        Icon={CalendarDays}
        className="mb-3 mobile:mb-4 mobile:[&_svg]:!size-10"
        headerActions={
          <Button
            type="button"
            className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[50px] text-sm sm:w-[200px] md:mr-[50px] md:ml-0 md:text-base !pl-1"
            onClick={handleCreateBooking}
          >
            <Plus size={24} />
            {t("meetingPages.createBooking", { defaultValue: "会議室予約" })}
          </Button>
        }
      />
      <DateNavigation
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        rooms={meetingRoomOptions}
        selectedRoomId={selectedRoomId}
        onRoomChange={setSelectedRoomId}
      />
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin md:scrollbar-horizontal mb-5 md:mb-0">
        <BookingCalendar
          currentDate={currentDate}
          rooms={calendarRooms}
          events={calendarEvents}
          onEventClick={handleEventClick}
          isLoading={isLoading}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent
          className={BOOKING_MODAL_CONTENT_CLASS}
          showCloseButton={false}
        >
          <VisuallyHidden>
            <DialogTitle>
              {t("meetingPages.bookings.title")}
            </DialogTitle>
          </VisuallyHidden>
          <DialogBody className={BOOKING_MODAL_BODY_CLASS}>
            <BookingForm
              key={bookingFormKey}
              initialData={editingEvent}
              onSuccess={handleSuccess}
              onCancel={handleCloseModal}
              departments={departmentOptions}
              meetingRooms={meetingRoomOptions}
              currentUserId={profile?._id ?? ""}
              loading={isLoading}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
