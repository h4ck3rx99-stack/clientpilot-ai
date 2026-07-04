"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type LeadData = {
  companyName?: string;
  website?: string;
  email?: string;
  sourceUrl?: string;
  industry?: string;
  painPoint?: string;
  offerAngle?: string;
  personalizationLine?: string;
  fitScore?: number;
  status?: string;
};

export default function LeadForm({
  campaignId,
  lead,
}: {
  campaignId: string;
  lead?: LeadData & { id?: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const isEdit = !!lead?.id;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      companyName: form.get("companyName") as string,
      website: form.get("website") as string,
      email: form.get("email") as string,
      sourceUrl: form.get("sourceUrl") as string,
      industry: form.get("industry") as string,
      painPoint: form.get("painPoint") as string,
      offerAngle: form.get("offerAngle") as string,
      personalizationLine: form.get("personalizationLine") as string,
    };

    if (isEdit) {
      body.fitScore = Number(form.get("fitScore")) || 0;
      body.status = (form.get("status") as string) || "NEW";
    }

    const localErrors: string[] = [];
    if (!body.companyName?.toString().trim())
      localErrors.push("Company name is required");
    if (!body.website?.toString().trim())
      localErrors.push("Website is required");
    else if (
      !/^https?:\/\/.+/.test(body.website?.toString().trim())
    )
      localErrors.push("Website must be a valid URL (starting with http:// or https://)");
    if (!body.email?.toString().trim())
      localErrors.push("Email is required");
    else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email?.toString().trim())
    )
      localErrors.push("Email must be a valid email address");
    if (!body.sourceUrl?.toString().trim())
      localErrors.push("Source URL is required");
    else if (
      !/^https?:\/\/.+/.test(body.sourceUrl?.toString().trim())
    )
      localErrors.push("Source URL must be a valid URL (starting with http:// or https://)");
    if (isEdit) {
      const score = Number(body.fitScore);
      if (score < 0 || score > 100)
        localErrors.push("Fit score must be between 0 and 100");
    }

    if (localErrors.length > 0) {
      setErrors(localErrors);
      setSubmitting(false);
      return;
    }

    if (!isEdit) {
      body.campaignId = campaignId;
    }

    const url = isEdit
      ? `/api/leads/${lead.id}`
      : "/api/leads";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(`/campaigns/${campaignId}/leads`);
    } else {
      const data = await res.json();
      setErrors(data.errors || ["Failed to save lead"]);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">{err}</p>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Company name <span className="text-red-400">*</span>
        </label>
        <input
          id="companyName" name="companyName" type="text" required
          defaultValue={lead?.companyName ?? ""}
          placeholder="e.g. Acme Corp"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Website <span className="text-red-400">*</span>
          </label>
          <input
            id="website" name="website" type="url" required
            defaultValue={lead?.website ?? ""}
            placeholder="e.g. https://acme.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email" name="email" type="email" required
            defaultValue={lead?.email ?? ""}
            placeholder="e.g. contact@acme.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sourceUrl" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Source URL <span className="text-red-400">*</span>
        </label>
        <input
          id="sourceUrl" name="sourceUrl" type="url" required
          defaultValue={lead?.sourceUrl ?? ""}
          placeholder="e.g. https://acme.com/about"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Industry
          </label>
          <input
            id="industry" name="industry" type="text"
            defaultValue={lead?.industry ?? ""}
            placeholder="e.g. Fintech"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="painPoint" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Pain point
        </label>
        <textarea
          id="painPoint" name="painPoint" rows={2}
          defaultValue={lead?.painPoint ?? ""}
          placeholder="e.g. Struggling with outdated website and low conversion rates"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="offerAngle" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Offer angle
          </label>
          <input
            id="offerAngle" name="offerAngle" type="text"
            defaultValue={lead?.offerAngle ?? ""}
            placeholder="e.g. Modern stack migration"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="personalizationLine" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Personalization line
          </label>
          <input
            id="personalizationLine" name="personalizationLine" type="text"
            defaultValue={lead?.personalizationLine ?? ""}
            placeholder="e.g. Noticed your recent blog on scaling"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fitScore" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Fit score
            </label>
            <input
              id="fitScore" name="fitScore" type="number" min={0} max={100}
              defaultValue={lead?.fitScore ?? 0}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Status
            </label>
            <select
              id="status" name="status"
              defaultValue={lead?.status ?? "NEW"}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="NEW">NEW</option>
              <option value="ANALYZED">ANALYZED</option>
              <option value="QUEUED">QUEUED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="SENT">SENT</option>
              <option value="REPLIED">REPLIED</option>
              <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-6 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Saving..." : isEdit ? "Update Lead" : "Add Lead"}
        </button>
        <Link
          href={`/campaigns/${campaignId}/leads`}
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
