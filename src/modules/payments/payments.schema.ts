import { z } from "zod";
import { StrKey } from "@stellar/stellar-sdk";

export const stellarAddressSchema = z
  .string()
  .trim()
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
    }
  );

/**
 * Validates a Stellar asset code.
 * Native XLM and issued assets (1-12 alphanumeric characters).
 */
export const stellarAssetCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9]{1,12}$/, "Asset code must be 1-12 alphanumeric characters")
  .toUpperCase();

export const createPaymentQuoteSchema = z.object({
  fromWalletId: z.string().trim().min(1).max(120),
  toAddress: stellarAddressSchema,
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,7})?$/, "Amount must be a positive decimal string"),
  assetCode: stellarAssetCodeSchema,
});

export type CreatePaymentQuoteSchema = z.infer<
  typeof createPaymentQuoteSchema
>;
