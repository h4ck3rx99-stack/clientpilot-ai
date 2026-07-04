"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateDraftButton({
  leadId,
  campaignId,
}: {
  leadId: string;
  campaignId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/leads/generate-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.refresh();
      setMessage("Draft generated");
    } else {
      setMessage(data.error || "Cannot generate draft");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 transition-colors"
      >
        {loading ? "..." : "Generate Draft"}
      </button>
      {message && (
        <p className="text-[10px] text-zinc-500 mt-0.5 max-w-[120px] leading-tight">
          {message}
        </p>
      )}
    </div>
  );
}

export function GenerateDraftsAllButton({
  campaignId,
}: {
  campaignId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    generated: number;
    skipped: number;
    details?: { reasons: string[] };
  } | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/leads/generate-drafts", {
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
        Generated {result.generated} draft{result.generated !== 1 ? "s" : ""}
        {result.skipped > 0 && (
          <span>
            {" "}
            &middot; {result.skipped} skipped
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-3.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
    >
      {loading ? "Generating..." : "Generate Drafts for High-Fit Leads"}
    </button>
  );
}
