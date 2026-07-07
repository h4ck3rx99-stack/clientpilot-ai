import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCampaignById } from "@/lib/campaigns";
import { getEmailDraftStatsForCampaign } from "@/lib/email-drafts";
import { getTodaySendCountForCampaign } from "@/lib/sending";
import { getFollowUpStatsForCampaign } from "@/lib/follow-ups";
import { requireUser } from "@/lib/auth/session";
import { getEmailProviderStatus } from "@/lib/email";
import AppShell from "@/components/app-shell";
import StatusBadge from "@/components/status-badge";
import FitScoreBadge from "@/components/fit-score-badge";
import CampaignControls from "./campaign-controls";
import { Card, CardSection } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const [campaign, emailStats, sentToday, followUpStats] = await Promise.all([
    getCampaignById(user.id, id),
    getEmailDraftStatsForCampaign(id),
    getTodaySendCountForCampaign(user.id, id),
    getFollowUpStatsForCampaign(id),
  ]);
  if (!campaign) notFound();

  const emailStatus = getEmailProviderStatus();
  const profile = await prisma.userProfile.findFirst({ where: { userId: user.id }, select: { businessName: true, senderName: true } });
  const profileReady = !!(profile?.businessName && profile?.senderName);

  const leadCount = await prisma.lead.count({ where: { campaignId: id } });
  const analyzedCount = await prisma.lead.count({ where: { campaignId: id, status: { in: ["ANALYZED", "REJECTED"] } } });
  const highFitCount = await prisma.lead.count({ where: { campaignId: id, status: "ANALYZED", fitScore: { gte: 60 } } });
  const draftCount = emailStats.total;
  const queuedCount = emailStats.queued;

  const workflowSteps = [
    { label: "Leads added", done: leadCount > 0, count: leadCount },
    { label: "Leads analyzed", done: analyzedCount > 0, count: analyzedCount },
    { label: "Drafts generated", done: draftCount > 0, count: draftCount },
    { label: "Drafts queued", done: queuedCount > 0, count: queuedCount },
    { label: "Emails sent", done: emailStats.sent > 0, count: emailStats.sent },
  ];

  const pipelineStats = {
    contacted: await prisma.lead.count({ where: { campaignId: id, pipelineStatus: { not: "NOT_CONTACTED" } } }),
    replied: await prisma.lead.count({ where: { campaignId: id, pipelineStatus: "REPLIED" } }),
    interested: await prisma.lead.count({ where: { campaignId: id, pipelineStatus: "INTERESTED" } }),
    meetings: await prisma.lead.count({ where: { campaignId: id, pipelineStatus: "MEETING_BOOKED" } }),
    won: await prisma.lead.count({ where: { campaignId: id, pipelineStatus: "WON" } }),
    followUpsDue: await prisma.lead.count({ where: { campaignId: id, nextFollowUpAt: { lte: new Date() }, pipelineStatus: { in: ["FOLLOW_UP", "INTERESTED", "REPLIED"] } } }),
  };

  return (
    <AppShell activePage="/campaigns" email={user.email || ""}>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <Link href="/campaigns" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; Back to campaigns</Link>
          <h1 className="text-2xl font-bold mt-1">{campaign.name}</h1>
          <p className="text-xs text-zinc-500 mt-1">{campaign.targetNiche} &middot; {campaign.targetLocation}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <LinkButton href={`/campaigns/${campaign.id}/discover`} variant="secondary" size="sm">Discover Leads</LinkButton>
        <LinkButton href={`/campaigns/${campaign.id}/leads`} variant="secondary" size="sm">Manage Leads</LinkButton>
        <LinkButton href={`/campaigns/${campaign.id}/run`} variant="primary" size="sm">Analyze + Draft</LinkButton>
        <LinkButton href={`/campaigns/${campaign.id}/emails`} variant="secondary" size="sm">Review Emails</LinkButton>
        <LinkButton href={`/campaigns/${campaign.id}/pipeline`} variant="secondary" size="sm">Pipeline</LinkButton>
        <LinkButton href={`/campaigns/${campaign.id}/follow-ups`} variant="secondary" size="sm">Follow-ups</LinkButton>
        <LinkButton href={`/campaigns/${campaign.id}/send-history`} variant="secondary" size="sm">Send History</LinkButton>
        <LinkButton href={`/campaigns/${campaign.id}/edit`} variant="ghost" size="sm">Edit</LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Campaign Health */}
        <CardSection title="Campaign Health">
          <div className="space-y-2 text-xs">
            <HealthRow label="Profile ready" ok={profileReady} />
            <HealthRow label="AI configured" ok={!!process.env.GROQ_API_KEY} detail={process.env.GROQ_API_KEY ? "Groq" : "Fallback"} />
            <HealthRow label="Email mode" ok={emailStatus.mode === "simulation" || emailStatus.smtpConfigured} detail={emailStatus.mode} />
            <HealthRow label="Campaign active" ok={campaign.status === "ACTIVE"} />
            <HealthRow label="Leads" value={leadCount} />
            <HealthRow label="High-fit leads" value={highFitCount} ok={highFitCount > 0} />
            <HealthRow label="Queued emails" value={queuedCount} ok={queuedCount > 0} />
            <HealthRow label="Sent today" value={sentToday} />
            <HealthRow label="Follow-ups due" value={pipelineStats.followUpsDue} ok={pipelineStats.followUpsDue === 0} />
          </div>
        </CardSection>

        {/* Workflow Progress */}
        <CardSection title="Workflow Progress">
          <div className="space-y-3">
            {workflowSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${
                  step.done ? "border-emerald-700 bg-emerald-950/30" : "border-zinc-700 bg-zinc-800/50"
                }`}>
                  {step.done ? <span className="text-[10px] text-emerald-400">&#10003;</span> : <span className="text-[10px] text-zinc-500">{step.count || 0}</span>}
                </div>
                <span className={`text-xs ${step.done ? "text-zinc-300" : "text-zinc-500"}`}>{step.label}</span>
                <span className="text-[10px] text-zinc-600 ml-auto">{step.count}</span>
              </div>
            ))}
          </div>
        </CardSection>
      </div>

      {/* Leads Section */}
      <CardSection title={`Leads (${leadCount})`} className="mb-6">
        {leadCount === 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">No leads added yet.</p>
            <div className="flex gap-2">
              <LinkButton href={`/campaigns/${campaign.id}/discover`} variant="secondary" size="sm">Discover Leads</LinkButton>
              <LinkButton href={`/campaigns/${campaign.id}/leads/new`} variant="secondary" size="sm">Add Manually</LinkButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Analyzed</p>
              <p className="text-lg font-semibold text-green-400">{analyzedCount}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">High-fit</p>
              <p className="text-lg font-semibold text-emerald-400">{highFitCount}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">New</p>
              <p className="text-lg font-semibold text-amber-400">{Math.max(0, leadCount - analyzedCount)}</p>
            </div>
          </div>
        )}
        <LinkButton href={`/campaigns/${campaign.id}/leads`} variant="secondary" size="sm">Manage Leads</LinkButton>
      </CardSection>

      {/* Email + Pipeline + Follow-ups */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <CardSection title={`Emails (${draftCount})`}>
          <div className="grid grid-cols-2 gap-2 text-center mb-3">
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Draft</p><p className="text-sm font-semibold text-yellow-400">{emailStats.draft}</p></div>
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Queued</p><p className="text-sm font-semibold text-blue-400">{queuedCount}</p></div>
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Sent</p><p className="text-sm font-semibold text-green-400">{emailStats.sent}</p></div>
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Sent Today</p><p className="text-sm font-semibold text-blue-400">{sentToday}</p></div>
          </div>
          <LinkButton href={`/campaigns/${campaign.id}/emails`} variant="secondary" size="sm">Review Queue</LinkButton>
        </CardSection>

        <CardSection title="Pipeline">
          <div className="grid grid-cols-2 gap-2 text-center mb-3">
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Contacted</p><p className="text-sm font-semibold text-blue-400">{pipelineStats.contacted}</p></div>
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Replied</p><p className="text-sm font-semibold text-green-400">{pipelineStats.replied}</p></div>
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Interested</p><p className="text-sm font-semibold text-purple-400">{pipelineStats.interested}</p></div>
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Won</p><p className="text-sm font-semibold text-emerald-400">{pipelineStats.won}</p></div>
          </div>
          <LinkButton href={`/campaigns/${campaign.id}/pipeline`} variant="secondary" size="sm">Open Pipeline</LinkButton>
        </CardSection>

        <CardSection title="Follow-ups">
          <div className="grid grid-cols-2 gap-2 text-center mb-3">
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Due</p><p className="text-sm font-semibold text-rose-400">{followUpStats.due}</p></div>
            <div className="rounded-lg bg-zinc-800/50 p-2"><p className="text-xs text-zinc-500">Queued</p><p className="text-sm font-semibold text-blue-400">{followUpStats.queued}</p></div>
          </div>
          <LinkButton href={`/campaigns/${campaign.id}/follow-ups`} variant="secondary" size="sm">Open Follow-ups</LinkButton>
        </CardSection>
      </div>

      {/* Export + Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <a href={`/api/campaigns/${campaign.id}/export/leads`} className="inline-flex h-8 items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors">Export Leads CSV</a>
          <a href={`/api/campaigns/${campaign.id}/export/drafts`} className="inline-flex h-8 items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors">Export Drafts CSV</a>
          <a href={`/api/campaigns/${campaign.id}/export/pipeline`} className="inline-flex h-8 items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors">Export Pipeline CSV</a>
        </div>
        <CampaignControls campaignId={campaign.id} status={campaign.status} />
      </div>
    </AppShell>
  );
}

function HealthRow({ label, ok, value, detail }: { label: string; ok?: boolean; value?: number; detail?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      {value !== undefined ? (
        <span className="text-white font-mono">{value}</span>
      ) : (
        <span className={ok ? "text-emerald-400" : "text-rose-400"}>
          {ok ? "OK" : "Missing"}
          {detail && <span className="text-zinc-500 ml-1">({detail})</span>}
        </span>
      )}
    </div>
  );
}
