import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCampaignById } from "@/lib/campaigns";
import { getLeadCountForCampaign, getRecentLeadsForCampaign } from "@/lib/leads";
import { getEmailDraftStatsForCampaign } from "@/lib/email-drafts";
import { getTodaySendCountForCampaign } from "@/lib/sending";
import { getFollowUpStatsForCampaign } from "@/lib/follow-ups";
import StatusBadge from "@/components/status-badge";
import FitScoreBadge from "@/components/fit-score-badge";
import CampaignControls from "./campaign-controls";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    campaign,
    leadCount,
    recentLeads,
    leadStats,
    emailStats,
    sentToday,
    followUpStats,
  ] = await Promise.all([
    getCampaignById(id),
    getLeadCountForCampaign(id),
    getRecentLeadsForCampaign(id, 5),
    prisma.lead.aggregate({
      where: { campaignId: id },
      _avg: { fitScore: true },
    }),
    getEmailDraftStatsForCampaign(id),
    getTodaySendCountForCampaign(id),
    getFollowUpStatsForCampaign(id),
  ]);

  const analyzedCount = await prisma.lead.count({
    where: { campaignId: id, status: "ANALYZED" },
  });
  const rejectedCount = await prisma.lead.count({
    where: { campaignId: id, status: "REJECTED" },
  });
  const avgFit = leadStats._avg.fitScore ?? 0;

  const pipelineStats = {
    contacted: await prisma.lead.count({
      where: { campaignId: id, pipelineStatus: { not: "NOT_CONTACTED" } },
    }),
    replied: await prisma.lead.count({
      where: { campaignId: id, pipelineStatus: "REPLIED" },
    }),
    interested: await prisma.lead.count({
      where: { campaignId: id, pipelineStatus: "INTERESTED" },
    }),
    meetings: await prisma.lead.count({
      where: { campaignId: id, pipelineStatus: "MEETING_BOOKED" },
    }),
    won: await prisma.lead.count({
      where: { campaignId: id, pipelineStatus: "WON" },
    }),
    followUpsDue: await prisma.lead.count({
      where: {
        campaignId: id,
        nextFollowUpAt: { lte: new Date() },
        pipelineStatus: { in: ["FOLLOW_UP", "INTERESTED", "REPLIED"] },
      },
    }),
  };

  if (!campaign) {
    notFound();
  }

  const detailRows = [
    { label: "Name", value: campaign.name },
    { label: "Status", value: null, isStatus: true },
    { label: "Service to pitch", value: campaign.serviceToPitch },
    { label: "Target niche", value: campaign.targetNiche },
    { label: "Target location", value: campaign.targetLocation },
    { label: "Offer", value: campaign.offer },
    { label: "CTA", value: campaign.cta },
    { label: "Daily send limit", value: String(campaign.dailySendLimit) },
    { label: "Minimum fit score", value: String(campaign.minimumFitScore) },
  ];

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
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/campaigns"
            className="text-white font-medium"
          >
            Campaigns
          </Link>
          <Link
            href="/campaigns/new"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            New Campaign
          </Link>
          <Link
            href="/unsubscribes"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Unsubscribes
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/campaigns"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block"
            >
              &larr; Back to campaigns
            </Link>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
          </div>
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Edit
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Campaign Overview
          </h2>
          <div className="space-y-3">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 text-sm">
                <span className="text-zinc-500 w-36 shrink-0">
                  {row.label}
                </span>
                {row.isStatus ? (
                  <StatusBadge status={campaign.status} />
                ) : (
                  <span className="text-white">{row.value}</span>
                )}
              </div>
            ))}
            <div className="flex items-start gap-3 text-sm">
              <span className="text-zinc-500 w-36 shrink-0">Created</span>
              <span className="text-zinc-300">
                {new Date(campaign.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-zinc-500 w-36 shrink-0">Updated</span>
              <span className="text-zinc-300">
                {new Date(campaign.updatedAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <CampaignControls campaignId={campaign.id} status={campaign.status} />

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              Pipeline Preview
            </h2>
            <Link
              href={`/campaigns/${campaign.id}/pipeline`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open Pipeline
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-blue-400">{pipelineStats.contacted}</p>
              <p className="text-[10px] text-zinc-500">Contacted</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-green-400">{pipelineStats.replied}</p>
              <p className="text-[10px] text-zinc-500">Replied</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-purple-400">{pipelineStats.interested}</p>
              <p className="text-[10px] text-zinc-500">Interested</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-yellow-400">{pipelineStats.meetings}</p>
              <p className="text-[10px] text-zinc-500">Meetings</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-emerald-400">{pipelineStats.won}</p>
              <p className="text-[10px] text-zinc-500">Won</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-rose-400">{pipelineStats.followUpsDue}</p>
              <p className="text-[10px] text-zinc-500">Follow-ups Due</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              Follow-ups
            </h2>
            <Link
              href={`/campaigns/${campaign.id}/follow-ups`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open Follow-up Queue
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-rose-400">{followUpStats.due}</p>
              <p className="text-[10px] text-zinc-500">Due</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-yellow-400">{followUpStats.pendingReview}</p>
              <p className="text-[10px] text-zinc-500">Pending Review</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-blue-400">{followUpStats.queued}</p>
              <p className="text-[10px] text-zinc-500">Queued</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-sm font-bold text-green-400">{followUpStats.sent}</p>
              <p className="text-[10px] text-zinc-500">Sent</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              Leads ({leadCount})
            </h2>
            <Link
              href={`/campaigns/${campaign.id}/leads`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Manage Leads
            </Link>
          </div>

          {leadCount > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className="text-xs text-zinc-500">Analyzed</p>
                <p className="text-lg font-semibold text-green-400">{analyzedCount}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className="text-xs text-zinc-500">Rejected</p>
                <p className="text-lg font-semibold text-zinc-400">{rejectedCount}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className="text-xs text-zinc-500">Avg Score</p>
                <p className="text-lg font-semibold text-white">{Math.round(avgFit)}</p>
              </div>
            </div>
          )}

          {leadCount === 0 ? (
            <p className="text-sm text-zinc-500 mb-4">No leads added yet.</p>
          ) : (
            <div className="space-y-1.5 mb-4">
              {recentLeads.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-zinc-300">{l.companyName}</span>
                  <div className="flex items-center gap-2">
                    <FitScoreBadge score={l.fitScore} />
                    <StatusBadge status={l.status} />
                  </div>
                </div>
              ))}
              {leadCount > 5 && (
                <p className="text-xs text-zinc-600 pt-1">
                  +{leadCount - 5} more lead{leadCount - 5 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/campaigns/${campaign.id}/discover`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-emerald-700 px-3.5 text-xs font-medium text-emerald-400 hover:bg-emerald-950/30 transition-colors"
            >
              Discover Leads
            </Link>
            <Link
              href={`/campaigns/${campaign.id}/leads/new`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-3.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Add Lead Manually
            </Link>
            <Link
              href={`/campaigns/${campaign.id}/leads/import`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 px-3.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Import CSV
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              Email ({emailStats.total} drafts)
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href={`/campaigns/${campaign.id}/follow-ups`}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Follow-ups
              </Link>
              <Link
                href={`/campaigns/${campaign.id}/pipeline`}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Pipeline
              </Link>
              <Link
                href={`/campaigns/${campaign.id}/send-history`}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Send History
              </Link>
              <Link
                href={`/campaigns/${campaign.id}/emails`}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Review Queue
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Draft</p>
              <p className="text-lg font-semibold text-yellow-400">{emailStats.draft}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Queued</p>
              <p className="text-lg font-semibold text-blue-400">{emailStats.queued}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Sent</p>
              <p className="text-lg font-semibold text-green-400">{emailStats.sent}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Cancelled</p>
              <p className="text-lg font-semibold text-zinc-400">{emailStats.cancelled}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Sent Today</p>
              <p className="text-lg font-semibold text-blue-400">{sentToday}</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
              <p className="text-xs text-zinc-500">Remaining / Limit</p>
              <p className="text-lg font-semibold text-white">
                {Math.max(0, campaign.dailySendLimit - sentToday)} / {campaign.dailySendLimit}
              </p>
            </div>
          </div>

          {campaign.status !== "ACTIVE" && emailStats.queued > 0 && (
            <p className="text-xs text-yellow-400 mt-3">
              Emails only send when campaign status is ACTIVE.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
