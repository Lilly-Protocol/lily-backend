import { randomUUID } from "node:crypto";

import type {
  PaymentQuote,
  PaymentQuoteInput,
  PaymentQuoteResponse,
} from "./payments.types";

const QUOTE_TTL_MS = 60_000;
const STUB_FEE_PERCENT = 1;

// Stub fee calculator: amount * STUB_FEE_PERCENT / 100 using integer math so
// decimal-string amounts stay exact until a real quoting provider is wired in.
const applyStubFee = (amount: string): string => {
  const [whole = "0", fraction = ""] = amount.split(".");
  const digits = whole + fraction;
  const scale = fraction.length + 2;
  const scaled = (BigInt(digits) * BigInt(STUB_FEE_PERCENT)).toString();
  const padded = scaled.padStart(scale + 1, "0");
  const wholePart = padded.slice(0, -scale) || "0";
  const fractionalPart = padded.slice(-scale).replace(/0+$/, "");
  return fractionalPart ? `${wholePart}.${fractionalPart}` : wholePart;
};

export const paymentsService = {
  getQuote(input: PaymentQuoteInput): PaymentQuoteResponse {
    const quote: PaymentQuote = {
      id: `quote_lily_${randomUUID()}`,
      fromWalletId: input.fromWalletId,
      toAddress: input.toAddress,
      amount: input.amount,
      assetCode: input.assetCode,
      estimatedFee: applyStubFee(input.amount),
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    };

    return { quote };
  },
};
