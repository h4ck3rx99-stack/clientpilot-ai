import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getEmailDraftsByCampaignId, getEmailDraftStatsForCampaign } from "@/lib/email-drafts";
import { getTodaySendCountForCampaign } from "@/lib/sending";
import { getEmailProviderStatus } from "@/lib/email";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import EmailDraftCard from "@/components/email-draft-card";
import { GenerateDraftsAllButton } from "@/components/generate-draft-buttons";
import SimulatedSendCard from "@/components/simulated-send-card";
import EmptyState from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export default async function EmailQueuePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ status?: string; type?: string }> }) {
  const user = await requireUser();
  const { id: campaignId } = await params;
  const resolved = searchParams ? await searchParams : {};
  const query: { status?: string; type?: string } = resolved;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId, userId: user.id } });
  if (!campaign) notFound();

  const emailStatus = getEmailProviderStatus();
  const [allDrafts, stats, sentToday] = await Promise.all([
    getEmailDraftsByCampaignId(user.id, campaignId),
    getEmailDraftStatsForCampaign(campaignId, user.id),
    getTodaySendCountForCampaign(user.id, campaignId),
  ]);

  const hasSimulatedSend = await prisma.emailSendLog.count({ where: { userId: user.id, simulated: true } });

  let filteredDrafts = [...allDrafts];
  if (query.status && query.status !== "all") {
    filteredDrafts = filteredDrafts.filter((d) => d.status === query.status);
  }
  if (query.type && query.type !== "all") {
    filteredDrafts = filteredDrafts.filter((d) => d.type === query.type);
  }

  return (
    <AppShell activePage="/campaigns" email={user.email || ""}>
      <div className="mb-6">
        <Link href={`/campaigns/${campaignId}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; {campaign.name}</Link>
        <h1 className="text-2xl font-bold mt-1">Email Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">Review, queue, and send drafts. Only QUEUED drafts can be sent.</p>
      </div>

      <Alert variant="info" className="mb-6">
        Only QUEUED drafts can be sent. DRAFT means review pending. Cancelled drafts are discarded.
      </Alert>

      {emailStatus.mode === "smtp" && hasSimulatedSend === 0 && (
        <Alert variant="warning" className="mb-6">
          You have not run a simulated send yet. Run a simulated send before switching to real SMTP to avoid mistakes.
        </Alert>
      )}

      <SimulatedSendCard
        campaignId={campaignId}
        campaignStatus={campaign.status}
        dailySendLimit={campaign.dailySendLimit}
        sentToday={sentToday}
        queuedCount={stats.queued}
        emailMode={emailStatus.mode}
        smtpConfigured={emailStatus.smtpConfigured}
      />

      <div className="flex flex-wrap gap-3 items-center justify-between my-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Total {stats.total}</Badge>
          <Badge variant={stats.draft > 0 ? "warning" : "default"}>{stats.draft} draft</Badge>
          <Badge variant={stats.queued > 0 ? "info" : "default"}>{stats.queued} queued</Badge>
          <Badge variant={stats.sent > 0 ? "success" : "default"}>{stats.sent} sent</Badge>
          <Badge variant={stats.cancelled > 0 ? "danger" : "default"}>{stats.cancelled} cancelled</Badge>
        </div>
        <GenerateDraftsAllButton campaignId={campaignId} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <form method="GET" className="flex flex-wrap gap-2 items-center">
          <select name="status" defaultValue={query.status || "all"} className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="all">All status</option>
            <option value="DRAFT">Draft</option>
            <option value="QUEUED">Queued</option>
            <option value="SENT">Sent</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select name="type" defaultValue={query.type || "all"} className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="all">All types</option>
            <option value="INITIAL">Initial</option>
            <option value="FOLLOW_UP">Follow-up</option>
          </select>
          <button type="submit" className="h-8 rounded-lg bg-indigo-500 px-3 text-xs text-white hover:bg-indigo-400 transition-colors">Filter</button>
        </form>
      </div>

      {filteredDrafts.length === 0 ? (
        <EmptyState title={allDrafts.length === 0 ? "No email drafts yet" : "No drafts match filters"} description={allDrafts.length === 0 ? "Analyze leads first, then generate drafts for high-fit leads." : "Try adjusting your filters."} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDrafts.map((draft) => (
            <EmailDraftCard key={draft.id} draft={draft} campaignId={campaignId} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
