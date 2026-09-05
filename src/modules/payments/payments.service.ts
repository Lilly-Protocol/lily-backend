import crypto from "crypto";
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
const MAX_IN_MEMORY_QUOTES = 5_000;

const quotesStore = new Map<string, Quote>();
const paymentsStore: PaymentRecord[] = [];

const generateQuoteId = (): string => {
  return `quote_${crypto.randomUUID()}`;
};

const generatePaymentId = (): string => {
  return `pay_${crypto.randomUUID()}`;
};

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

  const s = big.toString().padStart(scale + 1, "0");
  const intStr = s.slice(0, s.length - scale);
  const fracStr = s.slice(s.length - scale);
  return `${sign}${intStr}.${fracStr}`;
};

export const sweepExpiredQuotes = (): number => {
  const now = Date.now();
  let evicted = 0;
  for (const [id, quote] of quotesStore.entries()) {
    if (new Date(quote.expiresAt).getTime() <= now) {
      quotesStore.delete(id);
      evicted++;
    }
  }
  return evicted;
};

export const createQuote = (input: CreateQuoteInput): CreateQuoteResponse => {
  sweepExpiredQuotes();

  if (quotesStore.size >= MAX_IN_MEMORY_QUOTES) {
    const oldestKey = quotesStore.keys().next().value;
    if (oldestKey) {
      quotesStore.delete(oldestKey);
    }
  }

  const quoteId = generateQuoteId();
  const feeAmount = applyStubFee(input.sourceAmount);
  const expiresAt = new Date(Date.now() + QUOTE_TTL_MS).toISOString();

  const quote: Quote = {
    quoteId,
    sourceAsset: input.sourceAsset,
    sourceAmount: input.sourceAmount,
    destinationAsset: input.destinationAsset,
    destinationAmount: input.sourceAmount,
    feeAmount,
    expiresAt,
    createdAt: new Date().toISOString(),
  };

  quotesStore.set(quoteId, quote);

  return {
    quoteId: quote.quoteId,
    sourceAsset: quote.sourceAsset,
    sourceAmount: quote.sourceAmount,
    destinationAsset: quote.destinationAsset,
    destinationAmount: quote.destinationAmount,
    feeAmount: quote.feeAmount,
    expiresAt: quote.expiresAt,
  };
};

export const getQuote = (quoteId: string): GetQuoteResponse => {
  const quote = quotesStore.get(quoteId);

  if (!quote) {
    throw new AppError(404, `Quote '${quoteId}' was not found`);
  }

  if (new Date(quote.expiresAt).getTime() <= Date.now()) {
    quotesStore.delete(quoteId);
    throw new AppError(410, `Quote '${quoteId}' has expired`);
  }

  return {
    quoteId: quote.quoteId,
    sourceAsset: quote.sourceAsset,
    sourceAmount: quote.sourceAmount,
    destinationAsset: quote.destinationAsset,
    destinationAmount: quote.destinationAmount,
    feeAmount: quote.feeAmount,
    expiresAt: quote.expiresAt,
  };
};

export const executePayment = (
  input: ExecutePaymentInput,
): ExecutePaymentResponse => {
  const quote = getQuote(input.quoteId);
  const paymentId = generatePaymentId();

  const paymentRecord: PaymentRecord = {
    paymentId,
    quoteId: quote.quoteId,
    senderWallet: input.senderWallet,
    recipientWallet: input.recipientWallet,
    sourceAsset: quote.sourceAsset,
    sourceAmount: quote.sourceAmount,
    destinationAsset: quote.destinationAsset,
    destinationAmount: quote.destinationAmount,
    feeAmount: quote.feeAmount,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  paymentsStore.push(paymentRecord);
  quotesStore.delete(input.quoteId);

  return {
    paymentId: paymentRecord.paymentId,
    quoteId: paymentRecord.quoteId,
    senderWallet: paymentRecord.senderWallet,
    recipientWallet: paymentRecord.recipientWallet,
    sourceAsset: paymentRecord.sourceAsset,
    sourceAmount: paymentRecord.sourceAmount,
    destinationAsset: paymentRecord.destinationAsset,
    destinationAmount: paymentRecord.destinationAmount,
    feeAmount: paymentRecord.feeAmount,
    status: paymentRecord.status,
    completedAt: paymentRecord.createdAt,
  };
};

export const paymentsService = {
  createQuote,
  getQuote,
  executePayment,
  applyStubFee,
  sweepExpiredQuotes,
  reset: (): void => {
    quotesStore.clear();
    paymentsStore.length = 0;
  },
};
