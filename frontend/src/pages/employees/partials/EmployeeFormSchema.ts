import * as z from "zod";
import type { TFunction } from "i18next";
import { EMPLOYEE_NAME_MAX_LENGTH } from "@/shared/constants/employee.constant";

export const ROLE_OPTIONS = ["ADMIN", "MANAGER", "LEADER", "MEMBER"] as const;

export type EmployeeRole = (typeof ROLE_OPTIONS)[number];

/** Map API/DB role to a value accepted by the form schema. */
export function normalizeEmployeeRole(role?: string | null): EmployeeRole {
  const normalized = role?.trim().toUpperCase();
  if (normalized && (ROLE_OPTIONS as readonly string[]).includes(normalized)) {
    return normalized as EmployeeRole;
  }
  return "MEMBER";
}

export function createEmployeeFormSchema(t: TFunction) {
  const requiredDepartment = () =>
    z
      .string({ message: t("employees.errors.selectDepartment") })
      .min(1, { message: t("employees.errors.selectDepartment") })
      .refine(v => v !== "all", {
        message: t("employees.errors.selectDepartment")
      });

  const requiredPosition = () =>
    z
      .string({ message: t("employees.errors.selectPosition") })
      .min(1, { message: t("employees.errors.selectPosition") })
      .refine(v => v !== "all", {
        message: t("employees.errors.selectPosition")
      });

  return z.object({
    name: z
      .string({ message: t("employees.errors.nameRequired") })
      .trim()
      .min(1, { message: t("employees.errors.nameRequired") })
      .max(EMPLOYEE_NAME_MAX_LENGTH, {
        message: t("employees.errors.nameMaxLength", {
          max: EMPLOYEE_NAME_MAX_LENGTH
        })
      }),
    email: z
      .string({ message: t("employees.errors.emailRequired") })
      .min(1, { message: t("employees.errors.emailRequired") })
      .email({ message: t("common.invalidEmail") }),
    employeeCode: z
      .string()
      .trim()
      .min(1, { message: t("employees.errors.employeeCodeRequired") }),
    department: requiredDepartment(),
    position: requiredPosition(),
    role: z.enum(ROLE_OPTIONS).default("MEMBER"),
    isActive: z.boolean()
  });
}

export type EmployeeFormValues = z.infer<
  ReturnType<typeof createEmployeeFormSchema>
>;
export type EmployeeFormInput = z.input<
  ReturnType<typeof createEmployeeFormSchema>
>;
