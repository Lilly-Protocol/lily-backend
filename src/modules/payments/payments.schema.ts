import { z } from "zod";

import {
  isValidStellarAddress,
  stellarAddressSchema,
} from "./stellar-address.validator";

export { isValidStellarAddress, stellarAddressSchema };

export const quoteSchema = z.object({
  fromWalletId: z.string().trim().min(1, "fromWalletId is required"),
  toAddress: stellarAddressSchema,
  amount: z
    .string()
    .trim()
    .regex(
      /^\d+(\.\d{1,7})?$/,
      "amount must be a valid positive decimal string",
    ),
  assetCode: z.string().trim().min(1, "assetCode is required").max(12),
});

export const createPaymentQuoteSchema = quoteSchema;
export const quoteRequestSchema = quoteSchema;

export type QuoteSchema = z.infer<typeof quoteSchema>;
export type CreatePaymentQuoteSchema = QuoteSchema;
export type QuoteRequestSchema = QuoteSchema;
