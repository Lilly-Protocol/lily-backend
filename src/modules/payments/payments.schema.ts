import { z } from "zod";

const walletIdPrefix = "wallet_lily_";

export const walletIdSchema = z
  .string()
  .min(walletIdPrefix.length + 1, "fromWalletId must include a wallet identifier")
  .max(64, "fromWalletId must be at most 64 characters")
  .regex(
    /^wallet_lily_[a-z0-9_]+$/,
    "fromWalletId must start with wallet_lily_ and contain only lowercase letters, numbers, and underscores",
  );

export const quoteSchema = z.object({
  fromWalletId: walletIdSchema,
  toAddress: z.string().min(1, "toAddress is required"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,7})?$/, "amount must be a valid decimal string"),
  assetCode: z.string().min(1, "assetCode is required"),
});

export type QuoteSchema = z.infer<typeof quoteSchema>;
