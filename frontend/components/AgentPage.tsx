"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AudioUpload } from "./AudioUpload";
import { getNodes, registerNode, sendInteraction } from "../lib/api";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export function AgentPage() {
  const qc = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState<string>(() => `session-${Date.now()}`);
  const [loading, setLoading] = useState(false);

  // Node registration form state
  const [nodeName, setNodeName] = useState("");
  const [nodeCaps, setNodeCaps] = useState("");

  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: ["nodes"],
    queryFn: getNodes,
    refetchInterval: 10_000
  });

  const registerMut = useMutation({
    mutationFn: () =>
      registerNode({
        name: nodeName,
        capabilities: nodeCaps
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      }),
    onSuccess: (node) => {
      setNodeName("");
      setNodeCaps("");
      qc.invalidateQueries({ queryKey: ["nodes"] });
      addMessage("assistant", `✓ Node "${node.name}" registered (ID: ${node.id})`);
    },
    onError: (err: any) => {
      addMessage("assistant", `❌ Node registration failed: ${err.message}`);
    }
  });

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), role, content }]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    addMessage("user", text);
    setInput("");
    setLoading(true);

    try {
      await sendInteraction(text, sessionId);
      addMessage(
        "assistant",
        "Request enqueued ✓ — the orchestration worker will process it."
      );
    } catch (err: any) {
      addMessage("assistant", `❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Chat Section ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-1">Agent</h2>
        <div className="mb-3 text-xs text-slate-400">
          Chat with the orchestration layer. Messages are enqueued and processed
          asynchronously by the worker.
        </div>
        <div className="flex flex-col h-full max-h-[60vh]">
          <div className="flex-1 border border-slate-800 rounded-md p-3 mb-3 overflow-y-auto space-y-2 bg-slate-900/40">
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-semibold mr-1">
                  {m.role === "user" ? "You" : "Agent"}:
                </span>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-sm text-slate-500">
                Start a conversation by sending a prompt or using voice.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <textarea
              className="w-full text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1 resize-none"
              rows={3}
              placeholder="Ask the agent to plan or run work… (Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <button
                className="px-3 py-1 rounded bg-sky-600 text-sm hover:bg-sky-500 disabled:opacity-50"
                disabled={loading}
                onClick={sendMessage}
              >
                {loading ? "Sending…" : "Send"}
              </button>

              {/* Voice upload — now properly posts to /voice */}
              <AudioUpload
                onResult={(r) =>
                  addMessage(
                    "assistant",
                    r.pipelineGenerated
                      ? `🎙 Voice pipeline started! Run ID: ${r.runId}`
                      : `🎙 Transcript: ${r.transcript}`
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Nodes Section ─────────────────────────────────────────────── */}
      <section className="border-t border-slate-800 pt-5">
        <h3 className="text-lg font-semibold mb-3">Worker Nodes</h3>

        {/* Live node list */}
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">
            Live fleet{" "}
            <span className="ml-1">
              ({(nodes ?? []).filter((n) => n.status === "ONLINE").length} online)
            </span>
          </div>
          {nodesLoading && (
            <div className="text-xs text-slate-400">Loading nodes…</div>
          )}
          {nodes?.length === 0 && (
            <div className="text-xs text-slate-400">No nodes registered.</div>
          )}
          <div className="space-y-1">
            {nodes?.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 border border-slate-800 rounded px-3 py-2 bg-slate-900/40 text-sm"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    n.status === "ONLINE" ? "bg-emerald-400" : "bg-slate-600"
                  }`}
                />
                <span className="font-medium flex-1">{n.name}</span>
                <span className="text-xs text-slate-400">
                  {n.capabilities.join(", ")}
                </span>
                <span
                  className={`text-xs font-medium ${
                    n.status === "ONLINE" ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {n.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Register node form */}
        <div className="space-y-2 max-w-md">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Register a local node
          </div>
          <input
            className="w-full text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1"
            placeholder="Node name"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
          />
          <input
            className="w-full text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1"
            placeholder="Capabilities (comma-separated) e.g. gpu, whisper"
            value={nodeCaps}
            onChange={(e) => setNodeCaps(e.target.value)}
          />
          <button
            className="px-3 py-1 rounded bg-indigo-600 text-sm hover:bg-indigo-500 disabled:opacity-50"
            disabled={!nodeName || registerMut.isPending}
            onClick={() => registerMut.mutate()}
          >
            {registerMut.isPending ? "Registering…" : "Register Node"}
          </button>
        </div>
      </section>
    </div>
  );
}
