import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getEmailDraftsByCampaignId,
  getEmailDraftStatsForCampaign,
} from "@/lib/email-drafts";
import { getTodaySendCountForCampaign } from "@/lib/sending";
import { getEmailProviderStatus } from "@/lib/email";
import { getSession } from "@/lib/auth/session";
import EmailDraftCard from "@/components/email-draft-card";
import { GenerateDraftsAllButton } from "@/components/generate-draft-buttons";
import SimulatedSendCard from "@/components/simulated-send-card";
import EmptyState from "@/components/empty-state";

export default async function EmailQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) notFound();

  const emailStatus = getEmailProviderStatus();

  const [drafts, stats, sentToday] = await Promise.all([
    getEmailDraftsByCampaignId(session.userId, campaignId),
    getEmailDraftStatsForCampaign(campaignId),
    getTodaySendCountForCampaign(session.userId, campaignId),
  ]);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <Link
              href={`/campaigns/${campaignId}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              &larr; {campaign.name}
            </Link>
            <h1 className="text-lg font-semibold mt-1">Email Queue</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/campaigns/${campaignId}/follow-ups`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Follow-ups
            </Link>
            <Link
              href={`/campaigns/${campaignId}/send-history`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Send History
            </Link>
            <Link
              href={`/campaigns/${campaignId}/leads`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              &larr; Leads
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <SimulatedSendCard
          campaignId={campaignId}
          campaignStatus={campaign.status}
          dailySendLimit={campaign.dailySendLimit}
          sentToday={sentToday}
          queuedCount={stats.queued}
          emailMode={emailStatus.mode}
          smtpConfigured={emailStatus.smtpConfigured}
        />

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            { label: "Draft", value: stats.draft, color: "text-yellow-400" },
            { label: "Queued", value: stats.queued, color: "text-blue-400" },
            { label: "Sent", value: stats.sent, color: "text-green-400" },
            {
              label: "Cancelled",
              value: stats.cancelled,
              color: "text-zinc-500",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">
            All Drafts
            {drafts.length > 0 && (
              <span className="text-zinc-600 ml-1">({drafts.length})</span>
            )}
          </h2>
          <GenerateDraftsAllButton campaignId={campaignId} />
        </div>

        {drafts.length === 0 ? (
          <EmptyState
            title="No email drafts yet"
            description="Analyze leads first, then generate drafts for high-fit leads."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {drafts.map((draft) => (
              <EmailDraftCard
                key={draft.id}
                draft={draft}
                campaignId={campaignId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
