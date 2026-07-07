import { getEmailProviderStatus } from "@/lib/email";
import { getProviderStatuses } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export default async function SetupStatusCard({ userId }: { userId: string }) {
  const emailStatus = getEmailProviderStatus();
  const aiStatuses = getProviderStatuses();
  const profile = await prisma.userProfile.findFirst({
    where: { userId },
    select: { businessName: true, senderName: true, senderEmail: true, services: true, defaultCTA: true },
  });
  const campaignCount = await prisma.campaign.count({ where: { userId } });

  const profileComplete = !!(profile?.businessName && profile?.senderName && profile?.senderEmail && profile?.services && profile?.defaultCTA);
  const groqConfigured = aiStatuses.some(s => s.name === "groq" && s.status === "available");
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  const items = [
    { label: "Profile", ok: profileComplete },
    { label: "Groq AI", ok: groqConfigured },
    { label: "Email mode", ok: emailStatus.mode === "smtp" ? emailStatus.smtpConfigured : true, detail: emailStatus.mode === "smtp" ? "SMTP" : "Simulation" },
    { label: "SMTP config", ok: emailStatus.smtpConfigured, detail: emailStatus.smtpConfigured ? "Configured" : "Not set" },
    { label: "App URL", ok: !appUrl.includes("localhost"), detail: appUrl },
    { label: "Active campaign", ok: campaignCount > 0, detail: campaignCount > 0 ? `${campaignCount} found` : "None" },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Setup Status</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">{item.label}</span>
            <span className={item.ok ? "text-emerald-400" : "text-rose-400"}>
              {item.ok ? "OK" : "Missing"}
              {item.detail && <span className="text-zinc-500 ml-1">({item.detail})</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
