import { Router } from "express";
import { methodNotAllowedHandler } from "../../common/http/method-not-allowed.middleware";

import { getHealthStatus } from "./health.controller";

export const healthRouter = Router();

healthRouter.get("/", getHealthStatus);
healthRouter.all("/", methodNotAllowedHandler);
