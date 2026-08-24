import { z } from "zod";

export const quoteRequestSchema = z.object({
  fromWalletId: z.string().min(1, "fromWalletId is required"),
  toAddress: z.string().regex(/^G[A-Z0-9]{55}$/, "Invalid Stellar G-address format"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,7})?$/, "Amount must be a positive number with up to 7 decimal places"),
  assetCode: z.string().min(1).max(12).regex(/^[A-Za-z0-9]+$/, "assetCode must be 1-12 alphanumeric characters"),
});
