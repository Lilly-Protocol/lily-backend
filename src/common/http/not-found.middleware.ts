import type { NextFunction, Request, Response } from "express";

import { AppError } from "@/common/http/app-error";

export const notFoundHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  next(new AppError(404, `Route not found: ${request.method} ${request.originalUrl}`));
};
