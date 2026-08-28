import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "@/common/types/api-response";
import { agentsService } from "@/modules/agents/agents.service";
import type { CreateAgentInput } from "@/modules/agents/agents.types";

export const listAgents = (
  _request: Request,
  response: Response<ApiSuccessResponse<ReturnType<typeof agentsService.listAgents>>>,
): void => {
  response.status(200).json({
    success: true,
    data: agentsService.listAgents(),
  });
};

export const createAgent = (
  request: Request<Record<string, never>, unknown, CreateAgentInput>,
  response: Response<ApiSuccessResponse<ReturnType<typeof agentsService.createAgent>>>,
): void => {
  const agent = agentsService.createAgent(request.body);

  response.status(201).json({
    success: true,
    data: {
      agent,
    },
  });
};
