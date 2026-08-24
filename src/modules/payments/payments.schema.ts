import { z } from "zod";

export const paymentQuoteSchema = z.object({
  fromWalletId: z.string().min(1, "fromWalletId is required"),
  toAddress: z
    .string()
    .regex(/^G[A-Z0-9]{55}$/, "toAddress must be a valid Stellar address"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,7})?$/, "amount must be a valid decimal string"),
  assetCode: z.string().min(1).max(12),
});

export type PaymentQuoteSchema = z.infer<typeof paymentQuoteSchema>;
