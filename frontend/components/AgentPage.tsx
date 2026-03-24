"use client";

import { useState } from "react";
import { AudioUpload } from "./AudioUpload";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input) return;
    const id = Date.now();
    const nextMessages: Message[] = [
      ...messages,
      { id, role: "user", content: input }
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, sessionId: sessionId ?? undefined })
      });
      if (!res.ok) {
        throw new Error(`Interaction failed: ${res.status}`);
      }
      // Backend currently enqueues and returns 202; no assistant text yet.
      setMessages([
        ...nextMessages,
        {
          id: id + 1,
          role: "assistant",
          content: "Request enqueued. Check runs or artifacts for results."
        }
      ]);
    } catch (err: any) {
      setMessages([
        ...nextMessages,
        { id: id + 1, role: "assistant", content: String(err?.message ?? err) }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <h2 className="text-xl font-semibold mb-2">Agent</h2>
      <div className="mb-3 text-xs text-slate-400">
        Chat with the orchestration endpoint. Messages are enqueued and processed
        asynchronously.
      </div>
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
            Start a conversation by sending a prompt.
          </div>
        )}
      </div>
      <div className="space-y-2">
        <textarea
          className="w-full text-sm bg-slate-950 border border-slate-800 rounded px-2 py-1"
          rows={3}
          placeholder="Ask the agent to plan or run work…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex items-center justify-between gap-4">
          <button
            className="px-3 py-1 rounded bg-sky-600 text-sm hover:bg-sky-500 disabled:opacity-50"
            disabled={loading}
            onClick={sendMessage}
          >
            Send
          </button>
          <div className="flex items-center gap-4">
            <AudioUpload />
          </div>
        </div>
      </div>
    </div>
  );
}

