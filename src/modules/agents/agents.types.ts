import type { Capability } from "./agents.schema";

export type AgentStatus = "active" | "paused";

export interface Agent {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  status: AgentStatus;
  capabilities: Capability[];
  createdAt: string;
}

export interface CreateAgentInput {
  name: string;
  description: string;
  capabilities: Capability[];
}

export interface ListAgentsResponse {
  agents: Agent[];
  total: number;
}

export interface CreateAgentResponse {
  agent: Agent;
}
