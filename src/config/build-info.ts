import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { env } from "./env";

// Both source and compiled config directories are two levels below project root, avoiding launch directory dependencies.
const { version } = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf8"),
) as { version: string };

export const buildInfo = {
  version,
  ...(env.BUILD_COMMIT ? { commit: env.BUILD_COMMIT } : {}),
};
