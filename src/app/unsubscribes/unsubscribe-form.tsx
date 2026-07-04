"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function UnsubscribeForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const reason = (form.get("reason") as string).trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/unsubscribes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, reason }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.message || "Email added to unsubscribe list.");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else {
      setError(data.error || "Failed to add email.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div className="rounded-lg border border-green-800 bg-green-950/50 p-3">
          <p className="text-sm text-green-400">{message}</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Email <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Reason (optional)
        </label>
        <input
          id="reason"
          name="reason"
          type="text"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. Not interested"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Adding..." : "Add to Unsubscribe List"}
      </button>
    </form>
  );
}
