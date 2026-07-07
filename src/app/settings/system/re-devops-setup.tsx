"use client";

import { useState } from "react";
import Link from "next/link";

export default function ReDevOpsSetup() {
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSetup() {
    setLoading(true);
    setError(null);
    setCampaignId(null);
    try {
      const res = await fetch("/api/setup/redevops", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCampaignId(data.campaign.id);
      } else {
        setError(data.error || "Setup failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white mb-1">RE Dev Ops Setup</h2>
        <p className="text-xs text-zinc-500">
          One-click setup: creates profile and default campaign with 500/day limit and fit score 75.
        </p>
      </div>

      {!campaignId && (
        <button
          onClick={handleSetup}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-500 px-4 text-xs font-medium text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors"
        >
          {loading ? "Setting up..." : "Setup RE Dev Ops Outreach"}
        </button>
      )}

      {error && (
        <p className="text-xs text-rose-400">{error}</p>
      )}

      {campaignId && (
        <>
          <div className="rounded-lg border border-emerald-800/30 bg-emerald-950/10 p-4 space-y-2">
            <p className="text-xs font-semibold text-emerald-300">Setup complete</p>
            <p className="text-xs text-zinc-400">
              Profile updated and campaign &ldquo;RE Dev Ops outreach&rdquo; is now ACTIVE with 500/day and fit score 75.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/campaigns/${campaignId}`}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-500 px-4 text-xs font-medium text-white hover:bg-indigo-400 transition-colors"
            >
              Open RE Dev Ops Campaign
            </Link>
            <Link
              href="/profile"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-4 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Profile
            </Link>
            <Link
              href={`/campaigns/${campaignId}/leads`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-4 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Add Leads
            </Link>
            <Link
              href={`/campaigns/${campaignId}/discover`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-4 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Discover Leads
            </Link>
            <Link
              href={`/campaigns/${campaignId}/emails`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-4 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Email Queue
            </Link>
            <Link
              href="/launch"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-4 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Launch Checklist
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
