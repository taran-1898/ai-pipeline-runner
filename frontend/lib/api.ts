import type { z } from "zod";
import { z as zod } from "zod";

const PipelineStepSchema = zod.object({
  id: zod.string(),
  stepOrder: zod.number(),
  stepType: zod.string(),
  promptTemplate: zod.string()
});

const PipelineSchema = zod.object({
  id: zod.string(),
  name: zod.string(),
  description: zod.string().nullable().optional(),
  steps: zod.array(PipelineStepSchema).optional()
});

const RunStepSchema = zod.object({
  id: zod.string(),
  status: zod.string(),
  step: PipelineStepSchema
});

const RunSchema = zod.object({
  id: zod.string(),
  status: zod.string(),
  pipelineId: zod.string(),
  steps: zod.array(RunStepSchema).optional()
});

const ArtifactSchema = zod.object({
  id: zod.string(),
  runId: zod.string(),
  type: zod.string(),
  fileKey: zod.string(),
  fileUrl: zod.string(),
  metadata: zod.unknown().nullable().optional()
});

const NodeSchema = zod.object({
  id: zod.string(),
  name: zod.string(),
  hostname: zod.string().optional(),
  tailscaleIp: zod.string().optional(),
  capabilities: zod.array(zod.string()),
  status: zod.string(),
  lastHeartbeat: zod.string().nullable().optional()
});

const VoiceResponseSchema = zod.object({
  transcript: zod.string(),
  pipelineGenerated: zod.boolean(),
  runId: zod.string().nullable().optional()
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: isFormData
      ? (init?.headers || {})
      : {
          "Content-Type": "application/json",
          ...(init?.headers || {})
        }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function getPipelines() {
  const data = await apiFetch<unknown>("/pipelines");
  return zod.array(PipelineSchema).parse(data);
}

export async function createPipeline(payload: {
  name: string;
  description?: string;
  steps: {
    stepType: string;
    task: string;
    promptTemplate: string;
  }[];
}) {
  const data = await apiFetch<unknown>("/pipelines", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return PipelineSchema.parse(data);
}

export async function runPipeline(pipelineId: string, input: unknown) {
  const data = await apiFetch<unknown>(`/pipelines/${pipelineId}/run`, {
    method: "POST",
    body: JSON.stringify({ input })
  });
  return RunSchema.parse(data);
}

export async function getRun(id: string) {
  const data = await apiFetch<unknown>(`/runs/${id}`);
  return RunSchema.parse(data);
}

export async function getArtifacts(runId: string) {
  const data = await apiFetch<unknown>(`/runs/${runId}/artifacts`);
  return zod.array(ArtifactSchema).parse(data);
}

export async function getNodes() {
  const data = await apiFetch<unknown>("/nodes");
  return zod.array(NodeSchema).parse(data);
}

export async function registerNode(payload: {
  name: string;
  hostname?: string;
  tailscaleIp?: string;
  capabilities: string[];
}) {
  const data = await apiFetch<unknown>("/nodes/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return NodeSchema.parse(data);
}

export async function sendVoice(formData: FormData) {
  const data = await apiFetch<unknown>("/voice", {
    method: "POST",
    body: formData
  });
  return VoiceResponseSchema.parse(data);
}

export async function sendInteraction(text: string, sessionId?: string) {
  return apiFetch<{ enqueued: boolean }>("/interactions", {
    method: "POST",
    body: JSON.stringify({ text, sessionId })
  });
}
