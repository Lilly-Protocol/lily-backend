export interface Quote {
  id: string;
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
  estimatedFee: string;
  totalAmount: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateQuoteInput {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
}

export interface CreateQuoteResponse {
  quote: Quote;
}
