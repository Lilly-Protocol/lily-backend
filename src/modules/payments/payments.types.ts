export interface PaymentQuoteRequest {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
}

export interface PaymentQuoteResponse {
  quoteId: string;
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
  estimatedFee: string;
  totalCost: string;
  expiresAt: string;
}
