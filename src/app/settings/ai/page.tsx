import Link from "next/link";
import { getProviderStatuses } from "@/lib/ai";

export default async function AISettingsPage() {
  const statuses = getProviderStatuses();

  const settings = [
    { key: "AI_PROVIDER", value: process.env.AI_PROVIDER || "groq" },
    { key: "AI_TIMEOUT_MS", value: process.env.AI_TIMEOUT_MS || "20000" },
    { key: "AI_BULK_MODE", value: process.env.AI_BULK_MODE || "combined" },
    { key: "AI_MAX_BULK_LEADS_PER_RUN", value: process.env.AI_MAX_BULK_LEADS_PER_RUN || "25" },
    { key: "AI_BULK_DELAY_MS", value: process.env.AI_BULK_DELAY_MS || "2500" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                CP
              </div>
              <span className="font-semibold">ClientPilot AI</span>
            </Link>
            <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">
              Profile
            </Link>
            <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">
              Campaigns
            </Link>
            <Link href="/settings/ai" className="text-white font-medium">
              AI Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">AI Settings</h1>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">Provider Status</h2>
          <div className="space-y-2">
            {statuses.map((s) => (
              <div
                key={s.name}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-white capitalize">{s.name.replace("-", " ")}</span>
                  <span className="text-xs text-zinc-500 ml-2">{s.model}</span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    s.status === "available"
                      ? "border border-green-700/50 bg-green-950/30 text-green-400"
                      : s.status === "missing-config"
                        ? "border border-yellow-700/50 bg-yellow-950/30 text-yellow-400"
                        : "border border-rose-700/50 bg-rose-950/30 text-rose-400"
                  }`}
                >
                  {s.status === "available" ? "Available" : s.status === "missing-config" ? "Missing Key" : "Error"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white mb-3">Current Configuration</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4 pt-3 pl-5 font-medium">Setting</th>
                  <th className="pb-3 pr-4 pt-3 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.key} className="border-b border-zinc-800/50 last:border-0">
                    <td className="py-3 pr-4 pl-5 text-zinc-400 font-mono text-xs">{s.key}</td>
                    <td className="py-3 pr-4 text-white font-mono text-xs">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded-lg border border-yellow-800/30 bg-yellow-950/20 p-3">
          <p className="text-xs text-yellow-400">
            Free-tier rate limits can change. If Groq returns 429, lower bulk size or increase delay.
          </p>
        </div>
      </main>
    </div>
  );
}
