"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const statuses = ["ACTIVE", "PAUSED", "COMPLETED"] as const;

export default function CampaignControls({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setUpdating(true);
    await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setUpdating(false);
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
      <h2 className="text-sm font-semibold text-white mb-4">
        Campaign Controls
      </h2>
      <div className="flex flex-wrap gap-3">
        {statuses.map((s) => (
          <button
            key={s}
            disabled={updating || status === s}
            onClick={() => handleStatusChange(s)}
            className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              s === "ACTIVE"
                ? "bg-green-600 text-white hover:bg-green-500"
                : s === "PAUSED"
                ? "bg-amber-600 text-white hover:bg-amber-500"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {s === "ACTIVE" ? "Activate" : s === "PAUSED" ? "Pause" : "Mark Completed"}
          </button>
        ))}
      </div>
    </div>
  );
}
