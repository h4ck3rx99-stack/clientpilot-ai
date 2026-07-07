"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function UnsubscribePage() {
  const params = useParams();
  const token = params.token as string;
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUnsubscribe() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/unsubscribes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || "Failed to unsubscribe");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          {done ? (
            <>
              <div className="size-12 rounded-full bg-green-950/30 border border-green-700/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-xl">✓</span>
              </div>
              <h1 className="text-lg font-semibold text-white mb-2">
                You have been unsubscribed.
              </h1>
              <p className="text-sm text-zinc-500">
                You will not receive further emails from this sender.
              </p>
            </>
          ) : (
            <>
              <div className="size-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
                <span className="text-zinc-400 text-xl">✉</span>
              </div>
              <h1 className="text-lg font-semibold text-white mb-2">
                Unsubscribe
              </h1>
              <p className="text-sm text-zinc-500 mb-6">
                Click the button below to stop receiving emails.
              </p>
              {error && (
                <p className="text-xs text-rose-400 mb-4">{error}</p>
              )}
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-rose-500 px-5 text-sm font-medium text-white hover:bg-rose-400 disabled:opacity-40 transition-colors"
              >
                {loading ? "Processing..." : "Confirm Unsubscribe"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
