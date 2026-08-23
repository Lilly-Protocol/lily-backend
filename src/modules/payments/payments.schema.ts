import { z } from "zod";

const stellarAccountPattern = /^G[A-Z0-9]{55}$/;
const amountPattern = /^\d+(\.\d{1,7})?$/;
const assetCodePattern = /^[A-Za-z0-9]{1,12}$/;

export const createQuoteSchema = z.object({
  fromWalletId: z.string().min(3).max(80),
  toAddress: z
    .string()
    .regex(stellarAccountPattern, "toAddress must be a valid Stellar account address"),
  amount: z
    .string()
    .regex(amountPattern, "amount must be a positive decimal string with at most 7 decimal places")
    .refine((value) => Number.parseFloat(value) > 0, {
      message: "amount must be greater than zero",
    }),
  assetCode: z
    .string()
    .regex(assetCodePattern, "assetCode must be 1-12 alphanumeric characters"),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
