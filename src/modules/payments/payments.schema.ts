import { z } from "zod";

export const createPaymentQuoteSchema = z.object({
  fromWalletId: z.string().trim().min(1).max(120),
  toAddress: z.string().trim().min(1).max(120),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,7})?$/, "Amount must be a positive decimal string"),
  assetCode: z.string().trim().min(1).max(12).toUpperCase(),
});

export type CreatePaymentQuoteSchema = z.infer<
  typeof createPaymentQuoteSchema
>;
