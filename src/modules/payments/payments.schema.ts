import { z } from "zod";

export const quoteSchema = z.object({
  fromWalletId: z.string().trim().min(1).max(64),
  toAddress: z.string().trim().min(1).max(64),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,7})?$/, 'amount must be a positive decimal string, e.g. "10.00"'),
  assetCode: z.string().trim().min(1).max(12),
});

export type QuoteSchema = z.infer<typeof quoteSchema>;
