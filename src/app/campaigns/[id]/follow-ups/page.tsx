import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import { getFollowUpCandidatesForCampaign, getFollowUpStatsForCampaign } from "@/lib/follow-ups";
import FollowUpClient from "./follow-up-client";
import EmptyState from "@/components/empty-state";
import StatusBadge from "@/components/status-badge";

export default async function FollowUpsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId, userId: user.id } });
  if (!campaign) notFound();

  const [stats, candidates, existingDrafts] = await Promise.all([
    getFollowUpStatsForCampaign(campaignId, user.id),
    getFollowUpCandidatesForCampaign(campaignId, user.id),
    prisma.emailDraft.findMany({
      where: { userId: user.id, lead: { campaignId }, type: "FOLLOW_UP" },
      orderBy: { createdAt: "desc" },
      include: { lead: { select: { companyName: true, email: true } } },
    }),
  ]);

  return (
    <AppShell activePage="/campaigns" email={user.email || ""}>
      <div className="mb-6">
        <Link href={`/campaigns/${campaignId}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; {campaign.name}</Link>
        <h1 className="text-2xl font-bold mt-1">Follow-up Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">Generate and review polite follow-up drafts for leads that need another touch.</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-8">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <span className="text-white font-medium">{campaign.name}</span>
          <span>&middot;</span>
          <span>{campaign.targetNiche}</span>
          <span>&middot;</span>
          <span>{campaign.serviceToPitch}</span>
          <span>&middot;</span>
          <StatusBadge status={campaign.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
            <p className="text-lg font-bold text-rose-400">{stats.due}</p>
            <p className="text-[10px] text-zinc-500">Follow-ups Due</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
            <p className="text-lg font-bold text-yellow-400">{stats.pendingReview}</p>
            <p className="text-[10px] text-zinc-500">Pending Review</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
            <p className="text-lg font-bold text-blue-400">{stats.queued}</p>
            <p className="text-[10px] text-zinc-500">Queued</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
            <p className="text-lg font-bold text-green-400">{stats.sent}</p>
            <p className="text-[10px] text-zinc-500">Sent</p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
            <p className="text-lg font-bold text-white">2</p>
            <p className="text-[10px] text-zinc-500">Limit / Lead</p>
          </div>
        </div>

        <div className="mt-4">
          <FollowUpClient campaignId={campaignId} />
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">Candidates ({candidates.length})</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4 pt-3 pl-5 font-medium">Company</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Pipeline</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Last Contacted</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Next Follow-up</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Existing FUs</th>
                    <th className="pb-3 pr-3 pt-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.leadId} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-3 pr-4 pl-5 text-white font-medium">{c.companyName}</td>
                      <td className="py-3 pr-4"><StatusBadge status={c.pipelineStatus} /></td>
                      <td className="py-3 pr-4 text-xs text-zinc-500">
                        {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-zinc-500">
                        {c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 pr-4 text-xs text-zinc-500">{c.existingFollowUpCount} / 2</td>
                      <td className="py-3 pr-3">
                        <FollowUpClient campaignId={campaignId} leadId={c.leadId} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">
          Existing Follow-up Drafts
          {existingDrafts.length > 0 && <span className="text-zinc-600 ml-1">({existingDrafts.length})</span>}
        </h2>
        {existingDrafts.length === 0 ? (
          <EmptyState title="No follow-up drafts yet." description="Generate follow-ups for leads that have been contacted." />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4 pt-3 pl-5 font-medium">Company</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Email</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">FU#</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Subject</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Status</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Created</th>
                    <th className="pb-3 pr-3 pt-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {existingDrafts.map((d) => (
                    <tr key={d.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-3 pr-4 pl-5 text-white font-medium">{d.lead.companyName}</td>
                      <td className="py-3 pr-4 text-zinc-400">{d.lead.email}</td>
                      <td className="py-3 pr-4 text-zinc-400">{d.followUpNumber}</td>
                      <td className="py-3 pr-4 text-zinc-300 max-w-[200px] truncate">{d.subject}</td>
                      <td className="py-3 pr-4"><StatusBadge status={d.status} /></td>
                      <td className="py-3 pr-4 text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3 pr-3">
                        <Link href={`/campaigns/${campaignId}/emails/${d.id}/edit`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Review/Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
