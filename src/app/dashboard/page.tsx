import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics, getRecentCampaigns } from "@/lib/campaigns";
import { getRecentActivities } from "@/lib/lead-activity";
import ProfileSummaryCard from "@/components/profile-summary-card";
import StatusBadge from "@/components/status-badge";
import EmptyState from "@/components/empty-state";

function getLocalDateStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  const [
    recentCampaigns,
    sentTodayCount,
    unsubCount,
    recentSends,
    recentActivities,
    contactedCount,
    repliedCount,
    meetingsCount,
    wonCount,
    followUpsDue,
  ] = await Promise.all([
    getRecentCampaigns(),
    prisma.emailSendLog.count({
      where: {
        status: "SENT",
        simulated: true,
        sentAt: { gte: getLocalDateStart() },
      },
    }),
    prisma.unsubscribe.count(),
    prisma.emailSendLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        lead: { select: { companyName: true } },
        campaign: { select: { name: true, id: true } },
      },
    }),
    getRecentActivities(5),
    prisma.lead.count({
      where: { pipelineStatus: { not: "NOT_CONTACTED" } },
    }),
    prisma.lead.count({
      where: { pipelineStatus: "REPLIED" },
    }),
    prisma.lead.count({
      where: { pipelineStatus: "MEETING_BOOKED" },
    }),
    prisma.lead.count({
      where: { pipelineStatus: "WON" },
    }),
    prisma.lead.count({
      where: {
        nextFollowUpAt: { lte: new Date() },
        pipelineStatus: { in: ["FOLLOW_UP", "INTERESTED", "REPLIED"] },
      },
    }),
  ]);

  const cards = [
    { label: "Total campaigns", value: metrics.totalCampaigns },
    { label: "Total leads", value: metrics.totalLeads },
    { label: "High-fit leads", value: metrics.highFitLeads },
    { label: "Drafts pending", value: metrics.draftsPending },
    {
      label: "Sent today",
      value: sentTodayCount,
      color: sentTodayCount > 0 ? "text-blue-400" : "text-white",
    },
    {
      label: "Unsubscribed",
      value: unsubCount,
      color: unsubCount > 0 ? "text-red-400" : "text-white",
    },
    {
      label: "Contacted",
      value: contactedCount,
      color: contactedCount > 0 ? "text-blue-400" : "text-white",
    },
    {
      label: "Replies",
      value: repliedCount,
      color: repliedCount > 0 ? "text-green-400" : "text-white",
    },
    {
      label: "Meetings",
      value: meetingsCount,
      color: meetingsCount > 0 ? "text-yellow-400" : "text-white",
    },
    {
      label: "Won",
      value: wonCount,
      color: wonCount > 0 ? "text-emerald-400" : "text-white",
    },
    {
      label: "Follow-ups due",
      value: followUpsDue,
      color: followUpsDue > 0 ? "text-rose-400" : "text-white",
    },
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
            className="text-white font-medium"
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
            className="text-zinc-400 hover:text-white transition-colors"
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

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p
                className={`text-3xl font-bold ${
                  card.color || "text-white"
                }`}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <ProfileSummaryCard />
        </section>

        {recentSends.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Recent Send Activity</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      <th className="pb-3 pr-4 pt-3 pl-5 font-medium">
                        Recipient
                      </th>
                      <th className="pb-3 pr-4 pt-3 font-medium">Status</th>
                      <th className="pb-3 pr-4 pt-3 font-medium">Campaign</th>
                      <th className="pb-3 pr-3 pt-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSends.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-zinc-800/50 last:border-0"
                      >
                        <td className="py-3 pr-4 pl-5 text-white">
                          {log.lead.companyName}
                          <span className="text-zinc-500 ml-1">
                            ({log.recipientEmail})
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/campaigns/${log.campaign.id}`}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs"
                          >
                            {log.campaign.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 text-zinc-500 whitespace-nowrap text-xs">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {recentActivities.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      <th className="pb-3 pr-4 pt-3 pl-5 font-medium">Date</th>
                      <th className="pb-3 pr-4 pt-3 font-medium">Type</th>
                      <th className="pb-3 pr-4 pt-3 font-medium">Lead</th>
                      <th className="pb-3 pr-4 pt-3 font-medium">Campaign</th>
                      <th className="pb-3 pr-3 pt-3 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivities.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-zinc-800/50 last:border-0"
                      >
                        <td className="py-3 pr-4 pl-5 text-zinc-500 whitespace-nowrap text-xs">
                          {new Date(a.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs text-zinc-400 uppercase tracking-wider">
                            {a.type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-white text-xs">
                          {a.lead.companyName}
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/campaigns/${a.campaign.id}`}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs"
                          >
                            {a.campaign.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 text-xs text-zinc-400 max-w-[200px] truncate">
                          {a.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent campaigns</h2>
            <Link
              href="/campaigns"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <EmptyState
              title="No campaigns yet."
              description="Create your first one to get started."
              actionLabel="Create Campaign"
              actionHref="/campaigns/new"
            />
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.id}`}>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between hover:bg-zinc-900/80 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {c.name}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {c.targetNiche} &middot; {c.targetLocation}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
