export interface QuoteRequest {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
}

export interface QuoteResponse {
  quoteId: string;
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
  estimatedFee: string;
  estimatedTotal: string;
  expiresAt: string;
  createdAt: string;
}
