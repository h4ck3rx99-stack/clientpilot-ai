"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export type CampaignFormData = {
  name: string;
  serviceToPitch: string;
  targetNiche: string;
  targetLocation: string;
  offer: string;
  cta: string;
  dailySendLimit: number | string;
  minimumFitScore: number | string;
};

export default function CampaignForm({
  initial,
  action,
  cancelHref,
  campaignId,
}: {
  initial?: CampaignFormData;
  action: "create" | "update";
  cancelHref: string;
  campaignId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!initial || !formRef.current) return;
    const form = formRef.current;
    const fields = ["name", "serviceToPitch", "targetNiche", "targetLocation", "offer", "cta", "dailySendLimit", "minimumFitScore"] as const;
    for (const field of fields) {
      const el = form.elements.namedItem(field) as HTMLInputElement | HTMLTextAreaElement | null;
      if (el) el.value = String(initial[field]);
    }
  }, [initial]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

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

    const localErrors: string[] = [];
    if (!body.name?.trim()) localErrors.push("Campaign name is required");
    if (!body.serviceToPitch?.trim())
      localErrors.push("Service to pitch is required");
    if (!body.targetNiche?.trim())
      localErrors.push("Target niche is required");
    if (!body.targetLocation?.trim())
      localErrors.push("Target location is required");
    if (!body.offer?.trim()) localErrors.push("Offer is required");
    if (!body.cta?.trim()) localErrors.push("CTA is required");
    if (body.dailySendLimit < 1 || body.dailySendLimit > 100)
      localErrors.push("Daily send limit must be between 1 and 100");
    if (body.minimumFitScore < 0 || body.minimumFitScore > 100)
      localErrors.push("Minimum fit score must be between 0 and 100");

    if (localErrors.length > 0) {
      setErrors(localErrors);
      setSubmitting(false);
      return;
    }

    const url =
      action === "create" ? "/api/campaigns" : `/api/campaigns/${campaignId}`;

    const method = action === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(cancelHref);
    } else {
      const data = await res.json();
      setErrors(data.errors || ["Failed to save campaign"]);
      setSubmitting(false);
    }
  }

  function inputClass() {
    return `w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
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
          htmlFor="name"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Campaign name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="e.g. Web Dev Outreach — Q3"
          className={inputClass()}
        />
      </div>

      <div>
        <label
          htmlFor="serviceToPitch"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Service to pitch <span className="text-red-400">*</span>
        </label>
        <input
          id="serviceToPitch"
          name="serviceToPitch"
          type="text"
          required
          defaultValue={initial?.serviceToPitch ?? ""}
          placeholder="e.g. React Native development"
          className={inputClass()}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="targetNiche"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Target niche <span className="text-red-400">*</span>
          </label>
          <input
            id="targetNiche"
            name="targetNiche"
            type="text"
            required
            defaultValue={initial?.targetNiche ?? ""}
            placeholder="e.g. Fintech startups"
            className={inputClass()}
          />
        </div>
        <div>
          <label
            htmlFor="targetLocation"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Target location <span className="text-red-400">*</span>
          </label>
          <input
            id="targetLocation"
            name="targetLocation"
            type="text"
            required
            defaultValue={initial?.targetLocation ?? ""}
            placeholder="e.g. San Francisco, CA"
            className={inputClass()}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="offer"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Offer <span className="text-red-400">*</span>
        </label>
        <textarea
          id="offer"
          name="offer"
          required
          rows={2}
          defaultValue={initial?.offer ?? ""}
          placeholder="e.g. Free audit of their current stack"
            className={`${inputClass()} resize-none`}
        />
      </div>

      <div>
        <label
          htmlFor="cta"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Call to action <span className="text-red-400">*</span>
        </label>
        <input
          id="cta"
          name="cta"
          type="text"
          required
          defaultValue={initial?.cta ?? ""}
          placeholder="e.g. Reply to this email to schedule a call"
          className={inputClass()}
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
            defaultValue={initial?.dailySendLimit ?? 20}
            className={inputClass()}
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
            min={0}
            max={100}
            defaultValue={initial?.minimumFitScore ?? 60}
            className={inputClass()}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-6 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? "Saving..."
            : action === "create"
            ? "Create Campaign"
            : "Save Changes"}
        </button>
        <Link
          href={cancelHref}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
