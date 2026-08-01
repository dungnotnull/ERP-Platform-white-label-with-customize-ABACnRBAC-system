import { z } from "zod";
import type { TFunction } from "i18next";

export function createDeviceFormSchema(t: TFunction) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: t("assets.form.errors.nameRequired") }),

      serialNumber: z
        .string()
        .trim()
        .min(1, { message: t("assets.form.errors.serialRequired") }),

      model: z.string().trim().optional(),

      manufacturer: z.string().trim().optional(),

      purchaseDate: z.string().optional(),

      purchasePrice: z.union([z.string(), z.number()]).optional(),

      warrantyExpiryDate: z.string().optional(),

      notes: z.string().trim().optional(),

      deviceTypeId: z
        .string()
        .trim()
        .min(1, { message: t("assets.form.errors.deviceTypeRequired") }),

      deviceStatusId: z
        .string()
        .trim()
        .min(1, { message: t("assets.form.errors.deviceStatusRequired") })
    })
    .superRefine((data, ctx) => {
      // purchasePrice >= 0
      if (
        data.purchasePrice !== undefined &&
        data.purchasePrice !== null &&
        data.purchasePrice !== ""
      ) {
        const price = Number(data.purchasePrice);

        if (isNaN(price) || price < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["purchasePrice"],
            message: t("assets.form.errors.purchasePriceInvalid")
          });
        }
      }

      // warrantyExpiryDate > purchaseDate
      if (data.purchaseDate && data.warrantyExpiryDate) {
        const purchaseDate = new Date(data.purchaseDate);
        const warrantyExpiryDate = new Date(data.warrantyExpiryDate);

        if (
          !isNaN(purchaseDate.getTime()) &&
          !isNaN(warrantyExpiryDate.getTime()) &&
          warrantyExpiryDate <= purchaseDate
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["warrantyExpiryDate"],
            message: t("assets.form.errors.warrantyMustBeAfterPurchase")
          });
        }
      }
    });
}

export type DeviceFormValues = z.infer<
  ReturnType<typeof createDeviceFormSchema>
>;
