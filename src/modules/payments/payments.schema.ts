import { z } from "zod";

/**
 * Stellar asset codes:
 * - Native asset (XLM) is represented as "XLM" (special case).
 * - Issued/credit assets use 1-12 alphanumeric characters (A-Z, a-z, 0-9).
 * - No spaces, hyphens, or unicode characters are allowed.
 *
 * @see https://developers.stellar.org/docs/issuing-assets/how-to-issue-an-asset
 */
export const stellarAssetCodeSchema = z
  .string()
  .min(1, "Asset code must be at least 1 character")
  .max(12, "Asset code must be at most 12 characters")
  .regex(
    /^[A-Za-z0-9]{1,12}$/,
    "Asset code must be alphanumeric (A-Z, a-z, 0-9) only \u2014 no spaces, hyphens, or special characters",
  );

/**
 * Quote request schema for the payments module.
 *
 * `assetCode` is validated against Stellar rules via {@link stellarAssetCodeSchema}.
 * The native Stellar asset ("XLM") is handled as a regular alphanumeric code
 * that naturally passes the regex; this is documented for clarity.
 */
export const quoteSchema = z.object({
  assetCode: stellarAssetCodeSchema,
  amount: z.string().min(1, "Amount is required"),
  destination: z.string().min(1, "Destination is required"),
});

export type QuoteSchema = z.infer<typeof quoteSchema>;
export type StellarAssetCode = z.infer<typeof stellarAssetCodeSchema>;
