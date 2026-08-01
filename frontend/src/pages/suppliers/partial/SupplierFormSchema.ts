import { z } from "zod";
import type { TFunction } from "i18next";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function createSupplierFormSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: t("supplier.errors.nameMinLength") })
      .max(255, {
        message: t("supplier.errors.nameMaxLength", { max: 255 })
      }),

    contactPerson: z
      .string()
      .trim()
      .min(1, { message: t("supplier.errors.contactPersonRequired") }),

    phone: z
      .string()
      .trim()
      .min(1, { message: t("supplier.errors.phoneRequired") })
      .regex(/^(0|\+84)[0-9]{9,10}$/, {
        message: t("common.invalidPhone")
      }),

    email: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(value => !value || EMAIL_REGEX.test(value), {
        message: t("common.invalidEmail")
      }),

    address: z
      .string()
      .trim()
      .min(1, { message: t("supplier.errors.addressRequired") }),

    website: z.string().optional(),
    notes: z.string().optional()
  });
}

export type SupplierFormValues = z.infer<
  ReturnType<typeof createSupplierFormSchema>
>;
