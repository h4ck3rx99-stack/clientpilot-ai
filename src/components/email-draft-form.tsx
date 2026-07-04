"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function EmailDraftForm({
  draftId,
  campaignId,
  initial,
}: {
  draftId: string;
  campaignId: string;
  initial: { subject: string; body: string; status: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const form = new FormData(e.currentTarget);
    const action = form.get("action") as string;
    const subject = (form.get("subject") as string).trim();
    const body = (form.get("body") as string).trim();

    const localErrors: string[] = [];
    if (!subject) localErrors.push("Subject is required");
    else if (subject.length > 120)
      localErrors.push("Subject must be 120 characters or fewer");
    if (!body) localErrors.push("Body is required");
    else if (body.length > 3000)
      localErrors.push("Body must be 3000 characters or fewer");

    if (localErrors.length > 0) {
      setErrors(localErrors);
      setSubmitting(false);
      return;
    }

    let newStatus = initial.status;
    if (action === "queue") newStatus = "QUEUED";
    else if (action === "cancel") newStatus = "CANCELLED";
    else if (initial.status === "DRAFT") newStatus = "DRAFT";

    const res = await fetch(`/api/email-drafts/${draftId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, status: newStatus }),
    });

    if (res.ok) {
      router.push(`/campaigns/${campaignId}/emails`);
    } else {
      const data = await res.json();
      setErrors(data.errors || ["Failed to save"]);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Subject <span className="text-red-400">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          maxLength={120}
          defaultValue={initial.subject}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-zinc-600 mt-1">Max 120 characters</p>
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Body <span className="text-red-400">*</span>
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={14}
          maxLength={3000}
          defaultValue={initial.body}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
        />
        <p className="text-xs text-zinc-600 mt-1">Max 3000 characters</p>
      </div>

      <input type="hidden" name="action" id="action" value="" />

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          onClick={() => {
            const input = document.getElementById("action") as HTMLInputElement;
            input.value = "save";
          }}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Saving..." : "Save Draft"}
        </button>
        {initial.status !== "CANCELLED" && initial.status !== "QUEUED" && (
          <button
            type="submit"
            disabled={submitting}
            onClick={() => {
              const input = document.getElementById("action") as HTMLInputElement;
              input.value = "queue";
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            Mark Queued
          </button>
        )}
        {initial.status !== "CANCELLED" && (
          <button
            type="submit"
            disabled={submitting}
            onClick={() => {
              const input = document.getElementById("action") as HTMLInputElement;
              input.value = "cancel";
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            Cancel Draft
          </button>
        )}
        <Link
          href={`/campaigns/${campaignId}/emails`}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Back
        </Link>
      </div>
    </form>
  );
}
