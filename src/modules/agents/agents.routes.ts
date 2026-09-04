import { Router } from "express";

import { apiKeyAuth } from "../../common/http/api-key-auth.middleware";
import { idempotencyKeyMiddleware } from "../../common/http/idempotency.middleware";
import { validateBody } from "../../common/http/validate.middleware";
import {
  createAgent,
  deleteAgent,
  getAgentById,
  listAgents,
  updateAgentStatus,
} from "./agents.controller";
import { agentStatusSchema, createAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

// Reads stay public; only state-changing routes require an API key
// (see issue #263). The middleware is a no-op while AUTH_API_KEY is unset.
agentsRouter.get("/", listAgents);
agentsRouter.get("/:id", getAgentById);
agentsRouter.post(
  "/",
  apiKeyAuth,
  idempotencyKeyMiddleware,
  validateBody(createAgentSchema),
  createAgent,
);
agentsRouter.patch(
  "/:id",
  apiKeyAuth,
  validateBody(agentStatusSchema),
  updateAgentStatus,
);
agentsRouter.delete("/:id", apiKeyAuth, deleteAgent);
