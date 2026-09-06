import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodError, ZodTypeAny } from "zod";

import { AppError } from "@/common/http/app-error";

interface ValidationErrorDetails {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
}

const flattenValidationError = (error: ZodError) => {
  const flattened = error.flatten() as ValidationErrorDetails;

  // Zod reports unrecognized keys with an empty path, which `.flatten()`
  // puts into `formErrors`. Surface them as per-field errors so clients can
  // see exactly which payload keys were rejected.
  for (const issue of error.issues) {
    if (issue.code !== "unrecognized_keys") {
      continue;
    }

    for (const key of issue.keys) {
      flattened.fieldErrors[key] = [
        ...(flattened.fieldErrors[key] ?? []),
        `Unrecognized key: "${key}"`,
      ];
    }
  }

  return flattened;
};

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
          flattenValidationError(result.error),
          "VALIDATION_ERROR",
        ),
      );
      return;
    }

    request.body = result.data;
    next();
  };
};

export const validateParams = <TSchema extends ZodTypeAny>(
  schema: TSchema,
): RequestHandler => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.params);

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

    // params is writable in Express 5
    Object.assign(request.params, result.data);
    next();
  };
};

export const validateQuery = <TSchema extends ZodTypeAny>(
  schema: TSchema,
): RequestHandler => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.query);

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

    // req.query is read-only in Express 5; attach parsed data to validatedQuery
    (request as Request & { validatedQuery?: unknown }).validatedQuery =
      result.data;
    next();
  };
};
