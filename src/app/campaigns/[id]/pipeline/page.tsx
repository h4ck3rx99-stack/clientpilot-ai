import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import PipelineColumn from "./pipeline-column";
import { Badge } from "@/components/ui/badge";

const PIPELINE_COLUMNS = [
  "NOT_CONTACTED", "CONTACTED", "REPLIED", "INTERESTED",
  "FOLLOW_UP", "MEETING_BOOKED", "WON", "LOST", "NOT_INTERESTED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted", CONTACTED: "Contacted", REPLIED: "Replied",
  INTERESTED: "Interested", FOLLOW_UP: "Follow Up", MEETING_BOOKED: "Meeting Booked",
  WON: "Won", LOST: "Lost", NOT_INTERESTED: "Not Interested",
};

export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId, userId: user.id } });
  if (!campaign) notFound();

  const leads = await prisma.lead.findMany({ where: { campaignId, userId: user.id }, orderBy: { updatedAt: "desc" } });

  const grouped: Record<string, typeof leads> = {};
  for (const col of PIPELINE_COLUMNS) grouped[col] = [];
  for (const lead of leads) {
    const key = lead.pipelineStatus || "NOT_CONTACTED";
    if (grouped[key]) grouped[key].push(lead);
    else grouped["NOT_CONTACTED"].push(lead);
  }

  const totalSent = leads.filter((l) => l.pipelineStatus !== "NOT_CONTACTED").length;

  return (
    <AppShell activePage="/campaigns" email={user.email || ""}>
      <div className="mb-6">
        <Link href={`/campaigns/${campaignId}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">&larr; {campaign.name}</Link>
        <h1 className="text-2xl font-bold mt-1">Pipeline</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="default">{leads.length} total</Badge>
          <Badge variant="success">{totalSent} contacted</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PIPELINE_COLUMNS.map((col) => (
          <PipelineColumn
            key={col}
            status={col}
            title={STATUS_LABELS[col]}
            leads={grouped[col]}
            campaignId={campaignId}
          />
        ))}
      </div>
    </AppShell>
  );
}
