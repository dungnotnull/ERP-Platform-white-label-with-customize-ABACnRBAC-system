import * as z from "zod";
import type { TFunction } from "i18next";
import { POSITION_NAME_MAX_LENGTH } from "@/shared/constants/organization.constant";

export function createPositionFormSchema(t: TFunction) {
  return z.object({
    nameVi: z
      .string({ message: t("teams.positionForm.nameViRequired") })
      .trim()
      .min(1, { message: t("teams.positionForm.nameViRequired") })
      .max(POSITION_NAME_MAX_LENGTH, {
        message: t("teams.positionForm.nameMaxLength", {
          max: POSITION_NAME_MAX_LENGTH
        })
      }),
    nameJa: z
      .string()
      .trim()
      .max(POSITION_NAME_MAX_LENGTH, {
        message: t("teams.positionForm.nameMaxLength", {
          max: POSITION_NAME_MAX_LENGTH
        })
      })
      .optional()
      .or(z.literal("")),
    level: z.string().optional()
  });
}

export type PositionFormValues = z.infer<
  ReturnType<typeof createPositionFormSchema>
>;
