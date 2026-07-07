"use client";

import { useState } from "react";

export default function DevToolsActions({ userId }: { userId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
      setConfirmDelete(null);
    }
  }

  const actions = [
    { id: "create-sample-campaign", label: "Create sample campaign" },
    { id: "create-sample-leads", label: "Create 5 sample leads" },
    { id: "analyze-sample-leads", label: "Analyze sample leads" },
    { id: "generate-sample-drafts", label: "Generate sample drafts" },
  ];

  const cleanupActions = [
    { id: "delete-sample-data", label: "Delete sample data", destructive: true, confirmLabel: "Delete all campaigns + leads + drafts" },
    { id: "clear-failed-ai-logs", label: "Clear failed AI usage logs", destructive: false },
    { id: "clear-cancelled-drafts", label: "Clear cancelled drafts", destructive: false },
  ];

  return (
    <div className="space-y-6">
      {result && (
        <div className={`rounded-lg border p-4 text-sm ${
          result.success ? "border-emerald-800/30 bg-emerald-950/20 text-emerald-400" : "border-rose-800/30 bg-rose-950/20 text-rose-400"
        }`}>
          {result.message}
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Sample Data Generator</h2>
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

      <div className="border-t border-zinc-800 pt-6">
        <h2 className="text-sm font-semibold text-white mb-3">Cleanup</h2>
        <div className="space-y-3">
          {cleanupActions.map((a) => (
            <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between">
              <div>
                <span className="text-sm text-zinc-300">{a.label}</span>
                {a.destructive && confirmDelete === a.id && (
                  <p className="text-xs text-rose-400 mt-1">This will permanently delete data. Are you sure?</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {a.destructive && confirmDelete === a.id ? (
                  <>
                    <button
                      onClick={() => run(a.id)}
                      disabled={loading === a.id}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-600 px-4 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-40 transition-colors"
                    >
                      {loading === a.id ? "Deleting..." : "Confirm Delete"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => a.destructive ? setConfirmDelete(a.id) : run(a.id)}
                    disabled={loading === a.id}
                    className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-medium transition-colors ${
                      a.destructive
                        ? "border border-rose-700 text-rose-400 hover:bg-rose-950/30"
                        : "bg-zinc-700 text-white hover:bg-zinc-600"
                    } disabled:opacity-40`}
                  >
                    {loading === a.id ? "Running..." : a.destructive ? "Delete" : "Run"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
