import type {
  CreateQuoteInput,
  CreateQuoteResponse,
  Quote,
} from "./payments.types";

const quoteStore: Quote[] = [];
let quoteIdCounter = 1;

const generateQuoteId = (): string => {
  const id = `quote_${quoteIdCounter}`;
  quoteIdCounter += 1;
  return id;
};

const calculateStubFee = (amount: string): string => {
  const numAmount = parseFloat(amount);
  return (numAmount * 0.001).toFixed(7); // 0.1% fee
};

export const paymentsService = {
  createQuote(input: CreateQuoteInput): CreateQuoteResponse {
    const fee = calculateStubFee(input.amount);
    const totalAmount = (parseFloat(input.amount) + parseFloat(fee)).toFixed(7);

    const quote: Quote = {
      id: generateQuoteId(),
      fromWalletId: input.fromWalletId,
      toAddress: input.toAddress,
      amount: input.amount,
      assetCode: input.assetCode,
      estimatedFee: fee,
      totalAmount,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    quoteStore.push(quote);

    return { quote };
  },

  reset(): void {
    quoteStore.splice(0, quoteStore.length);
    quoteIdCounter = 1;
  },
};
