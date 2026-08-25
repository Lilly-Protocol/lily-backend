import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(280),
  capabilities: z.array(z.string().min(2).max(50)).min(1).max(10),
});

export const patchAgentSchema = z.object({
  status: z.enum(["active", "paused"]).optional(),
}).refine((data) => data.status !== undefined, {
  message: "At least one field must be provided",
});

export type CreateAgentSchema = z.infer<typeof createAgentSchema>;
export type PatchAgentSchema = z.infer<typeof patchAgentSchema>;
