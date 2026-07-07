import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function BackupPage() {
  const user = await requireUser();

  const counts = await Promise.all([
    prisma.campaign.count({ where: { userId: user.id } }),
    prisma.lead.count({ where: { userId: user.id } }),
    prisma.emailDraft.count({ where: { userId: user.id } }),
    prisma.emailSendLog.count({ where: { userId: user.id } }),
    prisma.leadActivity.count({ where: { userId: user.id } }),
    prisma.unsubscribe.count({ where: { userId: user.id } }),
  ]);

  const [campaigns, leads, drafts, sendLogs, activities, unsubscribes] = counts;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">CP</div>
            <span className="text-sm font-semibold">ClientPilot AI</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/onboarding" className="text-zinc-400 hover:text-white transition-colors">Onboarding</Link>
          <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">Profile</Link>
          <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
          <Link href="/settings/system" className="text-zinc-400 hover:text-white transition-colors">System</Link>
          <Link href="/settings/backup" className="text-white font-medium">Backup</Link>
          <Link href="/settings/ai" className="text-zinc-400 hover:text-white transition-colors">AI</Link>
          <Link href="/settings/email" className="text-zinc-400 hover:text-white transition-colors">Email</Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Backup & Export</h1>
        <p className="text-sm text-zinc-500 mb-6">Export your data as JSON. Secrets and passwords are excluded.</p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">Data Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Campaigns", value: campaigns },
              { label: "Leads", value: leads },
              { label: "Drafts", value: drafts },
              { label: "Send logs", value: sendLogs },
              { label: "Activities", value: activities },
              { label: "Unsubscribes", value: unsubscribes },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className="text-lg font-bold text-white">{item.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Export All Data</h2>
              <p className="text-xs text-zinc-500 mt-1">Downloads a JSON file with your campaigns, leads, drafts, and more.</p>
            </div>
            <a
              href={`/api/backup/export`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors shrink-0"
            >
              Export JSON
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Import Restore</h2>
              <p className="text-xs text-zinc-500 mt-1">Import restore will be added later.</p>
            </div>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Coming soon</span>
          </div>
        </div>
      </main>
    </div>
  );
}
