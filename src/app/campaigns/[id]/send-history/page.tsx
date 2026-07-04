import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/status-badge";
import EmptyState from "@/components/empty-state";

export default async function SendHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) notFound();

  const logs = await prisma.emailSendLog.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { companyName: true } },
      emailDraft: { select: { subject: true } },
    },
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <Link
              href={`/campaigns/${campaignId}`}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              &larr; {campaign.name}
            </Link>
            <h1 className="text-lg font-semibold mt-1">Send History</h1>
          </div>
          <Link
            href={`/campaigns/${campaignId}/emails`}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            &larr; Review Email Queue
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {logs.length === 0 ? (
          <EmptyState
            title="No send history yet."
            description="Queue drafts and run a simulated send to see results here."
          />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    <th className="pb-3 pr-4 pt-3 pl-5 font-medium">Date/Time</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Company</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Recipient</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Subject</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Status</th>
                    <th className="pb-3 pr-4 pt-3 font-medium">Reason</th>
                    <th className="pb-3 pr-3 pt-3 font-medium">Simulated</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-zinc-800/50 last:border-0"
                    >
                      <td className="py-3 pr-4 pl-5 text-zinc-400 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 pr-4 text-white font-medium">
                        {log.lead.companyName}
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {log.recipientEmail}
                      </td>
                      <td className="py-3 pr-4 text-zinc-300 max-w-[200px] truncate">
                        {log.emailDraft.subject}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="py-3 pr-4 text-xs text-zinc-500 max-w-[200px]">
                        {log.reason || "—"}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                          Sim
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
