import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { nodeRegistry } from "../services/nodeRegistryService";
import { logger } from "../utils/logger";

interface RegisterPayload {
  name: string;
  hostname: string;
  tailscaleIp: string;
  capabilities: string[];
}

export async function nodesRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterPayload }>(
    "/nodes/register",
    async (request, reply) => {
      const { name, hostname, tailscaleIp, capabilities } = request.body;
      
      if (!name || !hostname || !tailscaleIp || !Array.isArray(capabilities)) {
        return reply.status(400).send({
          error: "Invalid payload. Required: name, hostname, tailscaleIp, capabilities array",
        });
      }

      const node = nodeRegistry.registerNode({ name, hostname, tailscaleIp, capabilities });
      logger.info("Worker node registered", { nodeId: node.id, name: node.name, capabilities: node.capabilities });

      return reply.send(node);
    }
  );

  app.post<{ Params: { id: string } }>(
    "/nodes/:id/heartbeat",
    async (request, reply) => {
      const { id } = request.params;
      const success = nodeRegistry.heartbeat(id);

      if (!success) {
        return reply.status(404).send({ error: "Node not found or expired. Please re-register." });
      }

      return reply.send({ ok: true });
    }
  );

  app.get("/nodes", async (request, reply) => {
    return reply.send(nodeRegistry.getNodes());
  });

  app.get("/nodes/status", async (request, reply) => {
    const nodes = nodeRegistry.getNodes();
    const onlineCount = nodes.filter((n) => n.status === "ONLINE").length;
    const offlineCount = nodes.filter((n) => n.status === "OFFLINE").length;
    
    return reply.send({
      total: nodes.length,
      online: onlineCount,
      offline: offlineCount,
      nodes,
    });
  });
}
