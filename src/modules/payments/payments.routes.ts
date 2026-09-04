import { Router } from "express";

import { validateBody, validateParams } from "../../common/http/validate.middleware";
import { createQuote, executePayment, getQuote } from "./payments.controller";
import { createQuoteSchema, executePaymentSchema } from "./payments.schema";
import { quoteIdParamsSchema } from "../agents/agents.schema";

export const paymentsRouter = Router();

paymentsRouter.post("/", validateBody(createQuoteSchema), createQuote);
paymentsRouter.get("/quotes/:id", validateParams(quoteIdParamsSchema), getQuote);
paymentsRouter.post("/execute", validateBody(executePaymentSchema), executePayment);
