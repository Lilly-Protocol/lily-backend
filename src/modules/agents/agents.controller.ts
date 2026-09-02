import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/api-response";
import type { CreateAgentResponse, ListAgentsResponse, UpdateAgentStatusResponse } from "./agents.types";
import { agentsService } from "./agents.service";

export const listAgents = (
  _request: Request,
  response: Response<ApiSuccessResponse<ListAgentsResponse>>,
): void => {
  response.status(200).json({
    success: true,
    data: agentsService.listAgents(),
  });
};

export const createAgent = (
  request: Request<Record<string, never>, unknown, CreateAgentInput>,
  response: Response<ApiSuccessResponse<CreateAgentResponse>>,
): void => {
  const agent = agentsService.createAgent(request.body);

  response.status(201).json({
    success: true,
    data: {
      agent,
    },
  });
};

export const updateAgentStatus = (
  request: Request<{ id: string }>,
  response: Response<ApiSuccessResponse<UpdateAgentStatusResponse>>,
): void => {
  const { id } = request.params;
  const { status } = request.body;

  const result = agentsService.updateAgentStatus(id, status);

  response.status(200).json({
    success: true,
    data: result,
  });
};
