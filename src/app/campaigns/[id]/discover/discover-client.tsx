"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExtractedLead } from "@/lib/lead-discovery";

type EditableLead = ExtractedLead & {
  selected: boolean;
  uid: number;
};

let uidCounter = 0;

export default function DiscoverClient({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractedLeads, setExtractedLeads] = useState<EditableLead[] | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [saveResult, setSaveResult] = useState<{ saved: number; skipped: number } | null>(null);
  const [provider, setProvider] = useState("");

  async function handleExtract() {
    setError("");
    setWarning("");
    setSaveResult(null);
    setExtractedLeads(null);

    if (!sourceUrl.startsWith("http")) {
      setError("Enter a valid source URL starting with http:// or https://");
      return;
    }
    if ((pastedText || "").trim().length < 10) {
      setError("Paste at least 10 characters of public listing text.");
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch("/api/leads/extract-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, sourceUrl, pastedText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Extraction failed");
        return;
      }
      const leads: EditableLead[] = (data.leads || []).map((l: ExtractedLead) => ({
        ...l,
        selected: !!(l.companyName && l.email && l.website),
        uid: ++uidCounter,
      }));
      setExtractedLeads(leads);
      setProvider(`${data.provider} / ${data.model}`);
      if (data.aiFailed) setWarning(data.warning || "AI extraction failed, used local parser instead.");
      if (leads.length === 0) setWarning("No leads found. Try pasting more structured public listing text.");
    } catch {
      setError("Network error during extraction");
    } finally {
      setExtracting(false);
    }
  }

  function toggleLead(uid: number) {
    setExtractedLeads((prev) =>
      prev?.map((l) => (l.uid === uid ? { ...l, selected: !l.selected } : l)) || null
    );
  }

  function updateLeadField(uid: number, field: keyof ExtractedLead, value: string | number) {
    setExtractedLeads((prev) =>
      prev?.map((l) => (l.uid === uid ? { ...l, [field]: value } : l)) || null
    );
  }

  async function handleSave() {
    if (!extractedLeads) return;
    setError("");
    setSaveResult(null);

    const selected = extractedLeads.filter((l) => l.selected);
    if (selected.length === 0) {
      setError("Select at least one lead to save.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/leads/save-extracted-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, leads: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setSaveResult({ saved: data.saved, skipped: data.skipped });
      setExtractedLeads(null);
      setSourceUrl("");
      setPastedText("");
      router.refresh();
    } catch {
      setError("Network error during save");
    } finally {
      setSaving(false);
    }
  }

  function getConfidenceColor(score: number): string {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-rose-400";
  }

  function getConfidenceBadge(score: number): string {
    if (score >= 80) return "border-green-700/50 bg-green-950/30 text-green-400";
    if (score >= 60) return "border-yellow-700/50 bg-yellow-950/30 text-yellow-400";
    return "border-rose-700/50 bg-rose-950/30 text-rose-400";
  }

  return (
    <>
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-3">Source Paste</h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Source URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/directory-page"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Pasted Public Listing Text</label>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={8}
              placeholder="Paste public business listing text from a page you are allowed to use..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-y"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              Paste public business listing text from a page you are allowed to use. Include the source URL for review.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-40 transition-colors"
            >
              {extracting ? "Extracting..." : "Extract Leads"}
            </button>
            {provider && (
              <span className="text-[10px] text-zinc-600">Provider: {provider}</span>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-rose-800/30 bg-rose-950/20 p-3 mb-6">
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      {warning && (
        <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3 mb-6">
          <p className="text-xs text-yellow-400">{warning}</p>
        </div>
      )}

      {saveResult && (
        <div className="rounded-lg border border-green-800/30 bg-green-950/20 p-3 mb-6">
          <p className="text-xs text-green-400">
            Saved {saveResult.saved} lead{ saveResult.saved !== 1 ? "s" : "" }
            {saveResult.skipped > 0 && (
              <span className="text-zinc-400"> &middot; {saveResult.skipped} skipped (invalid or duplicate)</span>
            )}
          </p>
        </div>
      )}

      {extractedLeads && extractedLeads.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              Extracted Leads ({extractedLeads.length})
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-500 px-4 text-xs font-medium text-white hover:bg-indigo-400 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving..." : "Save Selected Leads"}
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="pb-3 pr-3 pt-3 pl-4 w-8">
                    <input
                      type="checkbox"
                      checked={extractedLeads.every((l) => l.selected)}
                      onChange={() => {
                        const all = extractedLeads.every((l) => l.selected);
                        setExtractedLeads((prev) =>
                          prev?.map((l) => ({ ...l, selected: !all })) || null
                        );
                      }}
                      className="accent-indigo-500"
                    />
                  </th>
                  <th className="pb-3 pr-3 pt-3 font-medium">Company</th>
                  <th className="pb-3 pr-3 pt-3 font-medium">Email</th>
                  <th className="pb-3 pr-3 pt-3 font-medium">Website</th>
                  <th className="pb-3 pr-3 pt-3 font-medium">Industry</th>
                  <th className="pb-3 pr-3 pt-3 font-medium">Confidence</th>
                  <th className="pb-3 pr-4 pt-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {extractedLeads.map((lead) => {
                  const hasRequired = !!lead.companyName && !!lead.email && !!lead.website;
                  return (
                    <tr key={lead.uid} className={`border-b border-zinc-800/50 last:border-0 ${!hasRequired ? "bg-rose-950/10" : ""}`}>
                      <td className="py-2.5 pr-3 pl-4">
                        <input
                          type="checkbox"
                          checked={lead.selected}
                          onChange={() => toggleLead(lead.uid)}
                          className="accent-indigo-500"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={lead.companyName}
                          onChange={(e) => updateLeadField(lead.uid, "companyName", e.target.value)}
                          className={`w-full bg-transparent text-xs text-white focus:outline-none border-b border-transparent focus:border-indigo-500 ${!lead.companyName ? "text-rose-400" : ""}`}
                          placeholder="Required"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={lead.email}
                          onChange={(e) => updateLeadField(lead.uid, "email", e.target.value)}
                          className={`w-full bg-transparent text-xs text-white focus:outline-none border-b border-transparent focus:border-indigo-500 ${!lead.email ? "text-rose-400" : ""}`}
                          placeholder="Required"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={lead.website}
                          onChange={(e) => updateLeadField(lead.uid, "website", e.target.value)}
                          className={`w-full bg-transparent text-xs text-white focus:outline-none border-b border-transparent focus:border-indigo-500 ${!lead.website ? "text-rose-400" : ""}`}
                          placeholder="Required"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={lead.industry}
                          onChange={(e) => updateLeadField(lead.uid, "industry", e.target.value)}
                          className="w-full bg-transparent text-xs text-zinc-300 focus:outline-none border-b border-transparent focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${getConfidenceBadge(lead.confidence)}`}>
                          {lead.confidence}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        {lead.notes ? (
                          <span className="text-[10px] text-zinc-600 max-w-[120px] block truncate" title={lead.notes}>
                            {lead.notes}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-700">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-zinc-600 mt-2">
            Fields in <span className="text-rose-400">rose</span> are required. Edit any field before saving. Unchecked rows will be skipped.
          </p>
        </section>
      )}

      {extractedLeads && extractedLeads.length === 0 && !extracting && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center mb-10">
          <p className="text-sm text-zinc-500">No leads found. Try pasting more structured public listing text.</p>
        </div>
      )}
    </>
  );
}
