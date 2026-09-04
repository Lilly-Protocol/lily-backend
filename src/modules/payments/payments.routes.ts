import { Router } from "express";

import { apiKeyAuth } from "../../common/http/api-key-auth.middleware";
import { validateBody } from "../../common/http/validate.middleware";
import { createQuote, executePayment, getQuote } from "./payments.controller";
import { createQuoteSchema, executePaymentSchema } from "./payments.schema";

export const paymentsRouter = Router();

// Quote lookup is a read and stays public; the write endpoints require an
// API key (see issue #263). The middleware is a no-op while AUTH_API_KEY
// is unset.
paymentsRouter.post(
  "/",
  apiKeyAuth,
  validateBody(createQuoteSchema),
  createQuote,
);
paymentsRouter.get("/quotes/:id", getQuote);
paymentsRouter.post(
  "/execute",
  apiKeyAuth,
  validateBody(executePaymentSchema),
  executePayment,
);
