import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/api-response";
import { paymentsService } from "./payments.service";
import type {
  CreatePaymentQuoteResponse,
  PaymentQuoteInput,
} from "./payments.types";

export const createPaymentQuote = (
  request: Request<Record<string, never>, unknown, PaymentQuoteInput>,
  response: Response<ApiSuccessResponse<CreatePaymentQuoteResponse>>,
): void => {
  response.status(200).json({
    success: true,
    data: paymentsService.createQuote(request.body),
  });
};

export const getQuote = createPaymentQuote;
