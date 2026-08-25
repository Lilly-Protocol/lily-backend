import { z } from "zod";

export const quoteSchema = z.object({
  fromWalletId: z.string().min(1, "fromWalletId is required"),
  toAddress: z.string().min(1, "toAddress is required").max(64),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,7})?$/, "amount must be a valid decimal string"),
  assetCode: z.string().min(1, "assetCode is required").max(12),
});

export type QuoteSchema = z.infer<typeof quoteSchema>;
