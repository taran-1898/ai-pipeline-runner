"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getPipelines, createPipeline, runPipeline } from "../lib/api";
import { PipelineDag } from "./PipelineDag";

export function PipelinePage() {
  const qc = useQueryClient();
  const { data: pipelines, isLoading } = useQuery({
    queryKey: ["pipelines"],
    queryFn: getPipelines
  });

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [runInput, setRunInput] = useState("");

  const createMut = useMutation({
    mutationFn: () =>
      createPipeline({
        name: newName || "New pipeline",
        description: newDescription || undefined,
        steps: [
          {
            stepType: "generic",
            task: "Generic step",
            promptTemplate: "Input: {{input}}\n\nOutput:"
          }
        ]
      }),
    onSuccess: () => {
      setNewName("");
      setNewDescription("");
      qc.invalidateQueries({ queryKey: ["pipelines"] });
    }
  });

  const runMut = useMutation({
    mutationFn: (pipelineId: string) =>
      runPipeline(pipelineId, runInput ? JSON.parse(runInput) : {}),
    onSuccess: () => {
      setRunInput("");
    }
  });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-3">Pipelines</h2>
        {isLoading ? (
          <div className="text-sm text-slate-400">Loading pipelines…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pipelines?.map((p) => (
              <div
                key={p.id}
                className="border border-slate-800 rounded-md p-4 space-y-2 bg-slate-900/40"
              >
                <div className="font-medium">{p.name}</div>
                {p.description && (
                  <div className="text-xs text-slate-400">{p.description}</div>
                )}
                <PipelineDag
                  steps={(p.steps ?? []).map((s) => ({
                    id: s.id,
                    stepOrder: s.stepOrder,
                    stepType: s.stepType
                  }))}
                />
                <div className="space-y-2 pt-2">
                  <textarea
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded p-2"
                    rows={3}
                    placeholder='Run input JSON, e.g. {"task":"build feature"}'
                    value={runInput}
                    onChange={(e) => setRunInput(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 rounded bg-emerald-600 text-xs hover:bg-emerald-500 disabled:opacity-50"
                    disabled={runMut.isPending}
                    onClick={() => runMut.mutate(p.id)}
                  >
                    Run pipeline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-800 pt-4">
        <h3 className="text-lg font-semibold mb-2">Create pipeline</h3>
        <div className="space-y-2 max-w-md">
          <input
            className="w-full text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <textarea
            className="w-full text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1"
            rows={3}
            placeholder="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <button
            className="px-3 py-1 rounded bg-sky-600 text-sm hover:bg-sky-500 disabled:opacity-50"
            disabled={createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            Create pipeline
          </button>
        </div>
      </section>
    </div>
  );
}

