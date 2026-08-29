import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { createPaymentQuote } from "./payments.controller";
import { quoteSchema } from "./payments.schema";

export const paymentsRouter = Router();

paymentsRouter.post("/quote", validateBody(quoteSchema), createPaymentQuote);
paymentsRouter.post("/", validateBody(quoteSchema), createPaymentQuote);
