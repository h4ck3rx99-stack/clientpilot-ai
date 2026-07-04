"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const PIPELINE_STATUSES = [
  "NOT_CONTACTED",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "NOT_INTERESTED",
  "MEETING_BOOKED",
  "WON",
  "LOST",
  "FOLLOW_UP",
] as const;

export default function LeadManageForm({
  leadId,
  campaignId,
  initial,
}: {
  leadId: string;
  campaignId: string;
  initial: {
    pipelineStatus: string;
    notes: string | null;
    nextFollowUpAt: string | null;
  };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const form = new FormData(e.currentTarget);
    const pipelineStatus = form.get("pipelineStatus") as string;
    const notes = (form.get("notes") as string).trim();
    const nextFollowUpAt = (form.get("nextFollowUpAt") as string) || null;

    const res = await fetch("/api/leads/save-notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, pipelineStatus, notes, nextFollowUpAt }),
    });

    if (res.ok) {
      setMessage("Saved");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to save");
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

      <div>
        <label
          htmlFor="pipelineStatus"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Pipeline Status
        </label>
        <select
          id="pipelineStatus"
          name="pipelineStatus"
          defaultValue={initial.pipelineStatus}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PIPELINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="nextFollowUpAt"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Next Follow-Up Date
        </label>
        <input
          id="nextFollowUpAt"
          name="nextFollowUpAt"
          type="datetime-local"
          defaultValue={initial.nextFollowUpAt || ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={initial.notes || ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Add notes about this lead..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
