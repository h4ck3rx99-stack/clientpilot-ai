"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

type ImportResult = {
  imported: number;
  skipped: { row: number; reason: string }[];
};

export default function CsvImportForm({
  campaignId,
}: {
  campaignId: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setResult(null);

    const form = new FormData(e.currentTarget);
    const csvText = form.get("csvText") as string;

    if (!csvText?.trim()) {
      setError("CSV text is required");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, csvText }),
    });

    const data = await res.json();

    if (res.ok) {
      setResult(data);
    } else {
      setError(data.error || "Import failed");
    }

    setSubmitting(false);
  }

  if (result) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <p className="text-lg font-semibold text-white mb-2">
          Imported {result.imported} lead{result.imported !== 1 ? "s" : ""}
        </p>
        {result.skipped.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-amber-400">
              Skipped {result.skipped.length} row{result.skipped.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 text-xs text-zinc-500 text-left max-h-32 overflow-y-auto">
              {result.skipped.map((s) => (
                <p key={s.row}>
                  Row {s.row}: {s.reason}
                </p>
              ))}
            </div>
          </div>
        )}
        <Link
          href={`/campaigns/${campaignId}/leads`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
        >
          Back to leads
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="csvText" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Paste CSV data
        </label>
        <textarea
          id="csvText"
          name="csvText"
          rows={10}
          required
          placeholder={`companyName,website,email,sourceUrl,industry\nExample Corp,https://example.com,hello@example.com,https://example.com,Technology`}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono"
        />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-6 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Importing..." : "Import Leads"}
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
