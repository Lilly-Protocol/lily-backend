import { Router } from "express";

import { getHealthStatus, getLiveness, getReadiness } from "./health.controller";

export const healthRouter = Router();

healthRouter.get("/", getHealthStatus);
healthRouter.get("/live", getLiveness);
healthRouter.get("/ready", getReadiness);
