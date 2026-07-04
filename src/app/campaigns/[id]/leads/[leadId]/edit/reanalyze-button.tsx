"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReanalyzeButton({ leadId }: { leadId: string }) {
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
      className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
    >
      {loading ? "Analyzing..." : "Re-analyze Lead"}
    </button>
  );
}
