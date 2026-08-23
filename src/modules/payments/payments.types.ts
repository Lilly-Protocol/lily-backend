export interface PaymentQuoteInput {
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
  estimatedFee: string;
  expiresAt: string;
}

export interface PaymentQuoteResponse {
  quote: PaymentQuote;
}
