"use client";

import { useState } from "react";

export default function SearchQueryList({ query }: { query: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(query);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
      <span className="text-xs text-zinc-400 flex-1 font-mono">{query}</span>
      <button
        onClick={handleCopy}
        className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0 transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
