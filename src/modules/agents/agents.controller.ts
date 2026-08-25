import type { Request, Response } from "express";

import type { ApiSuccessResponse, ApiMessageResponse } from "../../common/types/api-response";
import type {
  CreateAgentResponse,
  ListAgentsResponse,
} from "./agents.types";
import type { Agent } from "./agents.types";
import { agentsService } from "./agents.service";
import { AppError } from "../../common/http/app-error";

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
  request: Request,
  response: Response<ApiSuccessResponse<CreateAgentResponse>>,
): void => {
  response.status(201).json({
    success: true,
    data: agentsService.createAgent(request.body),
  });
};

export const getAgent = (
  request: Request,
  response: Response<ApiSuccessResponse<{ agent: Agent }>>,
): void => {
  const { id } = request.params;
  const agent = agentsService.getAgentById(id);
  if (!agent) {
    throw new AppError(404, `Agent not found: ${id}`);
  }
  response.status(200).json({
    success: true,
    data: { agent },
  });
};

export const patchAgent = (
  request: Request,
  response: Response<ApiSuccessResponse<{ agent: Agent }>>,
): void => {
  const { id } = request.params;
  const agent = agentsService.updateAgent(id, request.body);
  if (!agent) {
    throw new AppError(404, `Agent not found: ${id}`);
  }
  response.status(200).json({
    success: true,
    data: { agent },
  });
};

export const deleteAgent = (
  request: Request,
  response: Response<ApiMessageResponse>,
): void => {
  const { id } = request.params;
  const deleted = agentsService.deleteAgent(id);
  if (!deleted) {
    throw new AppError(404, `Agent not found: ${id}`);
  }
  response.status(200).json({
    success: true,
    message: `Agent ${id} deleted successfully`,
  });
};
