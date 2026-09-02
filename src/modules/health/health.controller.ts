import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "@/common/types/api-response";
import { healthService } from "@/modules/health/health.service";

export const getHealthStatus = (
  _request: Request,
  response: Response<ApiSuccessResponse<ReturnType<typeof healthService.getStatus>>>,
): void => {
  response.status(200).json({
    success: true,
    data: healthService.getStatus(),
  });
};
