"use client";

import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

type Step = {
  id: string;
  stepOrder: number;
  stepType: string;
};

export function PipelineDag({ steps }: { steps: Step[] }) {
  if (!steps?.length) return <div className="text-sm text-slate-400">No steps</div>;

  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  const nodes = sorted.map((s, idx) => ({
    id: s.id,
    data: { label: `${idx + 1}. ${s.stepType}` },
    position: { x: idx * 200, y: 0 }
  }));

  const edges = sorted.slice(1).map((s, idx) => ({
    id: `${sorted[idx].id}-${s.id}`,
    source: sorted[idx].id,
    target: s.id
  }));

  return (
    <div className="h-64 border border-slate-800 rounded-md">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

