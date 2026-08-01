import { z } from "zod";
import type { TFunction } from "i18next";

export function createPurchaseOrderSchema(t: TFunction) {
  return z.object({
    id: z.string().uuid().optional(),

    supplierId: z.string().uuid().or(z.literal("")),

    orderDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: t("purchase.form.errors.invalidDate")
      })
      .optional(),

    invoiceNumber: z.string().max(50).optional().nullable(),
    notes: z.string().optional().nullable(),

    totalAmount: z.coerce
      .number()
      .nonnegative({
        message: t("purchase.form.errors.totalAmountNonNegative")
      })
      .default(0),

    items: z.array(
      z.object({
        deviceTypeId: z.string().uuid(),
        deviceName: z.string().optional(),
        quantity: z.number().min(1, {
          message: t("purchase.form.errors.itemQuantityMin")
        }),
        unitPrice: z.number().min(0, {
          message: t("purchase.form.errors.itemUnitPriceMin")
        })
      })
    ),

    status: z.string().optional().nullable(),

    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable()
  });
}

export type PurchaseOrderFormValues = z.infer<
  ReturnType<typeof createPurchaseOrderSchema>
>;
