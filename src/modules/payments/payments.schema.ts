import { z } from "zod";

export const createQuoteSchema = z.object({
  fromWalletId: z.string().min(2).max(80),
  toAddress: z.string().min(2).max(80),
  amount: z.string().regex(/^\d+(\.\d{1,7})?$/, "Amount must be a valid number"),
  assetCode: z.string().min(2).max(20),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
