"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FollowUpClient({
  campaignId,
  leadId,
  compact,
}: {
  campaignId: string;
  leadId?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    generated?: number;
    skipped?: number;
    status?: string;
    reason?: string;
  } | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setResult(null);

    const body = leadId
      ? JSON.stringify({ leadId })
      : JSON.stringify({ campaignId });

    const res = await fetch("/api/leads/generate-follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await res.json();
    setResult(data);
    router.refresh();
    setLoading(false);
  }

  if (result && compact) {
    return (
      <span className="text-[10px] text-zinc-500">
        {result.status === "generated"
          ? "Generated"
          : result.reason
          ? result.reason.slice(0, 60) + (result.reason.length > 60 ? "..." : "")
          : "Skipped"}
      </span>
    );
  }

  if (result && !compact) {
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-3 space-y-2">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-green-400">
            Generated: {result.generated ?? 0}
          </span>
          <span className="text-yellow-400">
            Skipped: {result.skipped ?? 0}
          </span>
        </div>
        <button
          onClick={() => setResult(null)}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Generate again
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors ${
        compact
          ? "h-7 px-2.5"
          : "h-9 px-3.5"
      }`}
    >
      {loading
        ? "Generating..."
        : compact
        ? "Generate FU"
        : "Generate Follow-ups"}
    </button>
  );
}
