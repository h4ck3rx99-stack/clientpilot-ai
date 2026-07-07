import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCampaignById } from "@/lib/campaigns";
import { getLeadsByCampaignId, getLeadCountForCampaign } from "@/lib/leads";
import LeadTable from "@/components/lead-table";
import EmptyState from "@/components/empty-state";
import { AnalyzeAllButton } from "@/components/analyze-buttons";
import { GenerateDraftsAllButton } from "@/components/generate-draft-buttons";
import { AnalyzeAndDraftAllButton } from "@/components/ai-lead-action-buttons";

export default async function CampaignLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const [leads, count, unsubscribed] = await Promise.all([
    getLeadsByCampaignId(id),
    getLeadCountForCampaign(id),
    prisma.unsubscribe.findMany({ select: { email: true } }),
  ]);
  const unsubscribedEmails = unsubscribed.map((u) => u.email);

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
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">Profile</Link>
          <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
          <Link href="/campaigns/new" className="text-zinc-400 hover:text-white transition-colors">New Campaign</Link>
          <Link href="/unsubscribes" className="text-zinc-400 hover:text-white transition-colors">Unsubscribes</Link>
          <Link href="/settings/ai" className="text-zinc-400 hover:text-white transition-colors">AI Settings</Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        <Link
          href={`/campaigns/${id}`}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block"
        >
          &larr; Back to campaign
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Leads ({count})</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Review business contacts added to this campaign before AI analysis.
            </p>
          </div>
          <div className="flex gap-3">
            {count > 0 && <AnalyzeAndDraftAllButton campaignId={id} />}
            {count > 0 && <AnalyzeAllButton campaignId={id} />}
            <GenerateDraftsAllButton campaignId={id} />
            <Link
              href={`/campaigns/${id}/leads/new`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
            >
              Add Lead
            </Link>
            <Link
              href={`/campaigns/${id}/leads/import`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Import CSV
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
          <p className="text-xs text-zinc-500">
            Campaign: <span className="text-white">{campaign.name}</span>
            {" "}&middot;{" "}
            {campaign.targetNiche} &middot; {campaign.targetLocation}
            {" "}&middot;{" "}
            {campaign.serviceToPitch}
          </p>
        </div>

        {leads.length === 0 ? (
          <EmptyState
            title="No leads added yet."
            description="Add public business contacts with source URLs before analysis."
            actionLabel="Add Lead"
            actionHref={`/campaigns/${id}/leads/new`}
          />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <LeadTable campaignId={id} leads={leads} unsubscribedEmails={unsubscribedEmails} />
          </div>
        )}
      </main>
    </>
  );
}
