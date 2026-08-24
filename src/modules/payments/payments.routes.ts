import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { createQuote } from "./payments.controller";
import { paymentQuoteSchema } from "./payments.schema";

export const paymentsRouter = Router();

paymentsRouter.post("/quote", validateBody(paymentQuoteSchema), createQuote);
