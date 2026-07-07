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

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-8">
        <h2 className="text-sm font-semibold text-white mb-3">How to use this</h2>
        <ol className="space-y-1.5 text-xs text-zinc-400">
          <li>1. Copy one search query below.</li>
          <li>2. Search manually on Google or your preferred directory.</li>
          <li>3. Open public business or contact pages.</li>
          <li>4. Paste the listing text into the text area below.</li>
          <li>5. Add the source URL for each listing.</li>
          <li>6. Review extracted leads before saving.</li>
        </ol>
        <p className="text-xs text-zinc-600 mt-3">
          This does not scrape websites automatically. You control what data gets pasted and saved.
        </p>
      </section>

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
