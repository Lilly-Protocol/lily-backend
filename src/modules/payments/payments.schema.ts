import { z } from "zod";

export const createPaymentQuoteSchema = z.object({
  fromWalletId: z.string().trim().min(1).max(128),
  toAddress: z.string().trim().min(1).max(56),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "Must be a positive decimal amount")
    .refine((value) => Number(value) > 0, "Must be greater than zero"),
  assetCode: z
    .string()
    .trim()
    .min(1)
    .max(12)
    .regex(/^[A-Za-z0-9]+$/, "Must be an alphanumeric asset code"),
});

export type CreatePaymentQuoteSchema = z.infer<typeof createPaymentQuoteSchema>;