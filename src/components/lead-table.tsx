import Link from "next/link";
import StatusBadge from "./status-badge";

type Lead = {
  id: string;
  companyName: string;
  website: string | null;
  email: string | null;
  sourceUrl: string | null;
  industry: string | null;
  fitScore: number;
  status: string;
  createdAt: Date;
};

export default function LeadTable({
  campaignId,
  leads,
}: {
  campaignId: string;
  leads: Lead[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
            <th className="pb-3 pr-4 font-medium">Company</th>
            <th className="pb-3 pr-4 font-medium">Website</th>
            <th className="pb-3 pr-4 font-medium">Email</th>
            <th className="pb-3 pr-4 font-medium">Industry</th>
            <th className="pb-3 pr-4 font-medium">Score</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Created</th>
            <th className="pb-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-zinc-800/50 last:border-0">
              <td className="py-3 pr-4 text-white font-medium">
                {lead.companyName}
              </td>
              <td className="py-3 pr-4 text-zinc-400 max-w-[160px] truncate">
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    {lead.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </td>
              <td className="py-3 pr-4 text-zinc-400">{lead.email}</td>
              <td className="py-3 pr-4 text-zinc-400">{lead.industry || "—"}</td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${
                    lead.fitScore >= 70
                      ? "text-green-400 bg-green-950/50"
                      : lead.fitScore >= 40
                      ? "text-amber-400 bg-amber-950/50"
                      : "text-zinc-400 bg-zinc-800/50"
                  }`}
                >
                  {lead.fitScore}
                </span>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={lead.status} />
              </td>
              <td className="py-3 pr-4 text-zinc-500 whitespace-nowrap">
                {new Date(lead.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </td>
              <td className="py-3">
                <Link
                  href={`/campaigns/${campaignId}/leads/${lead.id}/edit`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
