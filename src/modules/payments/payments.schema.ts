import { z } from "zod";

export const createPaymentQuoteSchema = z.object({
  fromWalletId: z.string().min(1),
  toAddress: z.string().min(1),
  amount: z.string().min(1),
  assetCode: z.string().min(1),
});

export type CreatePaymentQuoteSchema = z.infer<
  typeof createPaymentQuoteSchema
>;
