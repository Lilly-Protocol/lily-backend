export interface CreatePaymentQuoteInput {
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
  fee: string;
  expiresAt: string;
}

export interface CreatePaymentQuoteResponse {
  quote: PaymentQuote;
}
