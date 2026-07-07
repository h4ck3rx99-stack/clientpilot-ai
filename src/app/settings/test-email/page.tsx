"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CardSection } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default function TestEmailPage() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("ClientPilot AI test email");
  const [body, setBody] = useState("This is a test email from ClientPilot AI.");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status?: string; error?: string } | null>(null);
  const [mode, setMode] = useState<"simulate" | "real">("simulate");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "real" && !confirmed) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail, subject, body, realSend: mode === "real" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ status: mode === "real" ? "sent" : "simulated" });
      } else {
        setResult({ error: data.error || "Failed" });
      }
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/settings/email" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; Email Settings</Link>
            <h1 className="text-lg font-semibold mt-1">Test Email</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Send or simulate one test email before sending real outreach.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Alert variant="info">
          Test emails do not require a campaign or lead. Use this to verify your email setup is working.
        </Alert>

        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Recipient Email</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={3000}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-y font-mono"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              onClick={() => { setMode("simulate"); setConfirmed(false); }}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Simulate Test Email"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("real"); }}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-700 px-5 text-sm font-medium text-rose-400 hover:bg-rose-950/20 disabled:opacity-50 transition-colors"
            >
              Send Real Test Email
            </button>
          </div>

          {mode === "real" && (
            <label className="flex items-start gap-3 rounded-lg border border-rose-800/30 bg-rose-950/10 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 size-4 accent-rose-500"
              />
              <span className="text-xs text-rose-400">
                I understand this will send a real test email to {recipientEmail || "the above address"}.
              </span>
            </label>
          )}

          {mode === "real" && confirmed && (
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-rose-600 px-5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Confirm Real Send"}
            </button>
          )}
        </form>

        {result && (
          <Alert variant={result.error ? "danger" : "success"}>
            {result.error ? `Failed: ${result.error}` : `Test email ${result.status === "real" ? "sent" : "simulated"} successfully.`}
          </Alert>
        )}
      </main>
    </div>
  );
}
