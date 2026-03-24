import { z } from "zod";

const PipelineStepSchema = z.object({
  id: z.string(),
  stepOrder: z.number(),
  stepType: z.string(),
  promptTemplate: z.string()
});

const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  steps: z.array(PipelineStepSchema).optional()
});

const RunStepSchema = z.object({
  id: z.string(),
  status: z.string(),
  step: PipelineStepSchema
});

const RunSchema = z.object({
  id: z.string(),
  status: z.string(),
  pipelineId: z.string(),
  steps: z.array(RunStepSchema).optional()
});

const ArtifactSchema = z.object({
  id: z.string(),
  runId: z.string(),
  type: z.string(),
  fileKey: z.string(),
  fileUrl: z.string(),
  metadata: z.unknown().nullable().optional()
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
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
  return z.array(PipelineSchema).parse(data);
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
  return z.array(ArtifactSchema).parse(data);
}

