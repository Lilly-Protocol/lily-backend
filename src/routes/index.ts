import { Router } from "express";

import { apiKeyAuth } from "../common/http/api-key-auth.middleware";
import { agentsRouter } from "../modules/agents/agents.routes";
import { healthRouter } from "../modules/health/health.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/agents", apiKeyAuth, agentsRouter);
