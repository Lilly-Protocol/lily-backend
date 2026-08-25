import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { createAgent, deleteAgent, listAgents } from "./agents.controller";
import { createAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post("/", validateBody(createAgentSchema), createAgent);
agentsRouter.delete("/:id", deleteAgent);
