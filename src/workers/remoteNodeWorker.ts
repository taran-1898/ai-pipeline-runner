import { Worker, Job } from "bullmq";
import { connection } from "../config/queue";
import { config } from "../config/env";
import * as os from "os";

interface NodeRegistration {
  name: string;
  hostname: string;
  tailscaleIp: string;
  capabilities: string[];
}

const SERVER_URL = `http://127.0.0.1:${config.port}`; // Adjust to actual central server IP over tailscale if needed
const NODE_CAPABILITIES = process.env.NODE_CAPABILITIES?.split(",") || ["gpu", "video_render"];
const NODE_NAME = process.env.NODE_NAME || `worker-${os.hostname()}`;

async function registerNode(): Promise<string> {
  const payload: NodeRegistration = {
    name: NODE_NAME,
    hostname: os.hostname(),
    tailscaleIp: "100.x.y.z", // Mock tailscale IP or get dynamically
    capabilities: NODE_CAPABILITIES,
  };

  const response = await fetch(`${SERVER_URL}/nodes/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to register node: ${await response.text()}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

async function startHeartbeat(nodeId: string) {
  setInterval(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/nodes/${nodeId}/heartbeat`, {
        method: "POST",
      });
      if (!response.ok) {
        console.error("Heartbeat failed, node might be evicted. Re-registering...");
      }
    } catch (err) {
      console.error("Heartbeat request failed", err);
    }
  }, 30000);
}

async function startWorker() {
  console.log(`Starting remote node: ${NODE_NAME} with capabilities: ${NODE_CAPABILITIES.join(", ")}`);
  
  try {
    const nodeId = await registerNode();
    console.log(`Registered with central server. Node ID: ${nodeId}`);
    
    startHeartbeat(nodeId);

    const queueName = `pipeline:node:${nodeId}`;
    console.log(`Subscribing to queue: ${queueName}`);

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        console.log(`Received job ${job.id} for step: ${job.data.stepId}`);
        // Simulate processing the required capability
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        return {
          response: `Simulated remote execution on ${NODE_NAME} for step ${job.data.stepId}`,
          artifactType: "text",
        };
      },
      { connection }
    );

    worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
      console.error(`Job ${job?.id} failed with error:`, err);
    });

  } catch (err) {
    console.error("Failed to start remote worker", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startWorker();
}
