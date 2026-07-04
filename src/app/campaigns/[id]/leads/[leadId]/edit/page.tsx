import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignById } from "@/lib/campaigns";
import { getLeadById } from "@/lib/leads";
import LeadForm from "@/components/lead-form";

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string; leadId: string }>;
}) {
  const { id, leadId } = await params;
  const [campaign, lead] = await Promise.all([
    getCampaignById(id),
    getLeadById(leadId),
  ]);

  if (!campaign || !lead) notFound();

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
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <Link
          href={`/campaigns/${id}/leads`}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block"
        >
          &larr; Back to leads
        </Link>
        <h1 className="text-2xl font-bold mb-1">Edit Lead</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Update contact information for {lead.companyName}.
        </p>

        <LeadForm
          campaignId={id}
          lead={{
            id: lead.id,
            companyName: lead.companyName,
            website: lead.website ?? undefined,
            email: lead.email ?? undefined,
            sourceUrl: lead.sourceUrl ?? undefined,
            industry: lead.industry ?? undefined,
            painPoint: lead.painPoint ?? undefined,
            offerAngle: lead.offerAngle ?? undefined,
            personalizationLine: lead.personalizationLine ?? undefined,
            fitScore: lead.fitScore,
            status: lead.status,
          }}
        />
      </main>
    </>
  );
}
