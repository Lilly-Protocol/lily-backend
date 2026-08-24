import { z } from "zod";

const stellarAddress = z
  .string()
  .regex(
    /^G[A-Z0-9]{55}$/,
    "Must be a 56 character Stellar public key starting with G",
  );

const moneyAmountSchema = z.object({
  assetCode: z
    .string()
    .regex(
      /^[A-Za-z0-9]{1,12}$/,
      "Asset code must be 1 to 12 alphanumeric characters",
    ),
  assetIssuer: stellarAddress.optional(),
  amount: z
    .string()
    .regex(
      /^\d+(\.\d{1,7})?$/,
      "Amount must be a decimal string with at most 7 decimal places",
    )
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
});

export const createPaymentQuoteSchema = z.object({
  fromWalletId: z.string().min(2).max(80),
  toAddress: stellarAddress,
  amount: moneyAmountSchema,
});

export type CreatePaymentQuoteSchema = z.infer<typeof createPaymentQuoteSchema>;
