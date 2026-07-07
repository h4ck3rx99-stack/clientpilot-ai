"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CardSection } from "@/components/ui/card";

export default function RunActions({
  campaignId,
  campaignName,
  eligibleForAnalysis,
  eligibleForDraft,
  maxBulk,
}: {
  campaignId: string;
  campaignName: string;
  eligibleForAnalysis: number;
  eligibleForDraft: number;
  maxBulk: number;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    analyzed?: number;
    drafts?: number;
    rejected?: number;
    errors?: number;
    message?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/leads/analyze-and-draft-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        router.refresh();
      } else {
        setError(data.error || data.message || "Analysis failed.");
      }
    } catch {
      setError("Request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const canRun = (eligibleForAnalysis > 0 || eligibleForDraft > 0) && !loading;

  return (
    <div className="space-y-6">
      <CardSection className={canRun ? "border-indigo-800/30" : ""}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Run Analyze + Draft</p>
            <p className="text-xs text-zinc-500 mt-1">
              {eligibleForAnalysis > 0
                ? `${Math.min(eligibleForAnalysis, maxBulk)} leads will be analyzed`
                : "No new leads to analyze."}
              {eligibleForDraft > 0 && ` · ${Math.min(eligibleForDraft, maxBulk)} analyzed leads will get drafts`}
            </p>
          </div>
          <Button onClick={handleRun} disabled={!canRun} variant="primary" size="md">
            {loading ? "Running..." : canRun ? "Run Analyze + Draft" : "Nothing to process"}
          </Button>
        </div>
      </CardSection>

      {error && <Alert variant="danger">{error}</Alert>}

      {result && (
        <CardSection title="Results">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-lg font-bold text-green-400">{result.analyzed || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase">Analyzed</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-lg font-bold text-blue-400">{result.drafts || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase">Drafts</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">{result.rejected || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase">Rejected</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-lg font-bold text-rose-400">{result.errors || 0}</p>
              <p className="text-[10px] text-zinc-500 uppercase">Errors</p>
            </div>
          </div>
          {result.message && <p className="text-xs text-zinc-500">{result.message}</p>}
        </CardSection>
      )}

      <div className="flex gap-3">
        <a
          href={`/campaigns/${campaignId}/leads`}
          className="inline-flex h-10 items-center rounded-lg border border-zinc-700 px-5 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Review Leads
        </a>
        <a
          href={`/campaigns/${campaignId}/emails`}
          className="inline-flex h-10 items-center rounded-lg bg-indigo-500 px-5 text-sm text-white hover:bg-indigo-400 transition-colors"
        >
          Review Drafts
        </a>
      </div>
    </div>
  );
}
