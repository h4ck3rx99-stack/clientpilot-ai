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
  provider?: string;
  results: SendResult[];
};

export default function SimulatedSendCard({
  campaignId,
  campaignStatus,
  dailySendLimit,
  sentToday,
  queuedCount,
  emailMode = "simulation",
  smtpConfigured = false,
}: {
  campaignId: string;
  campaignStatus: string;
  dailySendLimit: number;
  sentToday: number;
  queuedCount: number;
  emailMode?: string;
  smtpConfigured?: boolean;
}) {
  const [simLoading, setSimLoading] = useState(false);
  const [realLoading, setRealLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  const remaining = Math.max(0, dailySendLimit - sentToday);
  const isSmtpMode = emailMode === "smtp" && smtpConfigured;

  async function handleSimulatedSend() {
    setSimLoading(true);
    setSummary(null);
    const res = await fetch("/api/campaigns/simulate-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    const data: Summary = await res.json();
    setSummary(data);
    router.refresh();
    setSimLoading(false);
  }

  async function handleRealSend() {
    if (isSmtpMode && !confirmed) return;
    setRealLoading(true);
    setSummary(null);
    const res = await fetch("/api/campaigns/send-queued", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, confirmed }),
    });
    const data: Summary = await res.json();
    setSummary(data);
    router.refresh();
    setRealLoading(false);
  }

  const canRealSend = queuedCount > 0 && (!isSmtpMode || confirmed) && (emailMode !== "smtp" || smtpConfigured);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Send Emails</h2>
          {!isSmtpMode && emailMode === "simulation" && (
            <p className="text-xs text-zinc-500 mt-0.5">Simulation mode active — no real emails will be sent.</p>
          )}
          {emailMode === "smtp" && !smtpConfigured && (
            <p className="text-xs text-yellow-400 mt-0.5">SMTP config missing — configure SMTP settings to send.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase ${
            emailMode === "smtp"
              ? "border border-indigo-700/50 bg-indigo-950/30 text-indigo-400"
              : "border border-zinc-700 bg-zinc-800/50 text-zinc-400"
          }`}>
            {emailMode}
          </span>
          {smtpConfigured && (
            <span className="inline-flex items-center rounded-full border border-green-700/50 bg-green-950/30 px-2.5 py-0.5 text-[10px] font-medium text-green-400">SMTP Ready</span>
          )}
        </div>
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
          <p className={`text-lg font-semibold ${remaining > 0 ? "text-green-400" : "text-red-400"}`}>{remaining}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs text-zinc-500">Queued</p>
          <p className="text-lg font-semibold text-yellow-400">{queuedCount}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSimulatedSend}
          disabled={simLoading || queuedCount === 0}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
        >
          {simLoading ? "Sending..." : `Run Simulated Send (${queuedCount} queued)`}
        </button>
        <button
          onClick={handleRealSend}
          disabled={realLoading || !canRealSend}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 transition-colors"
        >
          {realLoading ? "Sending..." : `Send Queued Emails (${queuedCount})`}
        </button>
      </div>

      {isSmtpMode && (
        <>
          <div className="rounded-xl border border-rose-800/30 bg-rose-950/10 p-4 space-y-3">
            <p className="text-xs font-semibold text-rose-300">Real emails will be sent. Only reviewed QUEUED drafts are eligible.</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
              <span>Queued drafts: {queuedCount}</span>
              <span>Campaign daily limit: {dailySendLimit}</span>
              <span>Real send daily limit: {process.env.NEXT_PUBLIC_REAL_SEND_DAILY_LIMIT || "20"}</span>
              <span>Batch limit: {process.env.NEXT_PUBLIC_REAL_SEND_BATCH_LIMIT || "10"}</span>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 rounded border-zinc-600 bg-zinc-800 accent-indigo-500"
              />
              <span className="text-xs text-zinc-300">I understand real emails will be sent.</span>
            </label>
          </div>
        </>
      )}

      {campaignStatus !== "ACTIVE" && (
        <p className="text-xs text-yellow-400">Activate this campaign before sending queued emails.</p>
      )}

      {summary && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-green-400">{summary.sent}</p>
              <p className="text-xs text-zinc-500">Sent</p>
            </div>
            <div>
              <p className="text-lg font-bold text-yellow-400">{summary.skipped}</p>
              <p className="text-xs text-zinc-500">Skipped</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">{summary.failed}</p>
              <p className="text-xs text-zinc-500">Failed</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 text-center">
            Remaining capacity today: {summary.remainingCapacity}
            {summary.provider && <span> &middot; Provider: {summary.provider}</span>}
          </p>
          {summary.results.some((r) => r.reason) && (
            <div className="space-y-1 pt-2 border-t border-zinc-700">
              <p className="text-xs text-zinc-500 font-medium">Skipped details:</p>
              {summary.results.filter((r) => r.reason).slice(0, 10).map((r, i) => (
                <p key={i} className="text-xs text-zinc-400">
                  <span className="text-zinc-300">{r.companyName}</span>: {r.reason}
                </p>
              ))}
              {summary.results.filter((r) => r.reason).length > 10 && (
                <p className="text-xs text-zinc-600">+{summary.results.filter((r) => r.reason).length - 10} more</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
