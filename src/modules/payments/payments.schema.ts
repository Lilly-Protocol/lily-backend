import { z } from "zod";

export const createQuoteSchema = z.object({
  sourceAsset: z.string().min(1),
  destinationAsset: z.string().min(1),
  sourceAmount: z.string().min(1),
});

export const executePaymentSchema = z.object({
  quoteId: z.string().min(1),
  confirmed: z.boolean(),
});
