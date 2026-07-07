import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignById } from "@/lib/campaigns";
import { generateSearchQueriesForCampaign } from "@/lib/lead-discovery";
import DiscoverClient from "./discover-client";
import SearchQueryList from "./search-queries";

export default async function DiscoverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const queries = generateSearchQueriesForCampaign(campaign);

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">CP</div>
              <span className="font-semibold">ClientPilot AI</span>
            </Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
            <Link href={`/campaigns/${id}`} className="text-zinc-400 hover:text-white transition-colors">{campaign.name}</Link>
            <Link href={`/campaigns/${id}/discover`} className="text-white font-medium">Discover</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <Link href={`/campaigns/${id}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block">
          &larr; Back to campaign
        </Link>

        <h1 className="text-2xl font-bold mt-2">Lead Discovery Assistant</h1>
        <p className="text-sm text-zinc-500 mt-1 mb-6">
          Generate search ideas, paste public business listings, and extract clean leads for this campaign.
        </p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-8">
          <p className="text-xs text-zinc-500">
            Campaign: <span className="text-white">{campaign.name}</span>
            {" "}&middot;{" "}
            {campaign.targetNiche} &middot; {campaign.targetLocation}
            {" "}&middot;{" "}
            {campaign.serviceToPitch}
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-semibold text-white mb-3">Search Query Ideas</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Try these search queries on Google or other search engines to find public business listings.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {queries.map((q, i) => (
              <SearchQueryList key={i} query={q} />
            ))}
          </div>
        </section>

        <DiscoverClient campaignId={id} />
      </main>
    </div>
  );
}
