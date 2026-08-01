import * as z from "zod";
import type { TFunction } from "i18next";
import { DEPARTMENT_NAME_MAX_LENGTH } from "@/shared/constants/organization.constant";

export function createDepartmentFormSchema(t: TFunction) {
  return z.object({
    code: z
      .string({ message: t("teams.departmentForm.codeRequired") })
      .trim()
      .min(1, { message: t("teams.departmentForm.codeRequired") }),
    nameVi: z
      .string({ message: t("teams.departmentForm.nameViRequired") })
      .trim()
      .min(1, { message: t("teams.departmentForm.nameViRequired") })
      .max(DEPARTMENT_NAME_MAX_LENGTH, {
        message: t("teams.departmentForm.nameMaxLength", {
          max: DEPARTMENT_NAME_MAX_LENGTH
        })
      }),
    nameJa: z
      .string()
      .trim()
      .max(DEPARTMENT_NAME_MAX_LENGTH, {
        message: t("teams.departmentForm.nameMaxLength", {
          max: DEPARTMENT_NAME_MAX_LENGTH
        })
      })
      .optional()
      .or(z.literal("")),
    description: z.string().optional()
  });
}

export type DepartmentFormValues = z.infer<
  ReturnType<typeof createDepartmentFormSchema>
>;
