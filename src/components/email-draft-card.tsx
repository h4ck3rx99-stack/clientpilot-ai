import Link from "next/link";
import StatusBadge from "./status-badge";

type Draft = {
  id: string;
  subject: string;
  body: string;
  status: string;
  createdAt: Date;
  lead: {
    companyName: string;
    email: string | null;
    fitScore: number;
  };
};

export default function EmailDraftCard({
  draft,
  campaignId,
}: {
  draft: Draft;
  campaignId: string;
}) {
  const bodyPreview =
    draft.body.length > 150
      ? draft.body.slice(0, 150) + "..."
      : draft.body;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {draft.lead.companyName}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">{draft.lead.email}</p>
        </div>
        <StatusBadge status={draft.status} />
      </div>
      <p className="text-xs text-zinc-400 font-medium mb-1">{draft.subject}</p>
      <p className="text-xs text-zinc-500 whitespace-pre-wrap leading-relaxed">
        {bodyPreview}
      </p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <span>
            Score: {draft.lead.fitScore}
          </span>
          <span>
            {new Date(draft.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <Link
          href={`/campaigns/${campaignId}/emails/${draft.id}/edit`}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Review / Edit
        </Link>
      </div>
    </div>
  );
}
