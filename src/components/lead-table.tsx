import Link from "next/link";
import StatusBadge from "./status-badge";
import { AnalyzeLeadButton } from "./analyze-buttons";
import { GenerateDraftButton } from "./generate-draft-buttons";
import { PipelineActionButtons } from "./pipeline-action-buttons";
import FitScoreBadge from "./fit-score-badge";

type Lead = {
  id: string;
  companyName: string;
  website: string | null;
  email: string | null;
  sourceUrl: string | null;
  industry: string | null;
  fitScore: number;
  status: string;
  pipelineStatus: string;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  notes: string | null;
  createdAt: Date;
};

export default function LeadTable({
  campaignId,
  leads,
  unsubscribedEmails = [],
}: {
  campaignId: string;
  leads: Lead[];
  unsubscribedEmails?: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
            <th className="pb-3 pr-4 font-medium">Company</th>
            <th className="pb-3 pr-4 font-medium">Email</th>
            <th className="pb-3 pr-4 font-medium">Industry</th>
            <th className="pb-3 pr-4 font-medium">Score</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Pipeline</th>
            <th className="pb-3 pr-4 font-medium">Last Contacted</th>
            <th className="pb-3 pr-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-zinc-800/50 last:border-0">
              <td className="py-3 pr-4 text-white font-medium">
                <div className="flex items-center gap-2">
                  {lead.companyName}
                  {lead.email && unsubscribedEmails.includes(lead.email) && (
                    <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                      Unsubscribed
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4 text-zinc-400 max-w-[140px] truncate">{lead.email}</td>
              <td className="py-3 pr-4 text-zinc-400">{lead.industry || "—"}</td>
              <td className="py-3 pr-4">
                {lead.fitScore > 0 ? (
                  <FitScoreBadge score={lead.fitScore} />
                ) : (
                  <span className="text-xs text-zinc-600">—</span>
                )}
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={lead.status} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={lead.pipelineStatus} />
              </td>
              <td className="py-3 pr-4 text-xs text-zinc-500 whitespace-nowrap">
                {lead.lastContactedAt
                  ? new Date(lead.lastContactedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </td>
              <td className="py-3">
                <div className="flex flex-col gap-1">
                  <AnalyzeLeadButton leadId={lead.id} />
                  {lead.status === "ANALYZED" && lead.fitScore >= 50 && (
                    <GenerateDraftButton
                      leadId={lead.id}
                      campaignId={campaignId}
                    />
                  )}
                  <PipelineActionButtons
                    leadId={lead.id}
                    campaignId={campaignId}
                    currentStatus={lead.pipelineStatus}
                  />
                  <Link
                    href={`/campaigns/${campaignId}/leads/${lead.id}/edit`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
