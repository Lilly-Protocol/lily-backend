import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { createPaymentQuote } from "./payments.controller";
import { createPaymentQuoteSchema } from "./payments.schema";

export const paymentsRouter = Router();

paymentsRouter.post(
  "/quote",
  validateBody(createPaymentQuoteSchema),
  createPaymentQuote,
);
