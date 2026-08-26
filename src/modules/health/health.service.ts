import { env } from "../../config/env";
import { getServiceInfo } from "../../config/service-info";

export const healthService = {
  getStatus: () => ({
    status: "ok",
    service: env.APP_NAME,
    environment: env.NODE_ENV,
    ...getServiceInfo(),
    timestamp: new Date().toISOString(),
  }),
};
