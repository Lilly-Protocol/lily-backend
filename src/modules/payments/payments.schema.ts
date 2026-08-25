import { z } from "zod";

/**
 * Stellar asset codes:
 * - Native asset (XLM) is represented as "XLM" (special case)
 * - Credit assets use 1-12 alphanumeric characters (A-Z, a-z, 0-9)
 * - No spaces, hyphens, or unicode allowed
 *
 * @see https://developers.stellar.org/docs/issuing-assets/how-to-issue-an-asset
 */
export const stellarAssetCodeSchema = z
  .string()
  .min(1, "Asset code must be at least 1 character")
  .max(12, "Asset code must be at most 12 characters")
  .regex(/^[A-Za-z0-9]{1,12}$/, "Asset code must be alphanumeric (A-Z, a-z, 0-9) only — no spaces, hyphens, or special characters");

/**
 * Quote request schema for payments.
 * Validates that assetCode conforms to Stellar rules.
 * Native XLM is documented as the special case for the native asset.
 */
export const quoteSchema = z.object({
  assetCode: stellarAssetCodeSchema,
  amount: z.string().min(1, "Amount is required"),
  destination: z.string().min(1, "Destination is required"),
});

export type QuoteSchema = z.infer<typeof quoteSchema>;
export type StellarAssetCode = z.infer<typeof stellarAssetCodeSchema>;
