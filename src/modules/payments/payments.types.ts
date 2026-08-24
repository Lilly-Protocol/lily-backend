export interface MoneyAmount {
  assetCode: string;
  assetIssuer?: string;
  amount: string;
}

export interface CreatePaymentQuoteInput {
  fromWalletId: string;
  toAddress: string;
  amount: MoneyAmount;
}

export interface PaymentQuote {
  amount: MoneyAmount;
  estimatedFee: MoneyAmount;
  expiresAt: string;
}

export interface CreatePaymentQuoteResponse {
  quote: PaymentQuote;
}
