import { Router } from "express";

import { validateBody } from "@/common/http/validate.middleware";
import { createAgent, listAgents } from "@/modules/agents/agents.controller";
import { createAgentSchema } from "@/modules/agents/agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post("/", validateBody(createAgentSchema), createAgent);
