export interface CreateQuoteInput {
  fromWalletId: string;
  toAddress: string;
  amount: number;
  assetCode: string;
}

export interface PaymentQuote {
  quoteId: string;
  fromWalletId: string;
  toAddress: string;
  assetCode: string;
  amount: number;
  feeAmount: number;
  totalAmount: number;
  createdAt: string;
  expiresAt: string;
}

export interface CreateQuoteResponse {
  quote: PaymentQuote;
}
