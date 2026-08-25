import { Router } from "express";

import { validateBody } from "../../common/http/validate.middleware";
import {
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  patchAgent,
} from "./agents.controller";
import { createAgentSchema, patchAgentSchema } from "./agents.schema";

export const agentsRouter = Router();

agentsRouter.get("/", listAgents);
agentsRouter.post("/", validateBody(createAgentSchema), createAgent);
agentsRouter.get("/:id", getAgent);
agentsRouter.patch("/:id", validateBody(patchAgentSchema), patchAgent);
agentsRouter.delete("/:id", deleteAgent);
