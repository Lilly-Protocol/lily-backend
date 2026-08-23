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

export const createPaymentQuoteSchema = z.object({
  fromWalletId: z.string().trim().min(1).max(120),
  toAddress: stellarAddressSchema,
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,7})?$/, "Amount must be a positive decimal string"),
  assetCode: z.string().trim().min(1).max(12).toUpperCase(),
});

export type CreatePaymentQuoteSchema = z.infer<
  typeof createPaymentQuoteSchema
>;
