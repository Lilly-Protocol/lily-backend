import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/api-response";
import type { CreatePaymentQuoteResponse } from "./payments.types";
import { paymentsService } from "./payments.service";

export const createPaymentQuote = (
  request: Request,
  response: Response<ApiSuccessResponse<CreatePaymentQuoteResponse>>,
): void => {
  response.status(200).json({
    success: true,
    data: paymentsService.createQuote(request.body),
  });
};
