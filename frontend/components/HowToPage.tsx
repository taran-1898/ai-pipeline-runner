"use client";

import React from "react";

const steps = [
  {
    icon: "🤖",
    title: "Interact with the AI Agent",
    description: "Use the Assistant to plan complex workflows or execute simple commands. It can orchestrate between LLMs, external tools, and your custom pipelines.",
    details: [
      "🎤 Use voice commands for hands-free control (mobile friendly)",
      "💬 Send text prompts to draft new pipelines automatically",
      "🛰 The Orchestration Worker routes requests based on real-time needs"
    ]
  },
  {
    icon: "⚡",
    title: "Define & Run Pipelines",
    description: "Pipelines are Directed Acyclic Graphs (DAGs) where each step can require specific 'capabilities' from your worker fleet.",
    details: [
      "🛠 Create multi-step workflows with LLM integration",
      "🏷 Tag steps with requirements like 'gpu' or 'whisper'",
      "▶ Execute pipelines with custom JSON input data"
    ]
  },
  {
    icon: "🏢",
    title: "Manage Your Worker Fleet",
    description: "Run private workers on your local machines (Laptop, Desktop, or Edge hardware) to handle compute-heavy tasks securely.",
    details: [
      "🔏 Secure connection via internal node registry",
      "📡 Real-time heartbeat monitoring (Online/Offline status)",
      "⚖ Jobs are automatically routed to nodes with matching capabilities"
    ]
  },
  {
    icon: "📁",
    title: "Track Artifacts & Runs",
    description: "Every execution is recorded. View logs, download generated files, and review transcription histories in one place.",
    details: [
      "📋 Full execution traces for every pipeline run",
      "📦 Artifacts stored securely in Cloudflare R2",
      "🔗 Shareable public links for generated assets"
    ]
  }
];

export function HowToPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-4">
      {/* Hero Section */}
      <header className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500">
          How it Works
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Welcome to the AI Pipeline Runner. A distributed, capability-aware system 
          designed to orchestrate complex AI workflows across your entire device fleet.
        </p>
      </header>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, idx) => (
          <div 
            key={idx}
            className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-sky-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/10"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
              {step.icon}
            </div>
            <h3 className="text-xl font-semibold text-slate-100 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              {step.description}
            </p>
            <ul className="space-y-2">
              {step.details.map((detail, dIdx) => (
                <li key={dIdx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-sky-500 mt-0.5">•</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer / Call to action */}
      <section className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border border-indigo-500/20 text-center">
        <h2 className="text-2xl font-semibold mb-3">Ready to get started?</h2>
        <p className="text-slate-400 text-sm mb-6">
          Head over to the Agent tab to register your first worker node or ask the AI to draft a pipeline for you.
        </p>
        <div className="flex justify-center gap-4">
          <a 
            href="/agent" 
            className="px-6 py-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
          >
            Go to Agent
          </a>
          <a 
            href="/pipelines" 
            className="px-6 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors border border-slate-700"
          >
            View Pipelines
          </a>
        </div>
      </section>
    </div>
  );
}
