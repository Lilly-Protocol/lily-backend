import { Router } from "express";

import { agentsRouter } from "@/modules/agents/agents.routes";
import { healthRouter } from "@/modules/health/health.routes";
import { metricsRouter } from "@/modules/metrics/metrics.routes";
import { paymentsRouter } from "@/modules/payments/payments.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/metrics", metricsRouter);
apiRouter.use("/agents", agentsRouter);
apiRouter.use("/payments", paymentsRouter);
