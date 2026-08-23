export interface MoneyAmount {
  assetCode: string;
  amount: string;
}

export interface CreatePaymentQuoteInput {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  assetCode: string;
}

export interface PaymentQuote {
  amount: MoneyAmount;
  estimatedFee: MoneyAmount;
  expiresAt: string;
}