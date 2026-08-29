export interface PaymentQuoteInput {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
}

export interface PaymentQuote {
  quoteId: string;
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
  feeAmount: string;
  totalAmount: string;
  expiresAt: string;
  status: "quoted";
}

export interface CreatePaymentQuoteResponse {
  quote: PaymentQuote;
}

export type QuoteRequest = PaymentQuoteInput;
export type QuoteResponse = CreatePaymentQuoteResponse;
