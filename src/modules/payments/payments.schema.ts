import { z } from "zod";

/**
 * Normalizes a decimal amount string by stripping leading zeros
 * while preserving the canonical decimal form.
 * "007.00" -> "7.00", "0.50" -> "0.50", "100.00" -> "100.00"
 */
export const normalizeAmount = (val: string): string => {
  const trimmed = val.trim();
  if (!trimmed) return trimmed;

  const parts = trimmed.split(".");
  // Strip leading zeros from integer part, but keep at least one digit
  const intPart = (parts[0] ?? "").replace(/^0+/, "") || "0";
  const decPart = parts.length > 1 ? "." + parts.slice(1).join(".") : "";
  return intPart + decPart;
};

const amountString = z
  .string()
  .trim()
  .min(1)
  .regex(/^\d+(\.\d{1,7})?$/, {
    message: "Amount must be a positive decimal number with at most 7 decimals",
  })
  .transform((value) => normalizeAmount(value));

/**
 * Stellar asset codes are 1-12 alphanumeric characters. "XLM" represents the
 * native asset and is allowed as a special case of the same charset.
 */
export const stellarAssetCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(12)
  .regex(/^[A-Za-z0-9]+$/, {
    message: "Asset code must be 1-12 alphanumeric characters (e.g. USDC, XLM)",
  });

export const currencyCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/, {
    message: "Currency must be exactly 3 uppercase letters (e.g. USD)",
  });

export const quoteSchema = z.object({
  assetCode: stellarAssetCodeSchema,
  amount: amountString,
  destination: z.string().trim().min(1),
  currency: currencyCodeSchema.optional(),
});

export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteOutput = z.output<typeof quoteSchema>;

export const createQuoteSchema = z.object({
  sourceAsset: z.string().trim().min(1),
  destinationAsset: z.string().trim().min(1),
  sourceAmount: amountString,
});

export const executePaymentSchema = z.object({
  quoteId: z.string().trim().min(1),
  senderWallet: z.string().trim().min(1),
  recipientWallet: z.string().trim().min(1),
});
