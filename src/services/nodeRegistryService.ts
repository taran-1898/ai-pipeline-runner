import { WorkerNode } from "../models/node";
import { randomUUID } from "crypto";

export class NodeRegistryService {
  private nodes: Map<string, WorkerNode> = new Map();
  private readonly HEARTBEAT_TIMEOUT_MS = 60 * 1000; // 60 seconds

  constructor() {
    // Start an eviction interval to clean up stale nodes
    setInterval(() => this.evictStaleNodes(), 10 * 1000); // Check every 10 seconds
  }

  registerNode(payload: {
    name: string;
    hostname: string;
    tailscaleIp: string;
    capabilities: string[];
  }): WorkerNode {
    const id = randomUUID();
    const now = new Date();
    
    // Create new node instance
    const node: WorkerNode = {
      id,
      name: payload.name,
      hostname: payload.hostname,
      tailscaleIp: payload.tailscaleIp,
      capabilities: payload.capabilities,
      status: "ONLINE",
      lastHeartbeat: now,
      createdAt: now,
    };

    this.nodes.set(id, node);
    return node;
  }

  heartbeat(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) {
      return false; // Not found
    }

    node.lastHeartbeat = new Date();
    node.status = "ONLINE"; // Ensure status is set to online if it was marked offline (though we might just evict offline nodes)
    return true;
  }

  getNodes(): WorkerNode[] {
    return Array.from(this.nodes.values());
  }
  
  getNode(id: string): WorkerNode | undefined {
    return this.nodes.get(id);
  }

  getCapableNode(capability: string): WorkerNode | undefined {
    const availableNodes = this.getNodes().filter(
      (n) => n.status === "ONLINE" && n.capabilities.includes(capability)
    );

    if (availableNodes.length === 0) {
      return undefined;
    }

    // Naive round robin or random selection
    return availableNodes[Math.floor(Math.random() * availableNodes.length)];
  }

  private evictStaleNodes() {
    const now = new Date().getTime();
    for (const [id, node] of this.nodes.entries()) {
      if (now - node.lastHeartbeat.getTime() > this.HEARTBEAT_TIMEOUT_MS) {
        node.status = "OFFLINE";
        // Optionally remove entirely:
        // this.nodes.delete(id);
      }
    }
  }
}

export const nodeRegistry = new NodeRegistryService();
