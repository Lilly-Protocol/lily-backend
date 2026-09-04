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

const quotesStore = new Map<string, Quote>();
const paymentsStore: PaymentRecord[] = [];

const generateQuoteId = (): string => {
  return `quote_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const generatePaymentId = (): string => {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Applies a one-percent fee to an amount string using exact decimal
 * arithmetic (the decimal point is shifted two places left) so large and
 * high-precision amounts are not distorted by floating point rounding.
 */
export const applyStubFee = (amount: string): string => {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === "0" || trimmed === "-0") {
    return "0";
  }

  const isNegative = trimmed.startsWith("-");
  const unsigned = isNegative ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ""] = unsigned.split(".");
  const digits = intPart + fracPart;
  let scale = fracPart.length + 2;

  let big = BigInt(digits.replace(/^0+(?=\d)/, "") || "0");

  while (scale > 0 && big % 10n === 0n) {
    big /= 10n;
    scale -= 1;
  }

  if (big === 0n) {
    return "0";
  }

  const sign = isNegative ? "-" : "";

  if (scale === 0) {
    return `${sign}${big.toString()}`;
  }

  const padded = big.toString().padStart(scale + 1, "0");
  const intResult = padded.slice(0, padded.length - scale);
  const fracResult = padded.slice(-scale);

  return `${sign}${intResult}.${fracResult}`;
};

const QUOTE_RATE = "1.0002";

const parseDecimal = (
  amount: string,
): { digits: bigint; scale: number; sign: string } => {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === "0" || trimmed === "-0") {
    return { digits: 0n, scale: 0, sign: "" };
  }

  const isNegative = trimmed.startsWith("-");
  const unsigned = isNegative ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ""] = unsigned.split(".");
  const digits = BigInt((intPart + fracPart).replace(/^0+(?=\d)/, "") || "0");

  return {
    digits,
    scale: fracPart.length,
    sign: isNegative ? "-" : "",
  };
};

const formatDecimal = (digits: bigint, scale: number, sign: string): string => {
  if (digits === 0n) {
    return "0";
  }

  let big = digits;
  let remainingScale = scale;

  while (remainingScale > 0 && big % 10n === 0n) {
    big /= 10n;
    remainingScale -= 1;
  }

  if (remainingScale === 0) {
    return `${sign}${big.toString()}`;
  }

  const padded = big.toString().padStart(remainingScale + 1, "0");
  const intResult = padded.slice(0, padded.length - remainingScale);
  const fracResult = padded.slice(-remainingScale);

  return `${sign}${intResult}.${fracResult}`;
};

const multiplyDecimals = (left: string, right: string): string => {
  const a = parseDecimal(left);
  const b = parseDecimal(right);
  const negative = a.sign !== b.sign && a.digits !== 0n && b.digits !== 0n;

  return formatDecimal(a.digits * b.digits, a.scale + b.scale, negative ? "-" : "");
};

const computeDestinationAmount = (sourceAmount: string): string => {
  return multiplyDecimals(sourceAmount, QUOTE_RATE);
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
      rate: QUOTE_RATE,
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
