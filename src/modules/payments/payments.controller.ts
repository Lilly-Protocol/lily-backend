import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/api-response";
import type { QuoteResponse } from "./payments.types";
import { paymentsService } from "./payments.service";

export const createQuote = (
  request: Request,
  response: Response<ApiSuccessResponse<QuoteResponse>>,
): void => {
  response.status(201).json({
    success: true,
    data: paymentsService.createQuote(request.body),
  });
};
