import type { QuoteRequest, QuoteResponse } from "./payments.types";

export const paymentsService = {
  getQuote(request: QuoteRequest): QuoteResponse {
    // Stub calculation
    const estimatedFee = (parseFloat(request.amount) * 0.01).toFixed(2);
    const totalAmount = (parseFloat(request.amount) + parseFloat(estimatedFee)).toFixed(2);
    
    return {
      quoteId: `quote_${Date.now()}`,
      estimatedFee,
      exchangeRate: "1.00",
      totalAmount,
    };
  }
};
