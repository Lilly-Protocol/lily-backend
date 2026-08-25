import { Router } from "express";

import { idempotencyMiddleware } from "../../common/http/idempotency.middleware";
import { validateBody } from "../../common/http/validate.middleware";
import { createAgent, listAgents } from "./agents.controller";
import { createAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post(
  "/",
  idempotencyMiddleware,
  validateBody(createAgentSchema),
  createAgent,
);
