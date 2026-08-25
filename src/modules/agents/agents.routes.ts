import { Router } from "express";
import { methodNotAllowedHandler } from "../../common/http/method-not-allowed.middleware";

import { validateBody } from "../../common/http/validate.middleware";
import { createAgent, listAgents } from "./agents.controller";
import { createAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post("/", validateBody(createAgentSchema), createAgent);
agentsRouter.all("/", methodNotAllowedHandler);
