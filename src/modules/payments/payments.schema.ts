import { StrKey } from "@stellar/stellar-sdk";
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
  const intPart = parts[0].replace(/^0+/, "") || "0";
  const decPart = parts.length > 1 ? "." + parts.slice(1).join(".") : "";
  return intPart + decPart;
};

/**
 * Helper to validate a 56-character Stellar account public key (G... or M...).
 */
export const isValidStellarAddress = (address: string): boolean => {
  if (typeof address !== "string" || address.length !== 56) {
    return false;
  }
  try {
    return StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
};

/**
 * Validates a 56-character Ed25519 public key Stellar address.
 */
export const stellarAddressSchema = z
  .string()
  .length(56, "Stellar address must be exactly 56 characters")
  .refine(
    (val) => {
      try {
        return StrKey.isValidEd25519PublicKey(val);
      } catch {
        return false;
      }
    },
    {
      message: "Invalid Stellar address checksum or format",
    },
  );

/**
 * Validates a Stellar asset code (1-12 alphanumeric characters, e.g., XLM, USDC).
 */
export const stellarAssetCodeSchema = z
  .string()
  .min(1, "Asset code must be at least 1 character")
  .max(12, "Asset code must be at most 12 characters")
  .regex(
    /^[A-Za-z0-9]{1,12}$/,
    "Asset code must be alphanumeric (A-Z, a-z, 0-9) only",
  );

/**
 * Validates an asset identifier that can either be a Stellar asset code (1-12 alphanumeric chars)
 * or a 56-character Stellar account address.
 */
export const stellarAssetOrAddressSchema = z.string().refine(
  (val) => {
    if (/^[A-Za-z0-9]{1,12}$/.test(val)) {
      return true;
    }
    if (val.length === 56) {
      try {
        return StrKey.isValidEd25519PublicKey(val);
      } catch {
        return false;
      }
    }
    return false;
  },
  {
    message:
      "Asset must be a valid Stellar asset code (1-12 alphanumeric characters) or a 56-character Stellar address",
  },
);

/**
 * Positive decimal number schema that trims input and normalizes leading zeros.
 */
export const positiveDecimalSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val).trim())
  .refine((val) => /^\d+(\.\d+)?$/.test(val), {
    message: "sourceAmount must be a valid positive decimal number",
  })
  .transform(normalizeAmount)
  .refine(
    (val) => {
      const num = Number(val);
      return !Number.isNaN(num) && num > 0;
    },
    {
      message: "sourceAmount must be greater than zero",
    },
  );

/**
 * Schema for quote requests.
 */
export const quoteSchema = z
  .object({
    amount: z.string().min(1, "Amount is required").transform(normalizeAmount),
    currency: z.string().min(3).max(3).default("USD"),
    assetCode: stellarAssetCodeSchema.optional(),
    destination: z.string().min(1).optional(),
    toAddress: stellarAddressSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.assetCode !== undefined && data.destination === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "destination is required when assetCode is provided",
        path: ["destination"],
      });
    }
  });

/**
 * Request schema for POST /api/v1/payments (create quote).
 */
export const createQuoteSchema = z.object({
  sourceAsset: stellarAssetOrAddressSchema,
  destinationAsset: stellarAssetOrAddressSchema,
  sourceAmount: positiveDecimalSchema,
  destination: z.string().optional(),
  toAddress: stellarAddressSchema.optional(),
});

/**
 * Request schema for POST /api/v1/payments/execute (execute payment).
 */
export const executePaymentSchema = z.object({
  quoteId: z.string().min(1, "quoteId is required"),
  confirmed: z.boolean(),
});

export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteOutput = z.output<typeof quoteSchema>;
export type CreateQuoteInput = z.input<typeof createQuoteSchema>;
export type CreateQuoteOutput = z.output<typeof createQuoteSchema>;
export type ExecutePaymentInput = z.input<typeof executePaymentSchema>;
export type ExecutePaymentOutput = z.output<typeof executePaymentSchema>;
