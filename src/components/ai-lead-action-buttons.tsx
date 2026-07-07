"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AnalyzeAndDraftButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/leads/analyze-and-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.refresh();
      const parts: string[] = [];
      if (data.draftCreated) parts.push("Draft created");
      if (data.status === "REJECTED") parts.push("Rejected (below threshold)");
      setMessage(parts.join(" / ") || "Done");
    } else {
      setMessage(data.error || "Failed");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors font-medium"
      >
        {loading ? "..." : "Recommended: Analyze + Generate Draft"}
      </button>
      {message && (
        <p className="text-[10px] text-zinc-500 mt-0.5 max-w-[140px] leading-tight">{message}</p>
      )}
    </div>
  );
}

export function AnalyzeAndDraftAllButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    total: number;
    analyzed: number;
    draftsCreated: number;
    rejected: number;
    skipped: number;
    rateLimitErrors?: number;
    providerUsage?: Record<string, number>;
  } | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/leads/analyze-and-draft-all", {
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
        Analyzed {result.analyzed} &middot;{" "}
        <span className="text-green-400">{result.draftsCreated} drafts</span>
        {" / "}
        <span className="text-zinc-500">{result.rejected} rejected</span>
        {result.skipped > 0 && <span> &middot; {result.skipped} skipped</span>}
        {result.rateLimitErrors && result.rateLimitErrors > 0 && (
          <span className="text-rose-400"> &middot; {result.rateLimitErrors} rate limited</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-700 px-3.5 text-xs font-medium text-emerald-400 hover:bg-emerald-950/30 disabled:opacity-40 transition-colors"
    >
      {loading ? "Processing..." : "Recommended: Analyze + Generate Drafts"}
    </button>
  );
}
