import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import { CardSection } from "@/components/ui/card";

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
    <AppShell activePage="/settings/backup" email={user.email || ""}>
      <h1 className="text-2xl font-bold mb-1">Backup & Export</h1>
      <p className="text-sm text-zinc-500 mb-6">Export your data as JSON. Secrets and passwords are excluded.</p>

      <CardSection title="Data Overview" className="mb-6">
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
      </CardSection>

      <CardSection className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Export All Data</h2>
            <p className="text-xs text-zinc-500 mt-1">Downloads a JSON file with your campaigns, leads, drafts, and more.</p>
          </div>
          <a href="/api/backup/export" className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors shrink-0">
            Export JSON
          </a>
        </div>
      </CardSection>

      <CardSection>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Import Restore</h2>
            <p className="text-xs text-zinc-500 mt-1">Import restore will be added later.</p>
          </div>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Coming soon</span>
        </div>
      </CardSection>
    </AppShell>
  );
}
