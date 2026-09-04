export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR"
  | (string & {});

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details: unknown;
  public readonly code: ErrorCode | undefined;

  constructor(
    statusCode: number,
    message: string,
    details?: unknown,
    code?: ErrorCode,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
  }
}
