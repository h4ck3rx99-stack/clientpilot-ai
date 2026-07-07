"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const QUICK_ACTIONS = [
  "REPLIED",
  "INTERESTED",
  "NOT_INTERESTED",
  "FOLLOW_UP",
  "MEETING_BOOKED",
  "WON",
  "LOST",
] as const;

export function PipelineActionButtons({
  leadId,
  campaignId: _campaignId,
  currentStatus,
}: {
  leadId: string;
  campaignId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleStatus(newStatus: string) {
    if (newStatus === currentStatus) return;
    setLoading(newStatus);
    setMessage("");

    const res = await fetch("/api/leads/pipeline-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, pipelineStatus: newStatus }),
    });

    if (res.ok) {
      router.refresh();
      setMessage(newStatus.replace(/_/g, " "));
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed");
    }
    setLoading(null);
  }

  return (
    <div className="flex flex-wrap gap-1 max-w-[200px]">
      {QUICK_ACTIONS.map((action) => {
        const active = action === currentStatus;
        return (
          <button
            key={action}
            onClick={() => handleStatus(action)}
            disabled={loading !== null || active}
            className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              active
                ? "bg-indigo-500/20 text-indigo-400 cursor-default"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            } disabled:opacity-40`}
            title={`Mark ${action.replace(/_/g, " ")}`}
          >
            {loading === action
              ? "..."
              : action.replace("_", " ").toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}
