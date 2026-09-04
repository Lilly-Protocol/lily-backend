import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { env } from "./env";

// Resolve package.json from both source and compiled output locations.
// The file sits two levels above this module, so the path is independent
// of the current working directory at runtime.
const { version } = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
) as { version: string };

export const buildInfo = {
  version,
  ...(env.BUILD_COMMIT ? { commit: env.BUILD_COMMIT } : {}),
};
