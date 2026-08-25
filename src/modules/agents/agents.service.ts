import type {
  Agent,
  AgentStatus,
  CreateAgentInput,
  CreateAgentResponse,
  ListAgentsResponse,
} from "./agents.types";

const seedAgents = (): Agent[] => [
  {
    id: "agentlily_demo_001",
    name: "Treasury Settlement Agent",
    description:
      "Demonstration AgentLily responsible for mock treasury settlement workflows.",
    walletAddress: "GBLILYDEMOSETTLEMENTWALLET000000000000000000001",
    status: "active",
    capabilities: ["wallet-provisioning", "usdc-payments", "settlement"],
    createdAt: new Date("2026-05-16T00:00:00.000Z").toISOString(),
  },
];

const agentsStore: Agent[] = seedAgents();

const createWalletAddress = (seed: string): string => {
  const normalizedSeed = seed.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `G${normalizedSeed.padEnd(55, "0").slice(0, 55)}`;
};

export const agentsService = {
  listAgents(): ListAgentsResponse {
    return {
      agents: agentsStore,
      total: agentsStore.length,
    };
  },

  createAgent(input: CreateAgentInput): CreateAgentResponse {
    const agent: Agent = {
      id: `agentlily_${agentsStore.length + 1}`,
      name: input.name,
      description: input.description,
      walletAddress: createWalletAddress(input.name),
      status: "active",
      capabilities: input.capabilities,
      createdAt: new Date().toISOString(),
    };

    agentsStore.push(agent);

    return { agent };
  },

  getAgentById(id: string): Agent | null {
    return agentsStore.find((a) => a.id === id) ?? null;
  },

  updateAgent(
    id: string,
    input: { status?: AgentStatus },
  ): Agent | null {
    const agent = agentsStore.find((a) => a.id === id);
    if (!agent) return null;
    if (input.status) agent.status = input.status;
    return agent;
  },

  deleteAgent(id: string): boolean {
    const idx = agentsStore.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    agentsStore.splice(idx, 1);
    return true;
  },

  reset(): void {
    agentsStore.splice(0, agentsStore.length, ...seedAgents());
  },
};
