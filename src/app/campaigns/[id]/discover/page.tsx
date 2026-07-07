import { notFound } from "next/navigation";
import { getCampaignById } from "@/lib/campaigns";
import { generateSearchQueriesForCampaign } from "@/lib/lead-discovery";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import DiscoverClient from "./discover-client";
import SearchQueryList from "./search-queries";

export default async function DiscoverPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const campaign = await getCampaignById(user.id, id);
  if (!campaign) notFound();

  const queries = generateSearchQueriesForCampaign(campaign);

  return (
    <AppShell activePage="/campaigns" email={user.email || ""}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Lead Discovery Assistant</h1>
        <p className="text-sm text-zinc-500 mt-1">Generate search ideas, paste public business listings, and extract clean leads for <strong className="text-zinc-300">{campaign.name}</strong>.</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-8">
        <p className="text-xs text-zinc-500">
          Campaign: <span className="text-white">{campaign.name}</span>
          {" "}&middot;{" "}{campaign.targetNiche} &middot; {campaign.targetLocation}{" "}&middot;{" "}{campaign.serviceToPitch}
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-white mb-3">Search Query Ideas</h2>
        <p className="text-xs text-zinc-500 mb-4">Try these search queries on Google or other search engines to find public business listings.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {queries.map((q, i) => (<SearchQueryList key={i} query={q} />))}
        </div>
      </section>

      <DiscoverClient campaignId={id} />
    </AppShell>
  );
}
