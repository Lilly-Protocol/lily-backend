import type { IncomingMessage } from "node:http";
import type { SerializedRequest } from "pino-std-serializers";

export const REDACTED = "[REDACTED]";

export const sensitiveQueryKeys = new Set([
  "access_token",
  "api_key",
  "apikey",
  "auth_token",
  "authorization",
  "client_secret",
  "cookie",
  "credential",
  "key",
  "password",
  "private_key",
  "refresh_token",
  "secret",
  "seed",
  "session",
  "signature",
  "sig",
  "token",
  "wallet_seed",
]);

export const normalizeQueryKey = (key: string): string =>
  key.toLowerCase().replace(/-/g, "_");

export const sanitizeRequestUrl = (requestUrl: string): string => {
  if (!requestUrl) {
    return "";
  }

  const [pathname = "", query = ""] = requestUrl.split("?", 2);

  if (!query) {
    return pathname;
  }

  const params = new URLSearchParams(query);
  const sanitizedParams = new URLSearchParams();

  for (const [key, value] of params) {
    sanitizedParams.append(
      key,
      sensitiveQueryKeys.has(normalizeQueryKey(key)) ? REDACTED : value,
    );
  }

  return `${pathname}?${sanitizedParams.toString()}`;
};

export interface LoggableRequest {
  id?: unknown;
  method?: string;
  url?: string;
  remoteAddress?: string;
  remotePort?: number;
  socket?: {
    remoteAddress?: string;
    remotePort?: number;
  };
}

export const serializeRequest = (
  request: LoggableRequest | IncomingMessage | SerializedRequest,
) => ({
  id: request.id,
  method: request.method,
  url: sanitizeRequestUrl(request.url ?? ""),
  remoteAddress:
    "socket" in request && request.socket?.remoteAddress
      ? request.socket.remoteAddress
      : (request as SerializedRequest).remoteAddress,
  remotePort:
    "socket" in request && request.socket?.remotePort
      ? request.socket.remotePort
      : (request as SerializedRequest).remotePort,
});
