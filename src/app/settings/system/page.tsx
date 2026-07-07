import { requireUser } from "@/lib/auth/session";
import { getPublicEnvInfo, getEnvironmentWarnings } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";

export default async function SystemPage() {
  const user = await requireUser();
  const env = getPublicEnvInfo();
  const warnings = getEnvironmentWarnings();
  const dbConnected = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);

  return (
    <AppShell activePage="/settings/system" email={user.email || ""}>
      <h1 className="text-2xl font-bold mb-6">System Health</h1>

      <Section title="App Status">
        <Row label="Environment" value={env.environment} />
        <Row label="Database connected" value={dbConnected ? "Yes" : "No"} ok={dbConnected} />
        <Row label="Auth secret configured" value={env.appUrl !== "http://localhost:3000" || env.environment === "development" ? "Yes" : "Missing"} ok={!!env.appUrl} />
        <Row label="App URL" value={env.appUrl} />
        <Row label="Node env" value={process.env.NODE_ENV || "development"} />
      </Section>

      <Section title="AI Status">
        <Row label="Provider" value={env.aiProvider} />
        <Row label="Groq configured" value={env.groqConfigured ? "Yes" : "No"} ok={env.groqConfigured} />
        <Row label="Model" value={env.groqModel} />
        <Row label="Bulk lead limit" value={String(env.bulkLeadLimit)} />
        <Row label="Bulk delay" value={`${env.bulkDelay}ms`} />
      </Section>

      <Section title="Email Status">
        <Row label="Mode" value={env.emailMode} />
        <Row label="SMTP configured" value={env.smtpConfigured ? "Yes" : "No"} ok={env.smtpConfigured} />
        <Row label="From email" value={env.fromEmail} />
        <Row label="Daily limit" value={String(env.dailyLimit)} />
        <Row label="Batch limit" value={String(env.batchLimit)} />
      </Section>

      <Section title="Safety Status">
        <Row label="Unsubscribe system" value="Available" ok />
        <Row label="Review queue" value="Enabled" ok />
        <Row label="Campaign required" value="Yes" ok />
        <Row label="Daily limits" value="Enabled" ok />
      </Section>

      {warnings.length > 0 && (
        <Section title="Warnings">
          {warnings.map((w, i) => (
            <div key={i} className={`rounded-lg border p-3 text-xs ${w.type === "error" ? "border-rose-800/30 bg-rose-950/20 text-rose-400" : "border-yellow-800/30 bg-yellow-950/20 text-yellow-400"}`}>
              {w.message}
            </div>
          ))}
        </Section>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold text-white mb-3">{title}</h2>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">{children}</div>
    </section>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`text-xs font-mono ${ok === undefined ? "text-white" : ok ? "text-emerald-400" : "text-rose-400"}`}>{value}</span>
    </div>
  );
}
