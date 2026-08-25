import { z } from "zod";

export const capabilitySchema = z.enum([
  "wallet-provisioning",
  "usdc-payments",
  "settlement",
  "payments",
  "liquidity-management",
  "marketplace-purchases",
]);

export type Capability = z.infer<typeof capabilitySchema>;

export const createAgentSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(280),
  capabilities: z.array(capabilitySchema).min(1).max(10),
});

export type CreateAgentSchema = z.infer<typeof createAgentSchema>;
