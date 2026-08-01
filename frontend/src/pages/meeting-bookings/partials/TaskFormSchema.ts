import { z } from "zod";
import type { TFunction } from "i18next";
// import { isBeforeToday, isStartTimeInPast } from "../utils";

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface ParticipantOption {
  id: string;
  name: string;
  department: string;
}

export interface MeetingRoomOption {
  id: string;
  name: string;
  capacity: number;
}

export const createTaskFormSchema = (t: TFunction) =>
  z
    .object({
      title: z
        .string()
        .trim()
        .min(1, t("meetingPages.form.errors.titleRequired"))
        .max(255, t("meetingPages.form.errors.titleTooLong")),
      date: z.string().min(1, t("meetingPages.form.errors.dateRequired")),
      startTime: z.string(),
      endTime: z.string(),
      departmentId: z
        .string()
        .min(1, t("meetingPages.form.errors.departmentRequired")),
      participantIds: z.array(z.string()),
      meetingRoomIds: z
        .array(z.string())
        .min(1, t("meetingPages.form.errors.meetingRoomRequired")),
      memo: z.string().optional()
    })
    .superRefine((data, ctx) => {
      // TODO: bật lại khi cần chặn chọn ngày quá khứ
      // if (data.date && isBeforeToday(data.date)) {
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: t("meetingPages.form.errors.dateInPast"),
      //     path: ["date"],
      //   });
      // }

      if (!data.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("meetingPages.form.errors.startTimeRequired"),
          path: ["startTime"]
        });
      }
      // TODO: bật lại khi cần chặn chọn giờ bắt đầu trong quá khứ
      // } else if (
      //   data.date &&
      //   data.startTime &&
      //   isStartTimeInPast(data.date, data.startTime)
      // ) {
      //   ctx.addIssue({
      //     code: z.ZodIssueCode.custom,
      //     message: t("meetingPages.form.errors.startTimeInPast"),
      //     path: ["startTime"],
      //   });
      // }

      if (!data.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("meetingPages.form.errors.endTimeRequired"),
          path: ["endTime"]
        });
      } else if (
        data.startTime &&
        data.endTime &&
        data.endTime <= data.startTime
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("meetingPages.form.errors.endTimeAfterStart"),
          path: ["endTime"]
        });
      }
    });

export type TaskFormInput = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  departmentId: string;
  participantIds: string[];
  meetingRoomIds: string[];
  memo?: string;
};

export const emptyTaskFormValues: TaskFormInput = {
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  departmentId: "",
  participantIds: [],
  meetingRoomIds: [],
  memo: ""
};
