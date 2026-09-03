import { AppError } from "../../common/http/app-error";
import type {
  CreateQuoteInput,
  CreateQuoteResponse,
  ExecutePaymentInput,
  ExecutePaymentResponse,
  GetQuoteResponse,
  PaymentRecord,
  Quote,
} from "./payments.types";

const QUOTE_TTL_MS = 5 * 60 * 1000;
const STUB_RATE = "1.0002";

const quotesStore = new Map<string, Quote>();
const paymentsStore: PaymentRecord[] = [];

const generateQuoteId = (): string => {
  return `quote_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const generatePaymentId = (): string => {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

interface ParsedDecimal {
  value: bigint;
  scale: number;
}

const parseDecimal = (input: string): ParsedDecimal => {
  const trimmed = input.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [integerPart = "0", fractionalPart = ""] = unsigned.split(".");
  const digits = `${integerPart || "0"}${fractionalPart}`.replace(/^0+(?=\d)/, "") || "0";

  return {
    value: (negative ? -1n : 1n) * BigInt(digits),
    scale: fractionalPart.length,
  };
};

const formatDecimal = (value: bigint, scale: number): string => {
  if (value === 0n) return "0";

  const negative = value < 0n;
  let digits = (negative ? -value : value).toString();

  if (scale === 0) {
    return `${negative ? "-" : ""}${digits}`;
  }

  digits = digits.padStart(scale + 1, "0");
  const integerPart = digits.slice(0, -scale);
  const fractionalPart = digits.slice(-scale).replace(/0+$/, "");
  const sign = negative ? "-" : "";

  return fractionalPart ? `${sign}${integerPart}.${fractionalPart}` : `${sign}${integerPart}`;
};

const multiplyDecimal = (left: string, right: string): string => {
  const leftValue = parseDecimal(left);
  const rightValue = parseDecimal(right);

  return formatDecimal(leftValue.value * rightValue.value, leftValue.scale + rightValue.scale);
};

/**
 * Applies a one-percent fee to an amount string using exact decimal
 * arithmetic so large and high-precision amounts are not distorted by
 * floating point rounding.
 */
export const applyStubFee = (amount: string): string => {
  return multiplyDecimal(amount, "0.01");
};

const computeDestinationAmount = (sourceAmount: string): string => {
  return multiplyDecimal(sourceAmount, STUB_RATE);
};

const computeFee = (sourceAmount: string): string => {
  return applyStubFee(sourceAmount);
};

const refreshExpiry = (quote: Quote): void => {
  if (Date.now() >= new Date(quote.expiresAt).getTime()) {
    quote.status = "expired";
  }
};

export const paymentsService = {
  createQuote(input: CreateQuoteInput): CreateQuoteResponse {
    const now = new Date();
    const quote: Quote = {
      id: generateQuoteId(),
      sourceAsset: input.sourceAsset,
      destinationAsset: input.destinationAsset,
      sourceAmount: input.sourceAmount,
      destinationAmount: computeDestinationAmount(input.sourceAmount),
      fee: computeFee(input.sourceAmount),
      rate: STUB_RATE,
      expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
      createdAt: now.toISOString(),
      status: "active",
    };

    quotesStore.set(quote.id, quote);

    return { quote };
  },

  getQuoteById(id: string): GetQuoteResponse {
    const quote = quotesStore.get(id);

    if (!quote) {
      throw new AppError(404, "Quote not found");
    }

    refreshExpiry(quote);

    if (quote.status === "expired") {
      throw new AppError(410, "Quote has expired");
    }

    return { quote };
  },

  executePayment(input: ExecutePaymentInput): ExecutePaymentResponse {
    const quote = quotesStore.get(input.quoteId);

    if (!quote) {
      throw new AppError(404, "Quote not found");
    }

    refreshExpiry(quote);

    if (quote.status === "expired") {
      throw new AppError(410, "Quote has expired");
    }

    if (quote.status === "executed") {
      throw new AppError(409, "Quote has already been executed");
    }

    if (!input.confirmed) {
      throw new AppError(400, "Payment must be confirmed");
    }

    const payment: PaymentRecord = {
      id: generatePaymentId(),
      quoteId: quote.id,
      sourceAsset: quote.sourceAsset,
      destinationAsset: quote.destinationAsset,
      sourceAmount: quote.sourceAmount,
      destinationAmount: quote.destinationAmount,
      fee: quote.fee,
      rate: quote.rate,
      status: "settled",
      createdAt: new Date().toISOString(),
    };

    paymentsStore.push(payment);
    quote.status = "executed";

    return { payment };
  },

  reset(): void {
    quotesStore.clear();
    paymentsStore.splice(0, paymentsStore.length);
  },
};
