import type { AddressInfo } from "node:net";
import { createServer } from "node:http";
import { spawn } from "node:child_process";

import { describe, it, expect } from "vitest";

function reservePort(): Promise<{ port: number; release: () => void }> {
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve({
        port: address.port,
        release: () => server.close(),
      });
    });
    server.on("error", reject);
  });
}

describe("server startup", () => {
  it(
    "logs a fatal EADDRINUSE error and exits non-zero when the port is already in use",
    {
      timeout: 15_000,
    },
    async () => {
      const { port, release } = await reservePort();

      try {
        const result = await new Promise<{
          code: number | null;
          stdout: string;
          stderr: string;
        }>((resolve) => {
          const child = spawn(
            process.execPath,
            ["--import", "tsx", "src/server.ts"],
            {
              cwd: process.cwd(),
              env: {
                ...process.env,
                NODE_ENV: "test",
                PORT: String(port),
                HOST: "127.0.0.1",
              },
            },
          );

          let stdout = "";
          let stderr = "";
          child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
          });
          child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
          });
          child.on("close", (code) => {
            resolve({ code, stdout, stderr });
          });
        });

        const combined = result.stdout + result.stderr;

        expect(result.code).not.toBe(0);
        expect(combined).toContain("EADDRINUSE");
        expect(combined).toContain(String(port));
        expect(combined).toContain("127.0.0.1");
      } finally {
        release();
      }
    },
  );
});
