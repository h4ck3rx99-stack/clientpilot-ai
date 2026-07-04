import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProfileSummaryCard from "@/components/profile-summary-card";

async function getMetrics() {
  const [totalCampaigns, totalLeads, emailsQueued, emailsSent] =
    await Promise.all([
      prisma.campaign.count(),
      prisma.lead.count(),
      prisma.emailDraft.count({ where: { status: "QUEUED" } }),
      prisma.emailDraft.count({ where: { status: "SENT" } }),
    ]);

  return { totalCampaigns, totalLeads, emailsQueued, emailsSent };
}

async function getRecentCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const metrics = await getMetrics();
  const recentCampaigns = await getRecentCampaigns();

  const cards = [
    { label: "Total campaigns", value: metrics.totalCampaigns },
    { label: "Total leads", value: metrics.totalLeads },
    { label: "Emails queued", value: metrics.emailsQueued },
    { label: "Emails sent", value: metrics.emailsSent },
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
            href="/campaigns/new"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            New Campaign
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <ProfileSummaryCard />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Recent campaigns</h2>
          {recentCampaigns.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
              <p className="text-sm text-zinc-500 mb-4">
                No campaigns yet. Create your first one.
              </p>
              <Link
                href="/campaigns/new"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
              >
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{c.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {c.targetNiche} &middot; {c.targetLocation} &middot;{" "}
                      {c.status}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      c.status === "ACTIVE"
                        ? "text-green-400 border-green-800 bg-green-950/50"
                        : c.status === "DRAFT"
                        ? "text-zinc-400 border-zinc-700 bg-zinc-800/50"
                        : "text-zinc-400 border-zinc-700 bg-zinc-800/50"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
