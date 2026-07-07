import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import { getLaunchReadiness } from "@/lib/launch-readiness";
import { CardSection } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LinkButton } from "@/components/ui/button";
import StatusBadge from "@/components/status-badge";

function StatusDot({ status }: { status: "pass" | "warn" | "fail" }) {
  const colors = { pass: "bg-emerald-500", warn: "bg-yellow-500", fail: "bg-rose-500" };
  return <span className={`inline-block size-2 rounded-full ${colors[status]} shrink-0 mt-1`} />;
}

async function getLatestCampaign(userId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });
  if (!campaign) return null;

  const [highFit, drafts, queued, sentToday, followUpsDue] = await Promise.all([
    prisma.lead.count({ where: { campaignId: campaign.id, fitScore: { gte: 75 } } }),
    prisma.emailDraft.count({ where: { lead: { campaignId: campaign.id }, status: { in: ["DRAFT", "QUEUED"] } } }),
    prisma.emailDraft.count({ where: { lead: { campaignId: campaign.id }, status: "QUEUED" } }),
    prisma.emailSendLog.count({ where: { campaignId: campaign.id, status: "SENT", simulated: true, sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.lead.count({ where: { campaignId: campaign.id, pipelineStatus: { in: ["FOLLOW_UP", "INTERESTED", "REPLIED"] }, nextFollowUpAt: { lte: new Date() } } }),
  ]);

  return { campaign, highFit, drafts, queued, sentToday, followUpsDue };
}

export default async function LaunchPage() {
  const user = await requireUser();
  const readiness = await getLaunchReadiness(user.id);
  const latestCampaign = await getLatestCampaign(user.id);

  const sections: { id: string; title: string; items: typeof readiness.account }[] = [
    { id: "account", title: "Account Setup", items: readiness.account },
    { id: "ai", title: "AI Setup", items: readiness.ai },
    { id: "email", title: "Email Setup", items: readiness.email },
    { id: "campaign", title: "Campaign Setup", items: readiness.campaign },
    { id: "safety", title: "Safety Setup", items: readiness.safety },
  ];

  return (
    <AppShell activePage="/launch" email={user.email || ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Personal Launch Checklist</h1>
        <p className="text-sm text-zinc-500 mt-1">Use this checklist before sending real outreach.</p>
      </div>

      <Alert variant={readiness.overall === "ready" ? "success" : readiness.overall === "needs-work" ? "warning" : "danger"} className="mb-6">
        {readiness.overall === "ready" ? "✓ Ready — no blockers or warnings." : readiness.overall === "needs-work" ? `⚠ ${readiness.warningCount} warning(s) — review before sending real emails.` : `✗ ${readiness.blockerCount} blocker(s) — fix before launching. Next: ${readiness.recommendedNextAction}`}
      </Alert>

      {readiness.blockers.length > 0 && (
        <CardSection title="Blockers" className="border-rose-800/30 mb-6">
          <div className="space-y-1">
            {readiness.blockers.map((b, i) => (
              <p key={i} className="text-xs text-rose-400">&bull; {b}</p>
            ))}
          </div>
        </CardSection>
      )}

      {readiness.warnings.length > 0 && (
        <CardSection title="Warnings" className="border-yellow-800/30 mb-6">
          <div className="space-y-1">
            {readiness.warnings.map((w, i) => (
              <p key={i} className="text-xs text-yellow-400">&bull; {w}</p>
            ))}
          </div>
        </CardSection>
      )}

      <div className="space-y-6 mb-10">
        {sections.map((section) => (
          <CardSection key={section.id} title={section.title}>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <StatusDot status={item.status} />
                  <div className="flex-1 min-w-0">
                    <span className={item.status === "pass" ? "text-emerald-400" : item.status === "warn" ? "text-yellow-400" : "text-rose-400"}>{item.label}</span>
                    <span className="text-zinc-600 mx-1">&middot;</span>
                    <span className="text-zinc-500">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardSection>
        ))}
      </div>

      {/* Recommended first-use workflow */}
      <CardSection title="Recommended First Run" className="mb-6">
        <div className="space-y-2">
          {[
            { step: "1", label: "Complete your profile", href: "/profile" },
            { step: "2", label: "Create one campaign", href: "/campaigns/new" },
            { step: "3", label: "Add 10-20 leads", href: "/campaigns" },
            { step: "4", label: "Run Analyze + Draft", href: "/campaigns" },
            { step: "5", label: "Review every draft manually", href: "/campaigns" },
            { step: "6", label: "Queue only the good ones", href: "/campaigns" },
            { step: "7", label: "Run simulated send first", href: "/campaigns" },
            { step: "8", label: "Check send history", href: "/campaigns" },
            { step: "9", label: "Switch SMTP only after testing", href: "/settings/email" },
            { step: "10", label: "Send 3-5 real emails first", href: "/settings/test-email" },
            { step: "11", label: "Track replies in pipeline", href: "/campaigns" },
            { step: "12", label: "Generate follow-ups only after 2+ days", href: "/campaigns" },
          ].map((item) => (
            <Link key={item.step} href={item.href} className="flex items-center gap-3 text-xs rounded-lg hover:bg-zinc-800/50 transition-colors p-1.5 -mx-1.5">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">{item.step}</span>
              <span className="text-zinc-300">{item.label}</span>
            </Link>
          ))}
        </div>
      </CardSection>

      {latestCampaign && (
        <CardSection title="Continue Latest Campaign">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">{latestCampaign.campaign.name}</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <StatusBadge status={latestCampaign.campaign.status} />
                <span className="text-xs text-zinc-500">{latestCampaign.campaign.targetNiche} &middot; {latestCampaign.campaign.targetLocation}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Leads", value: latestCampaign.campaign._count.leads },
              { label: "High-fit", value: latestCampaign.highFit, color: "text-emerald-400" },
              { label: "Drafts", value: latestCampaign.drafts, color: "text-yellow-400" },
              { label: "Queued", value: latestCampaign.queued, color: "text-blue-400" },
              { label: "Sent today", value: latestCampaign.sentToday, color: latestCampaign.sentToday > 0 ? "text-blue-400" : "text-zinc-500" },
              { label: "Follow-ups due", value: latestCampaign.followUpsDue, color: latestCampaign.followUpsDue > 0 ? "text-rose-400" : "text-zinc-500" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
                <p className={`text-sm font-bold ${stat.color || "text-white"}`}>{stat.value}</p>
                <p className="text-[10px] text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href={`/campaigns/${latestCampaign.campaign.id}`} variant="primary" size="sm">Open Campaign</LinkButton>
            <LinkButton href={`/campaigns/${latestCampaign.campaign.id}/leads`} variant="secondary" size="sm">Manage Leads</LinkButton>
            <LinkButton href={`/campaigns/${latestCampaign.campaign.id}/emails`} variant="secondary" size="sm">Review Emails</LinkButton>
            <LinkButton href={`/campaigns/${latestCampaign.campaign.id}/pipeline`} variant="secondary" size="sm">Pipeline</LinkButton>
          </div>
        </CardSection>
      )}
    </AppShell>
  );
}
