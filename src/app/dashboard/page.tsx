import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics, getRecentCampaigns } from "@/lib/campaigns";
import { getRecentActivities } from "@/lib/lead-activity";
import { getEmailProviderStatus } from "@/lib/email";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import StatusBadge from "@/components/status-badge";
import EmptyState from "@/components/empty-state";
import { getOrCreateOnboardingState, getCompletedCount, isOnboardingComplete, getNextStep, ONBOARDING_STEP_LABELS } from "@/lib/onboarding";
import OnboardingDismissButton from "@/components/onboarding-dismiss-button";
import { getLaunchReadiness } from "@/lib/launch-readiness";
import { MetricCard } from "@/components/ui/metric-card";
import { CardSection } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";

function getLocalDateStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function computeNextAction(userId: string): Promise<{ label: string; href: string } | null> {
  const profile = await prisma.userProfile.findFirst({ where: { userId }, select: { id: true, businessName: true } });
  if (!profile || !profile.businessName) return { label: "Complete your profile", href: "/profile" };

  const campaignCount = await prisma.campaign.count({ where: { userId } });
  if (campaignCount === 0) return { label: "Create your first campaign", href: "/campaigns/new" };

  const leadCount = await prisma.lead.count({ where: { userId } });
  if (leadCount === 0) return { label: "Add or discover leads", href: `/campaigns` };

  const analyzedCount = await prisma.lead.count({ where: { userId, status: { in: ["ANALYZED", "REJECTED"] } } });
  if (analyzedCount === 0) return { label: "Analyze your leads", href: `/campaigns` };

  const highFit = await prisma.lead.count({ where: { userId, status: "ANALYZED", fitScore: { gte: 60 } } });
  const draftCount = await prisma.emailDraft.count({ where: { userId } });
  if (highFit > 0 && draftCount === 0) return { label: "Generate drafts", href: `/campaigns` };

  const queuedCount = await prisma.emailDraft.count({ where: { userId, status: "QUEUED" } });
  if (draftCount > 0 && queuedCount === 0) return { label: "Review and queue drafts", href: `/campaigns` };

  if (queuedCount > 0) return { label: "Run simulated send", href: `/campaigns` };

  const sentCount = await prisma.emailSendLog.count({ where: { userId, status: "SENT" } });
  if (sentCount > 0) return { label: "Track replies and follow-ups", href: `/campaigns` };

  return null;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const session = { userId: user.id, email: user.email || "" };
  const metrics = await getDashboardMetrics(session.userId);
  const nextAction = await computeNextAction(session.userId);

  const [
    recentCampaigns,
    sentTodayCount,
    recentActivities,
    repliedCount,
    followUpsDue,
    queuedCount,
  ] = await Promise.all([
    getRecentCampaigns(session.userId),
    prisma.emailSendLog.count({ where: { status: "SENT", simulated: true, sentAt: { gte: getLocalDateStart() } } }),
    getRecentActivities(session.userId, 5),
    prisma.lead.count({ where: { pipelineStatus: { not: "NOT_CONTACTED" } } }),
    prisma.lead.count({ where: { pipelineStatus: "REPLIED" } }),
    prisma.lead.count({ where: { pipelineStatus: "MEETING_BOOKED" } }),
    prisma.lead.count({ where: { pipelineStatus: "WON" } }),
    prisma.lead.count({ where: { nextFollowUpAt: { lte: new Date() }, pipelineStatus: { in: ["FOLLOW_UP", "INTERESTED", "REPLIED"] } } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.emailDraft.count({ where: { status: "QUEUED" } }),
  ]);

  const onboardingState = await getOrCreateOnboardingState(session.userId);
  const onboardingCompleted = isOnboardingComplete(onboardingState);
  const onboardingCompletedCount = getCompletedCount(onboardingState);
  const onboardingNextStep = getNextStep(onboardingState);

  const launchReadiness = await getLaunchReadiness(session.userId);

  return (
    <AppShell activePage="/dashboard" email={session.email}>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {!onboardingState.dismissed && !onboardingCompleted && (
        <CardSection className="border-indigo-800/30 bg-indigo-950/10 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-300">Finish setup</p>
              <p className="text-xs text-zinc-500 mt-1">{onboardingCompletedCount} of 7 complete &middot; Next: {onboardingNextStep ? ONBOARDING_STEP_LABELS[onboardingNextStep] : "—"}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <LinkButton href="/onboarding" variant="primary" size="sm">Continue Setup</LinkButton>
              <OnboardingDismissButton />
            </div>
          </div>
        </CardSection>
      )}

      {onboardingCompleted && !onboardingState.dismissed && (
        <CardSection className="border-emerald-800/30 bg-emerald-950/10 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-300">ClientPilot is ready.</p>
              <p className="text-xs text-zinc-500 mt-1">All 7 onboarding steps are complete.</p>
            </div>
            <OnboardingDismissButton />
          </div>
        </CardSection>
      )}

      {nextAction && (
        <CardSection className="border-indigo-800/30 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Next best action</p>
              <p className="text-sm font-semibold text-white mt-0.5">{nextAction.label}</p>
            </div>
            <LinkButton href={nextAction.href} variant="primary" size="sm">Go</LinkButton>
          </div>
        </CardSection>
      )}

      <CardSection className="border-zinc-800 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex size-3 rounded-full ${launchReadiness.overall === "ready" ? "bg-emerald-500" : launchReadiness.overall === "needs-work" ? "bg-yellow-500" : "bg-rose-500"}`} />
            <div>
              <p className="text-sm font-semibold text-white">Personal launch status</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {launchReadiness.overall === "ready" ? "Ready for outreach" : `${launchReadiness.blockerCount} blocker(s), ${launchReadiness.warningCount} warning(s)`}
                &middot; Next: {launchReadiness.recommendedNextAction}
              </p>
            </div>
          </div>
          <LinkButton href="/launch" variant="secondary" size="sm">Open Launch Checklist</LinkButton>
        </div>
      </CardSection>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Campaigns" value={metrics.totalCampaigns} />
        <MetricCard label="Leads" value={metrics.totalLeads} />
        <MetricCard label="High-fit" value={metrics.highFitLeads} color="text-emerald-400" />
        <MetricCard label="Drafts" value={metrics.draftsPending} color="text-yellow-400" />
        <MetricCard label="Queued" value={queuedCount} color="text-blue-400" />
        <MetricCard label="Sent today" value={sentTodayCount} color={sentTodayCount > 0 ? "text-blue-400" : "text-white"} />
        <MetricCard label="Follow-ups due" value={followUpsDue} color={followUpsDue > 0 ? "text-rose-400" : "text-white"} />
        <MetricCard label="Replies" value={repliedCount} color={repliedCount > 0 ? "text-green-400" : "text-white"} />
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Recent Campaigns</h2>
          <Link href="/campaigns" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
        </div>
        {recentCampaigns.length === 0 ? (
          <EmptyState title="No campaigns yet." description="Create your first one to get started." actionLabel="Create Campaign" actionHref="/campaigns/new" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentCampaigns.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="block">
                <CardSection>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white truncate">{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-zinc-500">{c.targetNiche} &middot; {c.targetLocation}</p>
                  <div className="flex gap-3 mt-2 text-[10px] text-zinc-600">
                    <span>{c._count.leads} leads</span>
                  </div>
                </CardSection>
              </Link>
            ))}
          </div>
        )}
      </section>

      {recentActivities.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">Recent Activity</h2>
          <CardSection>
            <div className="space-y-2">
              {recentActivities.map((a) => (
                <div key={a.id} className="flex items-start gap-3 text-xs border-b border-zinc-800/50 pb-2 last:border-0">
                  <Badge variant={a.type.includes("SENT") ? "success" : a.type.includes("FAILED") ? "danger" : a.type.includes("DRAFT") ? "info" : "default"}>
                    {a.type.replace(/_/g, " ")}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <span className="text-zinc-300">{a.lead.companyName}</span>
                    <span className="text-zinc-600 mx-1">&middot;</span>
                    <span className="text-zinc-500">{a.message}</span>
                  </div>
                  <span className="text-zinc-600 whitespace-nowrap">{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          </CardSection>
        </section>
      )}
    </AppShell>
  );
}
