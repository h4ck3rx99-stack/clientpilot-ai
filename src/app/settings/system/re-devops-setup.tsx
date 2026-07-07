"use client";

import { useState } from "react";

export default function ReDevOpsSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSetup() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/setup/redevops", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResult(`Profile & campaign ready — "${data.campaign.name}" is now ACTIVE with 500/day.`);
      } else {
        setResult(`Error: ${data.error || "Setup failed"}`);
      }
    } catch {
      setResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="text-sm font-semibold text-white mb-1">RE Dev Ops Setup</h2>
      <p className="text-xs text-zinc-500 mb-3">
        One-click setup: creates profile and default campaign with 500/day limit.
      </p>
      <button
        onClick={handleSetup}
        disabled={loading}
        className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-500 px-4 text-xs font-medium text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors"
      >
        {loading ? "Setting up..." : "Run Setup"}
      </button>
      {result && (
        <p className="text-xs text-zinc-400 mt-3">{result}</p>
      )}
    </div>
  );
}
