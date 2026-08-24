import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/api-response";
import { paymentsService } from "./payments.service";
import type { CreatePaymentQuoteResponse } from "./payments.types";

export const createPaymentQuote = (
  request: Request,
  response: Response<ApiSuccessResponse<CreatePaymentQuoteResponse>>,
): void => {
  response.status(200).json({
    success: true,
    data: paymentsService.createQuote(request.body),
  });
};
