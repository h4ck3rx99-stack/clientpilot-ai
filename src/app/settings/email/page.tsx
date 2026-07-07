import Link from "next/link";
import { getEmailProviderStatus } from "@/lib/email";

export default async function EmailSettingsPage() {
  const status = getEmailProviderStatus();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">CP</div>
              <span className="font-semibold">ClientPilot AI</span>
            </Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/settings/email" className="text-white font-medium">Email Settings</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Email Settings</h1>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">Email Mode</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase ${
                status.mode === "smtp"
                  ? "border border-indigo-700/50 bg-indigo-950/30 text-indigo-400"
                  : "border border-zinc-700 bg-zinc-800/50 text-zinc-400"
              }`}>
                {status.mode}
              </span>
              <span className="text-sm text-zinc-300">
                {status.mode === "smtp" ? "Real SMTP sending" : "Simulation mode — no real emails sent"}
              </span>
            </div>

            {status.mode === "smtp" && !status.smtpConfigured && (
              <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3 mt-4">
                <p className="text-xs text-yellow-400">
                  SMTP mode is selected but credentials are incomplete. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">SMTP Configuration</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4 pt-3 pl-5 font-medium">Setting</th>
                  <th className="pb-3 pr-4 pt-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "SMTP Host", value: status.smtpHost || "—" },
                  { label: "SMTP Port", value: String(status.smtpPort) },
                  { label: "From Name", value: status.fromName || "—" },
                  { label: "From Email", value: status.fromEmail || "—" },
                  { label: "SMTP Configured", value: status.smtpConfigured ? "Yes" : "No" },
                  { label: "EMAIL_MODE", value: status.mode },
                  { label: "REAL_SEND_DAILY_LIMIT", value: process.env.REAL_SEND_DAILY_LIMIT || "20" },
                  { label: "REAL_SEND_BATCH_LIMIT", value: process.env.REAL_SEND_BATCH_LIMIT || "10" },
                  { label: "REAL_SEND_DELAY_MS", value: process.env.REAL_SEND_DELAY_MS || "5000" },
                  { label: "APP_URL", value: process.env.APP_URL || "http://localhost:3000" },
                ].map((s) => (
                  <tr key={s.label} className="border-b border-zinc-800/50 last:border-0">
                    <td className="py-3 pr-4 pl-5 text-zinc-400 font-mono text-xs">{s.label}</td>
                    <td className="py-3 pr-4 text-white font-mono text-xs">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {(process.env.APP_URL || "").includes("localhost") && (
          <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3 mb-6">
            <p className="text-xs text-yellow-400">
              Unsubscribe links will not work for public recipients until deployed with a public URL. Set APP_URL to your production domain.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
