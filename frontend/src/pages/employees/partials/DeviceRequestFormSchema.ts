import { z } from "zod";

export const DeviceRequestFormSchema = z.object({
  userId: z.string().min(1),
  deviceTypeId: z.string().min(1),
  type: z.enum(["NEW_ASSIGNMENT", "REPLACEMENT", "REPAIR"]),
  quantity: z.number().min(1),
  reason: z.string().optional()
});

export type DeviceRequestFormValues = z.infer<typeof DeviceRequestFormSchema>;
