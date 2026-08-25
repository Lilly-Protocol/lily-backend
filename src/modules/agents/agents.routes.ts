import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { idempotencyKeyMiddleware } from "../../common/http/idempotency.middleware";
import { createAgent, listAgents } from "./agents.controller";
import { createAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post("/", idempotencyKeyMiddleware, validateBody(createAgentSchema), createAgent);
