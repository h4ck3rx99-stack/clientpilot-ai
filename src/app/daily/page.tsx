import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getEmailProviderStatus } from "@/lib/email";
import AppShell from "@/components/app-shell";
import { CardSection } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";

export default async function DailyPage() {
  const user = await requireUser();
  const emailStatus = getEmailProviderStatus();

  const now = new Date();

  const latestCampaign = await prisma.campaign.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true },
  });

  const [queuedEmails, followUpsDue, draftsPendingReview, interestedLeads, meetingsBooked, simulatedSendCount] = await Promise.all([
    prisma.emailDraft.count({ where: { userId: user.id, status: "QUEUED" } }),
    prisma.lead.count({ where: { userId: user.id, pipelineStatus: { in: ["FOLLOW_UP", "INTERESTED", "REPLIED"] }, nextFollowUpAt: { lte: now } } }),
    prisma.emailDraft.count({ where: { userId: user.id, status: "DRAFT" } }),
    prisma.lead.count({ where: { userId: user.id, pipelineStatus: "INTERESTED" } }),
    prisma.lead.count({ where: { userId: user.id, pipelineStatus: "MEETING_BOOKED" } }),
    prisma.emailSendLog.count({ where: { userId: user.id, simulated: true } }),
  ]);

  return (
    <AppShell activePage="/daily" email={user.email || ""}>
      <h1 className="text-2xl font-bold mb-6">Daily Outreach Routine</h1>

      {emailStatus.mode === "smtp" && simulatedSendCount === 0 && (
        <Alert variant="warning" className="mb-6">
          Run a simulated send before switching to real SMTP. Switch to simulation mode in settings to test first.
        </Alert>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
        {[
          { label: "Queued emails", value: queuedEmails, color: "text-blue-400" },
          { label: "Follow-ups due", value: followUpsDue, color: "text-rose-400" },
          { label: "Drafts pending review", value: draftsPendingReview, color: "text-yellow-400" },
          { label: "Interested leads", value: interestedLeads, color: "text-emerald-400" },
          { label: "Meetings booked", value: meetingsBooked, color: "text-indigo-400" },
          { label: "Daily cap", value: "500", color: "text-zinc-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-center">
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <CardSection title="Recommended Routine" className="mb-6">
        <div className="space-y-2">
          {[
            { step: "1", label: "Review new leads", detail: "Check for new leads added since last session." },
            { step: "2", label: "Analyze + draft up to bulk limit", detail: "Run Analyze + Draft on new leads." },
            { step: "3", label: "Edit drafts", detail: "Review and personalize each draft." },
            { step: "4", label: "Queue good drafts", detail: "Mark drafts as QUEUED when ready." },
            { step: "5", label: "Send / simulate within daily limit", detail: "Run sends within your configured limits." },
            { step: "6", label: "Update pipeline from replies", detail: "Move leads to REPLIED / INTERESTED / MEETING_BOOKED." },
            { step: "7", label: "Generate due follow-ups", detail: "Create follow-up drafts for leads needing another touch." },
            { step: "8", label: "Export backup at end of day", detail: "Download backup JSON in Settings > Backup." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 text-xs border-b border-zinc-800/50 pb-2 last:border-0">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">{item.step}</span>
              <div className="flex-1 min-w-0">
                <span className="text-zinc-300 font-medium">{item.label}</span>
                <p className="text-zinc-600 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </CardSection>

      <CardSection title="Quick Links">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {latestCampaign && (
            <LinkButton href={`/campaigns/${latestCampaign.id}`} size="sm" variant="primary">{latestCampaign.name}</LinkButton>
          )}
          <LinkButton href="/campaigns" size="sm" variant="secondary">All Campaigns</LinkButton>
          <LinkButton href="/campaigns" size="sm" variant="secondary">Review Emails</LinkButton>
          <LinkButton href="/campaigns" size="sm" variant="secondary">Follow-ups</LinkButton>
          <LinkButton href="/campaigns" size="sm" variant="secondary">Pipeline</LinkButton>
          <LinkButton href="/settings/backup" size="sm" variant="secondary">Backup</LinkButton>
        </div>
        <p className="text-xs text-zinc-600 mt-3">
          Select a specific campaign from the campaigns page to review its emails, follow-ups, and pipeline.
        </p>
      </CardSection>
    </AppShell>
  );
}
