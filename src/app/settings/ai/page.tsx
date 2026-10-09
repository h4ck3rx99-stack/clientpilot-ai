import { getProviderStatuses } from "@/lib/ai";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import { CardSection } from "@/components/ui/card";

export default async function AISettingsPage() {
  const user = await requireUser();
  const statuses = getProviderStatuses();

  const settings = [
    { key: "AI_PROVIDER", value: process.env.AI_PROVIDER || "groq" },
    { key: "AI_TIMEOUT_MS", value: process.env.AI_TIMEOUT_MS || "20000" },
    { key: "AI_BULK_MODE", value: process.env.AI_BULK_MODE || "combined" },
    { key: "AI_MAX_BULK_LEADS_PER_RUN", value: process.env.AI_MAX_BULK_LEADS_PER_RUN || "25" },
    { key: "AI_BULK_DELAY_MS", value: process.env.AI_BULK_DELAY_MS || "2500" },
  ];

  return (
    <AppShell activePage="/settings/ai" email={user.email || ""}>
      <h1 className="text-2xl font-bold mb-6">AI Settings</h1>

      <CardSection title="Recommended Zero-Budget Setup" className="border-indigo-800/30 bg-indigo-950/10 mb-8">
        <div className="space-y-2">
          {[
            { label: "Provider", value: "Groq (free tier)" },
            { label: "Model", value: "llama-3.1-8b-instant" },
            { label: "Bulk mode", value: "combined (analyze + draft in one call)" },
            { label: "Max bulk leads per run", value: "25" },
            { label: "Delay between requests", value: "2500ms" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{item.label}</span>
              <span className="text-zinc-200 font-mono">{item.value}</span>
            </div>
          ))}
          <p className="text-xs text-indigo-400 pt-2 border-t border-indigo-800/30 mt-2">
            Set GROQ_API_KEY in your .env file. No credit card required.
          </p>
        </div>
      </CardSection>

      <CardSection title="Provider Status" className="mb-8">
        <div className="space-y-2">
          {statuses.map((s) => (
            <div key={s.name} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white capitalize">{s.name.replace("-", " ")}</span>
                <span className="text-xs text-zinc-500 ml-2">{s.model}</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${s.status === "available" ? "border border-green-700/50 bg-green-950/30 text-green-400" : s.status === "missing-config" ? "border border-yellow-700/50 bg-yellow-950/30 text-yellow-400" : "border border-rose-700/50 bg-rose-950/30 text-rose-400"}`}>
                {s.status === "available" ? "Available" : s.status === "missing-config" ? "Missing Key" : "Error"}
              </span>
            </div>
          ))}
        </div>
      </CardSection>

      <CardSection title="Current Configuration" className="mb-8">
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
      </CardSection>
    </AppShell>
  );
}
