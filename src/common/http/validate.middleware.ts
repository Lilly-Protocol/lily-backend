import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";

import { AppError } from "@/common/http/app-error";

export const validateBody = <TSchema extends ZodTypeAny>(
  schema: TSchema,
): RequestHandler => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(
        new AppError(
          400,
          "Request validation failed",
          result.error.flatten(),
          "VALIDATION_ERROR",
        ),
      );
      return;
    }

    request.body = result.data;
    next();
  };
};
