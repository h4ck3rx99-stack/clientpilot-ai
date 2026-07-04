"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SendResult = {
  status: "sent" | "skipped" | "failed";
  companyName: string;
  email: string;
  reason?: string;
};

type Summary = {
  sent: number;
  skipped: number;
  failed: number;
  remainingCapacity: number;
  results: SendResult[];
};

export default function SimulatedSendCard({
  campaignId,
  campaignStatus,
  dailySendLimit,
  sentToday,
  queuedCount,
}: {
  campaignId: string;
  campaignStatus: string;
  dailySendLimit: number;
  sentToday: number;
  queuedCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const router = useRouter();

  const remaining = Math.max(0, dailySendLimit - sentToday);

  async function handleRunSimulatedSend() {
    setLoading(true);
    setSummary(null);

    const res = await fetch("/api/campaigns/simulate-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });

    const data: Summary = await res.json();
    setSummary(data);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          Sending Simulation
        </h2>
        {campaignStatus !== "ACTIVE" && (
          <span className="text-xs text-yellow-400">
            Campaign must be ACTIVE to send
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Daily Limit</p>
          <p className="text-lg font-semibold text-white">{dailySendLimit}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Sent Today</p>
          <p className="text-lg font-semibold text-blue-400">{sentToday}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Remaining</p>
          <p
            className={`text-lg font-semibold ${
              remaining > 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {remaining}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Queued</p>
          <p className="text-lg font-semibold text-yellow-400">
            {queuedCount}
          </p>
        </div>
      </div>

      <button
        onClick={handleRunSimulatedSend}
        disabled={loading || queuedCount === 0}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 transition-colors"
      >
        {loading
          ? "Sending..."
          : `Run Simulated Send (${queuedCount} queued)`}
      </button>

      {!loading && campaignStatus !== "ACTIVE" && (
        <p className="text-xs text-zinc-500">
          Activate this campaign before sending queued emails.
        </p>
      )}

      {summary && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-green-400">
                {summary.sent}
              </p>
              <p className="text-xs text-zinc-500">Sent</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-400">
                {summary.skipped}
              </p>
              <p className="text-xs text-zinc-500">Skipped</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">
                {summary.failed}
              </p>
              <p className="text-xs text-zinc-500">Failed</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center">
            Remaining capacity today: {summary.remainingCapacity}
          </p>
          {summary.results.some((r) => r.reason) && (
            <div className="space-y-1 pt-2 border-t border-zinc-700">
              <p className="text-xs text-zinc-500 font-medium">
                Skipped details:
              </p>
              {summary.results
                .filter((r) => r.reason)
                .slice(0, 10)
                .map((r, i) => (
                  <p key={i} className="text-xs text-zinc-400">
                    <span className="text-zinc-300">{r.companyName}</span>:{" "}
                    {r.reason}
                  </p>
                ))}
              {summary.results.filter((r) => r.reason).length > 10 && (
                <p className="text-xs text-zinc-600">
                  +{summary.results.filter((r) => r.reason).length - 10} more
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
