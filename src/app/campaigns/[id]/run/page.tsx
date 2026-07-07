import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import { CardSection } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import RunActions from "./actions";

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) notFound();

  const newLeads = await prisma.lead.count({ where: { campaignId: id, status: "NEW" } });
  const analyzedLeads = await prisma.lead.count({ where: { campaignId: id, status: "ANALYZED" } });
  const highFitLeads = await prisma.lead.count({ where: { campaignId: id, status: "ANALYZED", fitScore: { gte: campaign.minimumFitScore } } });
  const existingDrafts = await prisma.emailDraft.count({ where: { lead: { campaignId: id }, type: "INITIAL" } });

  const eligibleForAnalysis = newLeads;
  const eligibleForDraft = analyzedLeads - existingDrafts;
  const maxBulk = parseInt(process.env.AI_MAX_BULK_LEADS_PER_RUN || "25", 10);
  const groqKey = !!process.env.GROQ_API_KEY;

  return (
    <AppShell activePage="/campaigns" email={user.email || ""}>
      <div className="mb-6">
        <Link href={`/campaigns/${campaign.id}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; {campaign.name}</Link>
        <h1 className="text-2xl font-bold mt-1">Analyze + Generate Drafts</h1>
        <p className="text-sm text-zinc-500 mt-1">Run the recommended workflow for this campaign.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <CardSection title="Campaign Info">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-400">Niche</span><span className="text-zinc-300">{campaign.targetNiche}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Location</span><span className="text-zinc-300">{campaign.targetLocation}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Service</span><span className="text-zinc-300">{campaign.serviceToPitch}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Min fit score</span><span className="text-zinc-300">{campaign.minimumFitScore}</span></div>
          </div>
        </CardSection>

        <CardSection title="Eligible Leads">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-400">New (to analyze)</span><span className="text-white font-semibold">{eligibleForAnalysis}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Analyzed, no draft</span><span className="text-white font-semibold">{eligibleForDraft}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">High-fit</span><span className="text-emerald-400 font-semibold">{highFitLeads}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Max per run</span><span className="text-zinc-300">{maxBulk}</span></div>
          </div>
        </CardSection>
      </div>

      {!groqKey && (
        <Alert variant="warning" className="mb-6">
          No Groq API key set. AI will fall back to local deterministic rules. Results may be less accurate.
        </Alert>
      )}

      <Alert variant="info" className="mb-6">
        Analyze + Draft uses the combined flow: one AI call per lead for both analysis and draft generation. Rate limits apply: max {maxBulk} leads per run.
        <br />Already analyzed leads without drafts will also get drafts generated.
      </Alert>

      <RunActions
        campaignId={campaign.id}
        campaignName={campaign.name}
        eligibleForAnalysis={eligibleForAnalysis}
        eligibleForDraft={eligibleForDraft}
        maxBulk={maxBulk}
      />
    </AppShell>
  );
}
