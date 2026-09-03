import type { NextFunction, Request, RequestHandler, Response } from "express";

export const asyncHandler = <
  Params = Record<string, string>,
  ResponseBody = unknown,
  RequestBody = unknown,
  RequestQuery = Record<string, unknown>,
>(
  handler: (
    request: Request<Params, ResponseBody, RequestBody, RequestQuery>,
    response: Response<ResponseBody>,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler<Params, ResponseBody, RequestBody, RequestQuery> => {
  return ((request: Request, response: Response, next: NextFunction) => {
    void handler(
      request as Request<Params, ResponseBody, RequestBody, RequestQuery>,
      response as Response<ResponseBody>,
      next,
    ).catch(next);
  }) as RequestHandler<Params, ResponseBody, RequestBody, RequestQuery>;
};
