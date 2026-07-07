import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCampaignById } from "@/lib/campaigns";
import { getLeadsByCampaignId } from "@/lib/leads";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import LeadTable from "@/components/lead-table";
import EmptyState from "@/components/empty-state";
import { AnalyzeAllButton } from "@/components/analyze-buttons";
import { GenerateDraftsAllButton } from "@/components/generate-draft-buttons";
import { AnalyzeAndDraftAllButton } from "@/components/ai-lead-action-buttons";
import { Badge } from "@/components/ui/badge";

export default async function CampaignLeadsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ status?: string; fit?: string; q?: string; sort?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const resolved = searchParams ? await searchParams : {};
  const query: { status?: string; fit?: string; q?: string; sort?: string } = resolved;
  const campaign = await getCampaignById(user.id, id);
  if (!campaign) notFound();

  const allLeads = await getLeadsByCampaignId(user.id, id);
  const count = allLeads.length;
  const unsubscribed = await prisma.unsubscribe.findMany({ select: { email: true } });
  const unsubscribedEmails = unsubscribed.map((u) => u.email);

  let filteredLeads = [...allLeads];

  if (query.q) {
    const q = query.q.toLowerCase();
    filteredLeads = filteredLeads.filter((l) => l.companyName.toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q));
  }
  if (query.status && query.status !== "all") {
    filteredLeads = filteredLeads.filter((l) => l.status === query.status);
  }
  if (query.fit === "high") {
    filteredLeads = filteredLeads.filter((l) => l.fitScore >= 75);
  } else if (query.fit === "medium") {
    filteredLeads = filteredLeads.filter((l) => l.fitScore >= 50 && l.fitScore < 75);
  } else if (query.fit === "low") {
    filteredLeads = filteredLeads.filter((l) => l.fitScore > 0 && l.fitScore < 50);
  }
  if (query.sort === "score-desc") {
    filteredLeads.sort((a, b) => b.fitScore - a.fitScore);
  } else if (query.sort === "alpha") {
    filteredLeads.sort((a, b) => a.companyName.localeCompare(b.companyName));
  } else {
    filteredLeads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const stats = {
    all: count,
    new: allLeads.filter((l) => l.status === "NEW").length,
    analyzed: allLeads.filter((l) => l.status === "ANALYZED").length,
    rejected: allLeads.filter((l) => l.status === "REJECTED").length,
    high: allLeads.filter((l) => l.fitScore >= 75).length,
  };

  return (
    <AppShell activePage="/campaigns" email={user.email || ""}>
      <div className="mb-6">
        <Link href={`/campaigns/${id}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; Back to campaign</Link>
        <h1 className="text-2xl font-bold mt-1">Leads</h1>
        <p className="text-sm text-zinc-500 mt-1">{campaign.name}</p>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500">Stats:</span>
          <Badge variant={stats.new > 0 ? "warning" : "default"}>{stats.new} new</Badge>
          <Badge variant={stats.analyzed > 0 ? "success" : "default"}>{stats.analyzed} analyzed</Badge>
          <Badge variant={stats.rejected > 0 ? "danger" : "default"}>{stats.rejected} rejected</Badge>
          <Badge variant="info">{stats.high} high-fit</Badge>
        </div>
        <div className="flex gap-2">
          <AnalyzeAndDraftAllButton campaignId={id} />
          <AnalyzeAllButton campaignId={id} />
          <GenerateDraftsAllButton campaignId={id} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <form method="GET" className="flex flex-wrap gap-2 items-center">
          <input name="q" defaultValue={query.q || ""} placeholder="Search company/email..." className="h-8 w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500" />
          <select name="status" defaultValue={query.status || "all"} className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="all">All status</option>
            <option value="NEW">New</option>
            <option value="ANALYZED">Analyzed</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select name="fit" defaultValue={query.fit || "all"} className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="all">All fit</option>
            <option value="high">High fit (75+)</option>
            <option value="medium">Medium fit (50-74)</option>
            <option value="low">Low fit (1-49)</option>
          </select>
          <select name="sort" defaultValue={query.sort || "newest"} className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-white focus:outline-none focus:border-indigo-500">
            <option value="newest">Newest</option>
            <option value="score-desc">Score high-low</option>
            <option value="alpha">Company A-Z</option>
          </select>
          <button type="submit" className="h-8 rounded-lg bg-indigo-500 px-3 text-xs text-white hover:bg-indigo-400 transition-colors">Filter</button>
        </form>
        <div className="flex gap-2">
          <Link href={`/campaigns/${id}/leads/new`} className="h-8 inline-flex items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors">Add Lead</Link>
          <Link href={`/campaigns/${id}/discover`} className="h-8 inline-flex items-center rounded-lg border border-emerald-700 px-3 text-xs text-emerald-400 hover:bg-emerald-950/30 transition-colors">Discover</Link>
          <a href={`/api/campaigns/${id}/export/leads`} className="h-8 inline-flex items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors">Export CSV</a>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <EmptyState title={count === 0 ? "No leads yet." : "No leads match your filters."} description={count === 0 ? "Add leads manually, import CSV, or use the discovery assistant." : "Try adjusting your filters."} actionLabel={count === 0 ? "Add Lead" : undefined} actionHref={count === 0 ? `/campaigns/${id}/leads/new` : undefined} />
      ) : (
        <LeadTable leads={filteredLeads} campaignId={id} unsubscribedEmails={unsubscribedEmails} />
      )}
    </AppShell>
  );
}
