import { Router } from "express";

import { apiKeyAuth } from "../../common/http/api-key-auth.middleware";
import { idempotencyKeyMiddleware } from "../../common/http/idempotency.middleware";
import { validateBody, validateParams } from "../../common/http/validate.middleware";
import {
  createAgent,
  deleteAgent,
  getAgentById,
  listAgents,
  updateAgentStatus,
} from "./agents.controller";
import { agentIdParamsSchema, agentStatusSchema, createAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.use(apiKeyAuth);

agentsRouter.get("/", listAgents);
agentsRouter.get("/:id", validateParams(agentIdParamsSchema), getAgentById);
agentsRouter.post(
  "/",
  idempotencyKeyMiddleware,
  validateBody(createAgentSchema),
  createAgent,
);
agentsRouter.patch("/:id", validateParams(agentIdParamsSchema), validateBody(agentStatusSchema), updateAgentStatus);
agentsRouter.delete("/:id", validateParams(agentIdParamsSchema), deleteAgent);
