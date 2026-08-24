export interface MoneyAmount {
  assetCode: string;
  assetIssuer?: string | undefined;
  amount: string;
}

export interface PaymentQuoteRequest {
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
