import { z } from "zod";

const stellarAccountIdSchema = z
  .string()
  .regex(
    /^G[A-Z2-7]{55}$/,
    "Must be a 56 character Stellar account ID starting with G",
  );

const assetCodeSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9]{1,12}$/,
    "Must be an alphanumeric asset code of up to 12 characters",
  );

const decimalAmountSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Must be a non-negative decimal amount as a string")
  .refine((value) => Number.parseFloat(value) > 0, {
    message: "Must be greater than zero",
  });

export const createPaymentQuoteSchema = z.object({
  fromWalletId: z.string().min(1).max(128),
  toAddress: stellarAccountIdSchema,
  amount: z
    .object({
      assetCode: assetCodeSchema,
      assetIssuer: stellarAccountIdSchema.optional(),
      amount: decimalAmountSchema,
    })
    .strict(),
});

export type CreatePaymentQuoteSchema = z.infer<typeof createPaymentQuoteSchema>;
