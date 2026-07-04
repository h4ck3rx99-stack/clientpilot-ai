import Link from "next/link";
import { getDashboardMetrics, getRecentCampaigns } from "@/lib/campaigns";
import ProfileSummaryCard from "@/components/profile-summary-card";
import StatusBadge from "@/components/status-badge";
import EmptyState from "@/components/empty-state";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const recentCampaigns = await getRecentCampaigns();

  const cards = [
    { label: "Total campaigns", value: metrics.totalCampaigns },
    { label: "Total leads", value: metrics.totalLeads },
    { label: "High-fit leads", value: metrics.highFitLeads },
    { label: "Emails queued", value: metrics.emailsQueued },
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
