import "./globals.css";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const metadata = {
  title: "AI Pipeline Runner",
  description: "Visual runner for AI pipelines"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen">
            <aside className="w-52 border-r border-slate-800 p-4 space-y-2">
              <h1 className="text-lg font-semibold mb-4">AI Pipeline Runner</h1>
              <nav className="flex flex-col gap-2 text-sm">
                <a href="/pipelines" className="hover:text-sky-400">
                  Pipelines
                </a>
                <a href="/runs" className="hover:text-sky-400">
                  Runs
                </a>
                <a href="/files" className="hover:text-sky-400">
                  Files
                </a>
                <a href="/agent" className="hover:text-sky-400">
                  Agent
                </a>
              </nav>
            </aside>
            <main className="flex-1 p-6">{children}</main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}

