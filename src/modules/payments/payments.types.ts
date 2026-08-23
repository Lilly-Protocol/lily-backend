export interface QuoteRequest {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
}

export interface QuoteResponse {
  quoteId: string;
  estimatedFee: string;
  exchangeRate: string;
  totalAmount: string;
}
