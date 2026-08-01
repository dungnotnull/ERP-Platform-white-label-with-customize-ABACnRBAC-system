import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogTitle,
  VisuallyHidden
} from "@/components/ui/Dialog";

import { DepartmentOption, MeetingRoomOption } from "./TaskFormSchema";
import { TaskItem } from "./types";
import TaskForm from "./BookingForm";

const BOOKING_MODAL_CONTENT_CLASS =
  "flex w-[calc(100%-1.25rem)] max-w-none flex-col overflow-hidden rounded-2xl bg-white p-0 max-h-[calc(100dvh-5.5rem)] md:max-h-[85vh] md:max-w-[472px] md:rounded-3xl";

const BOOKING_MODAL_BODY_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6";

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit: TaskItem | null;
  onSuccess: () => void;
  departments: DepartmentOption[];
  meetingRooms: MeetingRoomOption[];
  currentUserId: string;
}

export default function TaskFormModal({
  open,
  onOpenChange,
  taskToEdit,
  onSuccess,
  departments,
  meetingRooms,
  currentUserId
}: TaskFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={BOOKING_MODAL_CONTENT_CLASS}
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Booking form</DialogTitle>
        </VisuallyHidden>
        <DialogBody className={BOOKING_MODAL_BODY_CLASS}>
          <TaskForm
            key={taskToEdit?.id ?? "new"}
            initialData={taskToEdit}
            onSuccess={onSuccess}
            onCancel={() => onOpenChange(false)}
            departments={departments}
            meetingRooms={meetingRooms}
            currentUserId={currentUserId}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
