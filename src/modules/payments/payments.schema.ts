import { z } from "zod";

export const createQuoteSchema = z.object({
  fromWalletId: z.string().min(1, "fromWalletId is required"),
  toAddress: z.string().min(1, "toAddress is required"),
  amount: z.number().positive("amount must be greater than 0"),
  assetCode: z
    .string()
    .min(1, "assetCode is required")
    .max(12, "assetCode must be at most 12 characters")
    .regex(/^[A-Z0-9]+$/, "assetCode must be uppercase alphanumeric"),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
