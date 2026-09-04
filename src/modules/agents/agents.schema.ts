import { z } from "zod";

export const capabilityEnum = z.enum([
  "wallet-provisioning",
  "usdc-payments",
  "settlement",
  "payments",
  "marketplace-purchases",
  "rebalance",
  "liquidity-monitoring",
  "wallet",
  "monitoring",
  "test",
  "testing",
]);

export type Capability = z.infer<typeof capabilityEnum>;

const capabilityValue = z.string().trim().toLowerCase().pipe(capabilityEnum);

export const createAgentSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().min(10).max(280),
    capabilities: z
      .array(capabilityValue)
      .min(1)
      .max(10)
      .transform((caps) => [...new Set(caps)]),
  })
  .strict();

export const patchAgentSchema = z
  .object({
    status: z.enum(["active", "paused"]).optional(),
  })
  .refine((data) => data.status !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateAgentSchema = z.output<typeof createAgentSchema>;

export const agentStatusSchema = z.object({
  status: z.enum(["active", "paused"]),
});

export type AgentStatusSchema = z.output<typeof agentStatusSchema>;

/**
 * Path parameter schema for agent id.
 * Agents are provisioned with an "agentlily_" prefix followed by alphanumeric/underscore chars.
 */
export const agentIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^agentlily_[A-Za-z0-9_]+$/, {
      message: 'Agent id must start with "agentlily_" followed by alphanumeric or underscore characters',
    }),
});

/**
 * Path parameter schema for quote id.
 * Quotes are generated with a "quote_" prefix.
 */
export const quoteIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^quote_[A-Za-z0-9_]+$/, {
      message: 'Quote id must start with "quote_" followed by alphanumeric or underscore characters',
    }),
});
