import Link from "next/link";

type Lead = {
  id: string;
  companyName: string;
  email: string | null;
  fitScore: number;
  pipelineStatus: string;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  notes: string | null;
};

export default function PipelineColumn({
  title,
  status,
  leads,
  campaignId,
}: {
  title: string;
  status: string;
  leads: Lead[];
  campaignId: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-xs text-zinc-600 bg-zinc-800/50 rounded-full px-2 py-0.5">
          {leads.length}
        </span>
      </div>

      <div className="space-y-2">
        {leads.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">No leads</p>
        )}
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white truncate">
                {lead.companyName}
              </span>
              {lead.fitScore > 0 && (
                <span className="text-xs text-zinc-500 ml-1 shrink-0">
                  {lead.fitScore}
                </span>
              )}
            </div>
            {lead.email && (
              <p className="text-xs text-zinc-500 truncate">{lead.email}</p>
            )}
            {lead.lastContactedAt && (
              <p className="text-[10px] text-zinc-600">
                Last:{" "}
                {new Date(lead.lastContactedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
            {lead.nextFollowUpAt && (
              <p className="text-[10px] text-rose-400">
                Follow-up:{" "}
                {new Date(lead.nextFollowUpAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            )}
            {lead.notes && (
              <p className="text-[10px] text-zinc-600 line-clamp-2">
                {lead.notes}
              </p>
            )}
            <Link
              href={`/campaigns/${campaignId}/leads/${lead.id}/edit`}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors block mt-1"
            >
              View / Edit
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
