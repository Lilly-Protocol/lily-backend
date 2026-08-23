export type QuoteStatus = "pending";

export interface CreateQuoteInput {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
}

export interface PaymentQuote {
  id: string;
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
  feeAmount: string;
  totalAmount: string;
  status: QuoteStatus;
  expiresAt: string;
}

export interface CreateQuoteResponse {
  quote: PaymentQuote;
}
