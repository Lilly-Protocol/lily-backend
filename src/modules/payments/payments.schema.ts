import { z } from "zod";
import { StrKey } from "@stellar/stellar-base";

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
    }
  );

export const quoteSchema = z.object({
  toAddress: stellarAddressSchema,
});

export type QuoteSchema = z.infer<typeof quoteSchema>;
