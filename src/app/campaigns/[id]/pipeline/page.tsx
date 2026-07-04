import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PipelineColumn from "./pipeline-column";
import StatusBadge from "@/components/status-badge";

const PIPELINE_COLUMNS = [
  "NOT_CONTACTED",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "FOLLOW_UP",
  "MEETING_BOOKED",
  "WON",
  "LOST",
  "NOT_INTERESTED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  NOT_CONTACTED: "Not Contacted",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  INTERESTED: "Interested",
  FOLLOW_UP: "Follow Up",
  MEETING_BOOKED: "Meeting Booked",
  WON: "Won",
  LOST: "Lost",
  NOT_INTERESTED: "Not Interested",
};

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) notFound();

  const leads = await prisma.lead.findMany({
    where: { campaignId },
    orderBy: { updatedAt: "desc" },
  });

  const grouped: Record<string, typeof leads> = {};
  for (const col of PIPELINE_COLUMNS) {
    grouped[col] = [];
  }
  for (const lead of leads) {
    const key = lead.pipelineStatus || "NOT_CONTACTED";
    if (grouped[key]) {
      grouped[key].push(lead);
    } else {
      grouped["NOT_CONTACTED"].push(lead);
    }
  }

  const now = new Date();
  const followUpsDue = leads.filter(
    (l) =>
      l.nextFollowUpAt &&
      l.nextFollowUpAt <= now &&
      ["FOLLOW_UP", "INTERESTED", "REPLIED"].includes(l.pipelineStatus)
  ).length;

  const stats = {
    contacted: leads.filter((l) => l.pipelineStatus !== "NOT_CONTACTED").length,
    replied: leads.filter((l) => l.pipelineStatus === "REPLIED").length,
    interested: leads.filter((l) => l.pipelineStatus === "INTERESTED").length,
    meetings: leads.filter((l) => l.pipelineStatus === "MEETING_BOOKED").length,
    won: leads.filter((l) => l.pipelineStatus === "WON").length,
    followUpsDue,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <Link
              href={`/campaigns/${campaignId}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              &larr; {campaign.name}
            </Link>
            <h1 className="text-lg font-semibold mt-1">Pipeline</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Track replies, follow-ups, meetings, and closed outcomes.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/campaigns/${campaignId}/send-history`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Send History
            </Link>
            <Link
              href={`/campaigns/${campaignId}/emails`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Email Queue
            </Link>
            <Link
              href={`/campaigns/${campaignId}/leads`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Leads
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
            <span className="text-white font-medium">{campaign.name}</span>
            <span>&middot;</span>
            <span>{campaign.targetNiche}</span>
            <span>&middot;</span>
            <span>{campaign.serviceToPitch}</span>
            <span>&middot;</span>
            <StatusBadge status={campaign.status} />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-lg font-bold text-blue-400">{stats.contacted}</p>
              <p className="text-[10px] text-zinc-500">Contacted</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-lg font-bold text-green-400">{stats.replied}</p>
              <p className="text-[10px] text-zinc-500">Replied</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-lg font-bold text-purple-400">{stats.interested}</p>
              <p className="text-[10px] text-zinc-500">Interested</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-lg font-bold text-yellow-400">{stats.meetings}</p>
              <p className="text-[10px] text-zinc-500">Meetings</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-400">{stats.won}</p>
              <p className="text-[10px] text-zinc-500">Won</p>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2.5 text-center">
              <p className="text-lg font-bold text-rose-400">{stats.followUpsDue}</p>
              <p className="text-[10px] text-zinc-500">Follow-ups Due</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PIPELINE_COLUMNS.map((col) => (
            <PipelineColumn
              key={col}
              title={STATUS_LABELS[col] || col}
              status={col}
              leads={grouped[col] || []}
              campaignId={campaignId}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
