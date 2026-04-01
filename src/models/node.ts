export interface WorkerNode {
  id: string;
  name: string;
  hostname: string;
  tailscaleIp: string;
  capabilities: string[];
  status: "ONLINE" | "OFFLINE";
  lastHeartbeat: Date;
  createdAt: Date;
}
