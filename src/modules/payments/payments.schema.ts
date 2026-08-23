import { z } from "zod";

export const quoteRequestSchema = z.object({
  fromWalletId: z.string().min(1, "fromWalletId is required"),
  toAddress: z.string().min(1, "toAddress is required"),
  amount: z.string().regex(/^\d+(\.\d+)?$/, "amount must be a valid number string"),
  assetCode: z.string().min(2, "assetCode is required"),
});

export type QuoteRequestSchema = z.infer<typeof quoteRequestSchema>;
