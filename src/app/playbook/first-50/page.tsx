import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/app-shell";
import { CardSection } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";

const TEMPLATES = [
  {
    id: "website-audit",
    title: "Website Audit",
    bestFor: ["Local businesses", "Restaurants", "Gyms", "Clinics", "Coaching centers"],
    offer: "Free homepage audit",
    cta: "Would you be open to a quick 15-minute call this week?",
  },
  {
    id: "ai-automation",
    title: "AI Automation Idea",
    bestFor: ["Education institutes", "Clinics", "Agencies", "Service businesses"],
    offer: "Free automation workflow idea",
    cta: "Would you be open to a quick 15-minute call this week?",
  },
  {
    id: "dashboard-crm",
    title: "Dashboard / CRM Workflow",
    bestFor: ["Agencies", "Consultants", "Growing small businesses"],
    offer: "Free workflow audit",
    cta: "Would you be open to a quick 15-minute call this week?",
  },
];

const BATCHES = [
  { label: "Batch 1", count: 10, desc: "Test the workflow with a small set" },
  { label: "Batch 2", count: 15, desc: "Expand to more leads" },
  { label: "Batch 3", count: 25, desc: "Scale to your first 50" },
];

const DAILY_STEPS = [
  "Add 10-20 leads",
  "Run Analyze + Draft",
  "Review every draft",
  "Queue only good drafts",
  "Simulate send",
  "Send 3-5 real emails if SMTP is ready",
  "Update pipeline from replies",
  "Set follow-up date",
  "Backup data",
];

const METRICS = [
  "Leads added",
  "High-fit leads",
  "Drafts generated",
  "Emails sent",
  "Replies",
  "Interested",
  "Meetings booked",
  "Won leads",
];

const STOP_RULES = [
  "Stop contacting unsubscribed leads",
  "Stop contacting people who say not interested",
  "Do not send hundreds from a fresh inbox",
  "Do not use fake claims",
  "Do not email contacts without source URLs",
  "Keep daily limit low at first",
];

export default async function First50PlaybookPage() {
  const user = await requireUser();
  const leadCount = await prisma.lead.count({ where: { userId: user.id } });

  return (
    <AppShell activePage="/playbook/first-50" email={user.email || ""}>
      <h1 className="text-2xl font-bold mb-1">First 50 Leads Playbook</h1>
      <p className="text-sm text-zinc-500 mb-8">A simple, safe workflow to test ClientPilot AI with your first real outreach campaign.</p>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-8">
        <p className="text-xs text-zinc-500">Your progress</p>
        <p className="text-lg font-semibold text-white">{leadCount} / 50 leads added</p>
        <div className="mt-2 h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, (leadCount / 50) * 100)}%` }} />
        </div>
      </div>

      {/* A. Pick one offer */}
      <CardSection title="A. Pick One Offer" className="mb-8">
        <p className="text-xs text-zinc-500 mb-4">Choose one offer for your first campaign. Each creates a pre-filled campaign template.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col">
              <h3 className="text-sm font-semibold text-white mb-2">{t.title}</h3>
              <div className="mb-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Best for</p>
                <div className="flex flex-wrap gap-1">
                  {t.bestFor.map((b) => (
                    <span key={b} className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] text-zinc-400">{b}</span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-400 mb-1"><span className="text-zinc-300">Offer:</span> {t.offer}</p>
              <p className="text-xs text-zinc-400 mb-4"><span className="text-zinc-300">CTA:</span> {t.cta}</p>
              <div className="mt-auto">
                <LinkButton href={`/campaigns/new?template=${t.id}`} variant="secondary" size="sm">Create campaign from this offer</LinkButton>
              </div>
            </div>
          ))}
        </div>
      </CardSection>

      {/* B. Find 50 leads safely */}
      <CardSection title="B. Find 50 Leads Safely" className="mb-8">
        <p className="text-xs text-zinc-500 mb-4">Start with one niche and one location. Use public business websites and directories. Do not use private personal emails. Add source URLs for every lead.</p>
        <div className="grid gap-3 sm:grid-cols-3 mb-4">
          {BATCHES.map((b) => (
            <div key={b.label} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-center">
              <p className="text-lg font-bold text-indigo-400">{b.count}</p>
              <p className="text-xs text-zinc-300 font-medium">{b.label}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
        <LinkButton href="/campaigns" variant="secondary" size="sm">Go to Campaigns</LinkButton>
      </CardSection>

      {/* C. Recommended daily workflow */}
      <CardSection title="C. Recommended Daily Workflow" className="mb-8">
        <div className="space-y-2">
          {DAILY_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">{i + 1}</span>
              <span className="text-zinc-300">{step}</span>
            </div>
          ))}
        </div>
      </CardSection>

      {/* D. What to track */}
      <CardSection title="D. What to Track" className="mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {METRICS.map((m) => (
            <div key={m} className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-center">
              <p className="text-xs text-zinc-400">{m}</p>
            </div>
          ))}
        </div>
      </CardSection>

      {/* E. Stop rules */}
      <CardSection title="E. Stop Rules" className="mb-8">
        <div className="space-y-2">
          {STOP_RULES.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-rose-500">&#10005;</span>
              <span className="text-zinc-300">{rule}</span>
            </div>
          ))}
        </div>
      </CardSection>
    </AppShell>
  );
}
