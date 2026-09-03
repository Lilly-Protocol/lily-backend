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

/**
 * Matches a valid positive decimal string: one or more digits, optionally
 * followed by a dot and 1–7 decimal places. Rejects negative values, empty
 * strings, scientific notation ("1e999"), and multi-dot inputs ("1.2.3").
 */
const POSITIVE_DECIMAL_RE = /^\d+(\.\d{1,7})?$/;

const amountString = z
  .string()
  .trim()
  .regex(POSITIVE_DECIMAL_RE, {
    message:
      'Amount must be a positive decimal number with up to 7 decimal places (e.g. "100", "0.05", "1.234567")',
  })
  .transform((value) => normalizeAmount(value));

/**
 * Stellar asset codes are 3-12 uppercase letters. "XLM" represents the
 * native asset. Lowercase and numeric-only codes are rejected.
 */
export const stellarAssetCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{3,12}$/, {
    message: "Asset code must be 3-12 uppercase letters (e.g. USDC, XLM)",
  });

export const quoteSchema = z.object({
  assetCode: stellarAssetCodeSchema,
  amount: amountString,
  destination: z.string().trim().min(1),
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
  confirmed: z.boolean(),
});
