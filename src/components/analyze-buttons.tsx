"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnalyzeLeadButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    await fetch("/api/leads/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors"
    >
      {loading ? "..." : "Analyze"}
    </button>
  );
}

export function AnalyzeAllButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    analyzed: number;
    passedThreshold: number;
    rejectedBelowThreshold: number;
  } | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/leads/analyze-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    const data = await res.json();
    setResult(data);
    router.refresh();
    setLoading(false);
  }

  if (result) {
    return (
      <div className="text-xs text-zinc-400">
        Analyzed {result.analyzed} lead{result.analyzed !== 1 ? "s" : ""} &mdash;{" "}
        <span className="text-green-400">{result.passedThreshold} passed</span>
        {" / "}
        <span className="text-zinc-500">{result.rejectedBelowThreshold} rejected</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-3.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
    >
      {loading ? "Analyzing..." : "Analyze All Leads"}
    </button>
  );
}
