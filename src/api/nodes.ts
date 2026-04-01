import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { nodeRegistry } from "../services/nodeRegistryService";
import { logger } from "../utils/logger";

interface RegisterPayload {
  name: string;
  hostname?: string;        // Optional: defaults to "localhost" for local testing
  tailscaleIp?: string;     // Optional: not required when testing locally
  capabilities: string[];
}

export async function nodesRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterPayload }>(
    "/nodes/register",
    async (request, reply) => {
      logger.info("POST /nodes/register", { body: request.body });
      const { name, hostname, tailscaleIp, capabilities } = request.body;

      if (!name || !Array.isArray(capabilities)) {
        logger.warn("Node registration rejected - missing required fields", { name, capabilities });
        return reply.status(400).send({
          error: "Invalid payload. Required: name (string), capabilities (array). hostname and tailscaleIp are optional.",
        });
      }

      const node = nodeRegistry.registerNode({
        name,
        hostname: hostname ?? "localhost",
        tailscaleIp: tailscaleIp ?? "127.0.0.1",
        capabilities,
      });
      logger.info("Worker node registered", { nodeId: node.id, name: node.name, capabilities: node.capabilities });
      return reply.send(node);
    }
  );

  app.post<{ Params: { id: string } }>(
    "/nodes/:id/heartbeat",
    async (request, reply) => {
      const { id } = request.params;
      logger.info("POST /nodes/:id/heartbeat", { nodeId: id });
      const success = nodeRegistry.heartbeat(id);

      if (!success) {
        logger.warn("Heartbeat for unknown/expired node", { nodeId: id });
        return reply.status(404).send({ error: "Node not found or expired. Please re-register." });
      }

      return reply.send({ ok: true });
    }
  );

  app.get("/nodes", async (request, reply) => {
    logger.info("GET /nodes");
    return reply.send(nodeRegistry.getNodes());
  });

  app.get("/nodes/status", async (request, reply) => {
    logger.info("GET /nodes/status");
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
