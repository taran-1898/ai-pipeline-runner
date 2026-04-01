import "./globals.css";
import type { ReactNode } from "react";
import { QueryClientWrapper } from "./QueryClientWrapper";

export const metadata = {
  title: "AI Pipeline Runner",
  description: "Visual runner for AI pipelines",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
};

const navLinks = [
  { href: "/how-to", label: "ℹ️ How To" },
  { href: "/pipelines", label: "⚡ Pipelines" },
  { href: "/runs", label: "📋 Runs" },
  { href: "/files", label: "📁 Files" },
  { href: "/agent", label: "🤖 Agent & Nodes" }
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* iOS Safari PWA/viewport meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <QueryClientWrapper>
          {/* Mobile top bar — only visible on small screens */}
          <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950 sticky top-0 z-20">
            <span className="text-base font-semibold flex-1">AI Pipeline Runner</span>
          </header>

          <div className="flex min-h-screen">
            {/* Sidebar — hidden on mobile, shown on md+ */}
            <aside className="hidden md:flex w-52 border-r border-slate-800 p-4 space-y-2 flex-col">
              <h1 className="text-lg font-semibold mb-4">AI Pipeline Runner</h1>
              <nav className="flex flex-col gap-2 text-sm">
                {navLinks.map((l) => (
                  <a key={l.href} href={l.href} className="hover:text-sky-400 py-1">
                    {l.label}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-x-hidden">
              {children}
            </main>
          </div>

          {/* Mobile bottom tab bar */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center border-t border-slate-800 bg-slate-950"
               style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="flex-1 flex flex-col items-center py-2 text-xs text-slate-400 hover:text-sky-400 active:text-sky-400 tap-highlight-transparent"
              >
                <span className="text-lg leading-tight">{l.label.split(" ")[0]}</span>
                <span className="mt-0.5 leading-none">{l.label.split(" ").slice(1).join(" ")}</span>
              </a>
            ))}
          </nav>
        </QueryClientWrapper>
      </body>
    </html>
  );
}
