import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { writeRateLimiter } from "../../config/rate-limit";
import { createAgent, listAgents } from "./agents.controller";
import { createAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post("/", writeRateLimiter, validateBody(createAgentSchema), createAgent);
