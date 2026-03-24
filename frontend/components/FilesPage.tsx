"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getArtifacts } from "../lib/api";

export function FilesPage() {
  const [runId, setRunId] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const artifactsQuery = useQuery({
    queryKey: ["artifacts", submittedId],
    queryFn: () => getArtifacts(submittedId as string),
    enabled: !!submittedId
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (runId) setSubmittedId(runId);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Artifacts</h2>
      <form onSubmit={onSubmit} className="flex gap-2 max-w-md">
        <input
          className="flex-1 text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1"
          placeholder="Run ID"
          value={runId}
          onChange={(e) => setRunId(e.target.value)}
        />
        <button className="px-3 py-1 rounded bg-sky-600 text-sm hover:bg-sky-500">
          Load
        </button>
      </form>

      {artifactsQuery.isLoading && (
        <div className="text-sm text-slate-400">Loading artifacts…</div>
      )}

      {artifactsQuery.data && (
        <div className="space-y-1 text-xs">
          {artifactsQuery.data.map((a) => (
            <div
              key={a.id}
              className="border border-slate-800 rounded px-2 py-1 bg-slate-900/40 flex justify-between items-center"
            >
              <div>
                <div className="font-mono">{a.type}</div>
                <div className="text-slate-400">{a.fileKey}</div>
              </div>
              <a
                href={a.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

