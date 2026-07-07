import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCampaignById } from "@/lib/campaigns";
import { getLeadById } from "@/lib/leads";
import { getLeadActivities } from "@/lib/lead-activity";
import { getSession } from "@/lib/auth/session";
import { scoreLeadQuality } from "@/lib/lead-quality";
import LeadForm from "@/components/lead-form";
import LeadManageForm from "@/components/lead-manage-form";
import ActivityTimeline from "@/components/activity-timeline";
import FitScoreBadge from "@/components/fit-score-badge";
import StatusBadge from "@/components/status-badge";
import ScoreBreakdownCard from "@/components/score-breakdown-card";
import { ReanalyzeButton } from "./reanalyze-button";
import type { ScoreBreakdown } from "@/lib/scoring";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string; leadId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id, leadId } = await params;
  const [campaign, lead] = await Promise.all([
    getCampaignById(session.userId, id),
    getLeadById(session.userId, leadId),
  ]);

  if (!campaign || !lead) notFound();

  let parsedBreakdown: ScoreBreakdown | null = null;
  if (lead.scoreBreakdown) {
    try {
      parsedBreakdown = JSON.parse(lead.scoreBreakdown);
    } catch {
      parsedBreakdown = null;
    }
  }

  const activities = await getLeadActivities(leadId);

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              CP
            </div>
            <span className="text-sm font-semibold">ClientPilot AI</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">Profile</Link>
          <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
          <Link href="/campaigns/new" className="text-zinc-400 hover:text-white transition-colors">New Campaign</Link>
          <Link href="/unsubscribes" className="text-zinc-400 hover:text-white transition-colors">Unsubscribes</Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <Link
          href={`/campaigns/${id}/leads`}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block"
        >
          &larr; Back to leads
        </Link>
        <h1 className="text-2xl font-bold mb-1">{lead.companyName}</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Update contact info, pipeline status, notes, and follow-up.
        </p>

        {parsedBreakdown && lead.fitScore > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">
                Analysis Summary
              </h2>
              <ReanalyzeButton leadId={lead.id} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <FitScoreBadge score={lead.fitScore} />
              <StatusBadge status={lead.status} />
              <StatusBadge status={lead.pipelineStatus} />
            </div>
            <div className="space-y-3 text-sm mb-4">
              {lead.industry && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Industry</span>
                  <span className="text-white">{lead.industry}</span>
                </div>
              )}
              {lead.painPoint && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Pain point</span>
                  <span className="text-zinc-300">{lead.painPoint}</span>
                </div>
              )}
              {lead.offerAngle && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Offer angle</span>
                  <span className="text-zinc-300">{lead.offerAngle}</span>
                </div>
              )}
              {lead.personalizationLine && (
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">Personalization</span>
                  <span className="text-zinc-300">{lead.personalizationLine}</span>
                </div>
              )}
            </div>
            <ScoreBreakdownCard breakdown={parsedBreakdown} />
          </div>
        )}

        {(!parsedBreakdown || lead.fitScore === 0) && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6 flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              This lead has not been analyzed yet.
            </p>
            <ReanalyzeButton leadId={lead.id} />
          </div>
        )}

        {/* Lead Quality */}
        {(() => {
          const leadQuality = scoreLeadQuality({
            companyName: lead.companyName,
            website: lead.website,
            email: lead.email,
            sourceUrl: lead.sourceUrl,
            industry: lead.industry,
            personalizationLine: lead.personalizationLine,
            fitScore: lead.fitScore,
          });
          return (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">Lead Quality</h2>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  leadQuality.score >= 80 ? "border border-emerald-700/50 bg-emerald-950/30 text-emerald-400" :
                  leadQuality.score >= 50 ? "border border-yellow-700/50 bg-yellow-950/30 text-yellow-400" :
                  "border border-rose-700/50 bg-rose-950/30 text-rose-400"
                }`}>
                  {leadQuality.score}/100
                </span>
              </div>
              {leadQuality.warnings.length > 0 && (
                <div className="space-y-1">
                  {leadQuality.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-rose-400 flex items-start gap-1.5">
                      <span className="mt-0.5 shrink-0">&#9888;</span>
                      <span>{w}</span>
                    </p>
                  ))}
                </div>
              )}
              {leadQuality.warnings.length === 0 && (
                <p className="text-xs text-emerald-400">All checks passed.</p>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">
              Pipeline &amp; Notes
            </h2>
            <LeadManageForm
              leadId={lead.id}
              campaignId={id}
              initial={{
                pipelineStatus: lead.pipelineStatus,
                notes: lead.notes,
                nextFollowUpAt: lead.nextFollowUpAt
                  ? new Date(
                      lead.nextFollowUpAt.getTime() -
                        lead.nextFollowUpAt.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16)
                  : null,
              }}
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h2 className="text-sm font-semibold text-white mb-4">
              Activity Timeline
            </h2>
            <ActivityTimeline activities={activities} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Contact Info
          </h2>
          <LeadForm
            campaignId={id}
            lead={{
              id: lead.id,
              companyName: lead.companyName,
              website: lead.website ?? undefined,
              email: lead.email ?? undefined,
              sourceUrl: lead.sourceUrl ?? undefined,
              industry: lead.industry ?? undefined,
              painPoint: lead.painPoint ?? undefined,
              offerAngle: lead.offerAngle ?? undefined,
              personalizationLine: lead.personalizationLine ?? undefined,
              fitScore: lead.fitScore,
              status: lead.status,
            }}
          />
        </div>
      </main>
    </>
  );
}
