import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import { createAgent, deleteAgent, listAgents, updateAgent } from "./agents.controller";
import { createAgentSchema, updateAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post("/", validateBody(createAgentSchema), createAgent);
agentsRouter.patch("/:id", validateBody(updateAgentSchema), updateAgent);
agentsRouter.delete("/:id", deleteAgent);
