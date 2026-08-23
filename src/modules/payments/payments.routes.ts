import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { createPaymentQuote } from "./payments.controller";
import { createQuoteSchema } from "./payments.schema";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/quote",
  validateBody(createQuoteSchema),
  createPaymentQuote,
);
