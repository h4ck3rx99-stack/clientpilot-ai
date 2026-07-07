import Link from "next/link";
import { redirect } from "next/navigation";
import { getCampaigns } from "@/lib/campaigns";
import { getSession } from "@/lib/auth/session";
import CampaignCard from "@/components/campaign-card";
import EmptyState from "@/components/empty-state";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const campaigns = await getCampaigns(session.userId);

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
            <Link
              href="/settings/ai"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              AI Settings
            </Link>
            <Link
              href="/settings/email"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Email Settings
            </Link>
          </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Manage your outreach campaigns and prepare high-fit leads for
              review.
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors shrink-0"
          >
            New Campaign
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet."
            description="Create your first campaign to start finding best-fit businesses."
            actionLabel="Create Campaign"
            actionHref="/campaigns/new"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
