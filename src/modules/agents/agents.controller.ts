import type { Request, Response } from "express";

import type { ApiSuccessResponse } from "../../common/types/api-response";
import { AppError } from "../../common/http/app-error";
import { agentsService } from "./agents.service";
import type { CreateAgentSchema } from "./agents.schema";

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
  request: Request<object, unknown, CreateAgentSchema>,
  response: Response<ApiSuccessResponse<ReturnType<typeof agentsService.createAgent>>>,
): void => {
  const agent = agentsService.createAgent(request.body);
  response.status(201).json({
    success: true,
    data: agent,
  });
};

export const deleteAgent = (
  request: Request<{ id: string }>,
  response: Response,
): void => {
  const deleted = agentsService.deleteAgent(request.params.id);
  if (!deleted) {
    throw new AppError(404, `Agent not found: ${request.params.id}`);
  }
  response.status(204).send();
};
