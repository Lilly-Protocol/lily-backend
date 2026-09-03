import type { Request, Response } from "express";
import type { z } from "zod";

import { asyncHandler } from "../../common/http/async-handler";
import type { ApiSuccessResponse } from "../../common/types/api-response";
import type {
  createQuoteSchema,
  executePaymentSchema,
} from "./payments.schema";
import { paymentsService } from "./payments.service";

export const createQuote = asyncHandler(
  async (
    request: Request<
      Record<string, never>,
      ApiSuccessResponse<ReturnType<typeof paymentsService.createQuote>>,
      z.output<typeof createQuoteSchema>
    >,
    response: Response<
      ApiSuccessResponse<ReturnType<typeof paymentsService.createQuote>>
    >,
  ) => {
    const result = paymentsService.createQuote(request.body);

    response.status(201).json({ success: true, data: result });
  },
);

export const getQuote = asyncHandler(
  async (
    request: Request<
      { id: string },
      ApiSuccessResponse<ReturnType<typeof paymentsService.getQuoteById>>
    >,
    response: Response<
      ApiSuccessResponse<ReturnType<typeof paymentsService.getQuoteById>>
    >,
  ) => {
    const result = paymentsService.getQuoteById(request.params.id);

    response.status(200).json({ success: true, data: result });
  },
);

export const executePayment = asyncHandler(
  async (
    request: Request<
      Record<string, never>,
      ApiSuccessResponse<ReturnType<typeof paymentsService.executePayment>>,
      z.output<typeof executePaymentSchema>
    >,
    response: Response<
      ApiSuccessResponse<ReturnType<typeof paymentsService.executePayment>>
    >,
  ) => {
    const result = paymentsService.executePayment(request.body);

    response.status(200).json({ success: true, data: result });
  },
);
