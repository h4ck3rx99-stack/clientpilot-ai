import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UnsubscribeForm from "./unsubscribe-form";
import EmptyState from "@/components/empty-state";

export default async function UnsubscribesPage() {
  const records = await prisma.unsubscribe.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                CP
              </div>
              <span className="text-sm font-semibold">ClientPilot AI</span>
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/dashboard"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/campaigns"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Campaigns
            </Link>
            <Link
              href="/campaigns/new"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              New Campaign
            </Link>
            <Link
              href="/unsubscribes"
              className="text-white font-medium"
            >
              Unsubscribes
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Unsubscribes</h1>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            Add Email to Unsubscribe List
          </h2>
          <UnsubscribeForm />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-300 mb-3">
            Unsubscribed Contacts
            {records.length > 0 && (
              <span className="text-zinc-600 ml-1">
                ({records.length})
              </span>
            )}
          </h2>
          {records.length === 0 ? (
            <EmptyState
              title="No unsubscribed contacts yet."
              description="Add emails to the unsubscribe list to prevent sending."
            />
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                      <th className="pb-3 pr-4 pt-3 pl-5 font-medium">
                        Email
                      </th>
                      <th className="pb-3 pr-4 pt-3 font-medium">Reason</th>
                      <th className="pb-3 pr-3 pt-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-zinc-800/50 last:border-0"
                      >
                        <td className="py-3 pr-4 pl-5 text-white">
                          {r.email}
                        </td>
                        <td className="py-3 pr-4 text-zinc-400">
                          {r.reason || "—"}
                        </td>
                        <td className="py-3 pr-3 text-zinc-500 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
