"use client";

import { useState } from "react";

export default function DevToolsActions({ userId }: { userId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function run(action: string) {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch("/api/dev-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setResult({ success: res.ok, message: data.message || data.error || "Done." });
    } catch {
      setResult({ success: false, message: "Request failed." });
    } finally {
      setLoading(null);
    }
  }

  const actions = [
    { id: "create-sample-campaign", label: "Create sample campaign" },
    { id: "create-sample-leads", label: "Create 5 sample leads" },
    { id: "analyze-sample-leads", label: "Analyze sample leads" },
    { id: "generate-sample-drafts", label: "Generate sample drafts" },
  ];

  return (
    <div className="space-y-4">
      {result && (
        <div className={`rounded-lg border p-4 text-sm ${
          result.success ? "border-emerald-800/30 bg-emerald-950/20 text-emerald-400" : "border-rose-800/30 bg-rose-950/20 text-rose-400"
        }`}>
          {result.message}
        </div>
      )}
      <div className="space-y-3">
        {actions.map((a) => (
          <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
            <span className="text-sm text-zinc-300">{a.label}</span>
            <button
              onClick={() => run(a.id)}
              disabled={loading === a.id}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-700 px-4 text-xs font-medium text-white hover:bg-zinc-600 disabled:opacity-40 transition-colors"
            >
              {loading === a.id ? "Running..." : "Run"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
