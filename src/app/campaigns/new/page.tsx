"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCampaignPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name") as string,
      serviceToPitch: form.get("serviceToPitch") as string,
      targetNiche: form.get("targetNiche") as string,
      targetLocation: form.get("targetLocation") as string,
      offer: form.get("offer") as string,
      cta: form.get("cta") as string,
      dailySendLimit: Number(form.get("dailySendLimit")) || 20,
      minimumFitScore: Number(form.get("minimumFitScore")) || 60,
    };

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      alert("Failed to create campaign. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            CP
          </div>
          <span className="text-sm font-semibold">ClientPilot AI</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/campaigns/new"
            className="text-white font-medium"
          >
            New Campaign
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">New campaign</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Campaign name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Web Dev Outreach — Q3"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="serviceToPitch"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Service to pitch
            </label>
            <input
              id="serviceToPitch"
              name="serviceToPitch"
              type="text"
              required
              placeholder="e.g. React Native development"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="targetNiche"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Target niche
              </label>
              <input
                id="targetNiche"
                name="targetNiche"
                type="text"
                required
                placeholder="e.g. Fintech startups"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="targetLocation"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Target location
              </label>
              <input
                id="targetLocation"
                name="targetLocation"
                type="text"
                required
                placeholder="e.g. San Francisco, CA"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="offer"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Offer
            </label>
            <textarea
              id="offer"
              name="offer"
              required
              rows={2}
              placeholder="e.g. Free audit of their current stack"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="cta"
              className="block text-sm font-medium text-zinc-300 mb-1.5"
            >
              Call to action
            </label>
            <input
              id="cta"
              name="cta"
              type="text"
              required
              placeholder="e.g. Reply to this email to schedule a call"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dailySendLimit"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Daily send limit
              </label>
              <input
                id="dailySendLimit"
                name="dailySendLimit"
                type="number"
                min={1}
                max={100}
                defaultValue={20}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="minimumFitScore"
                className="block text-sm font-medium text-zinc-300 mb-1.5"
              >
                Minimum fit score
              </label>
              <input
                id="minimumFitScore"
                name="minimumFitScore"
                type="number"
                min={1}
                max={100}
                defaultValue={60}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-6 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating..." : "Create Campaign"}
            </button>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
