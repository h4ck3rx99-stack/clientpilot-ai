import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getOrCreateOnboardingState, getCompletedCount, isOnboardingComplete, getNextStep, ONBOARDING_STEP_LABELS, type OnboardingStep, ONBOARDING_STEPS } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";

const STEP_INFO: { step: OnboardingStep; description: string; buttonLabel: string; href: string }[] = [
  { step: "profileCompleted", description: "Tell ClientPilot what you sell, your proof, tone, and CTA.", buttonLabel: "Edit Profile", href: "/profile" },
  { step: "firstCampaignCreated", description: "Choose your niche, location, offer, and fit-score threshold.", buttonLabel: "Create Campaign", href: "/campaigns/new" },
  { step: "firstLeadsAdded", description: "Add public business contacts manually, import CSV, or use the discovery assistant.", buttonLabel: "View Campaigns", href: "/campaigns" },
  { step: "firstLeadsAnalyzed", description: "Use Groq/local fallback to identify best-fit prospects.", buttonLabel: "Manage Leads", href: "/campaigns" },
  { step: "firstDraftGenerated", description: "Create personalized drafts for high-fit leads.", buttonLabel: "Review Emails", href: "/campaigns" },
  { step: "firstDraftQueued", description: "Only reviewed emails should be queued for sending.", buttonLabel: "Review Queue", href: "/campaigns" },
  { step: "firstSendCompleted", description: "Use simulation first, then SMTP only after settings are correct.", buttonLabel: "Email Settings", href: "/settings/email" },
];

export default async function OnboardingPage() {
  const user = await requireUser();
  const state = await getOrCreateOnboardingState(user.id);
  const completed = getCompletedCount(state);
  const total = ONBOARDING_STEPS.length;
  const allDone = isOnboardingComplete(state);
  const progressPct = Math.round((completed / total) * 100);

  let latestCampaignId: string | null = null;
  const latestCampaign = await prisma.campaign.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (latestCampaign) latestCampaignId = latestCampaign.id;

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
          <Link href="/onboarding" className="text-white font-medium">Onboarding</Link>
          <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">Profile</Link>
          <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
          <Link href="/campaigns/new" className="text-zinc-400 hover:text-white transition-colors">New Campaign</Link>
          <Link href="/unsubscribes" className="text-zinc-400 hover:text-white transition-colors">Unsubscribes</Link>
          <Link href="/settings/ai" className="text-zinc-400 hover:text-white transition-colors">AI Settings</Link>
          <Link href="/settings/email" className="text-zinc-400 hover:text-white transition-colors">Email Settings</Link>
          {process.env.NODE_ENV !== "production" && (
            <Link href="/settings/dev-tools" className="text-zinc-400 hover:text-white transition-colors">Dev Tools</Link>
          )}
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Set up ClientPilot AI</h1>
        <p className="text-sm text-zinc-500 mb-6">Complete these steps to run your first safe outreach campaign.</p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">{completed} of {total} complete</span>
            <span className="text-xs text-zinc-500">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          {!allDone && (
            <p className="text-xs text-zinc-500 mt-3">
              Next: <span className="text-indigo-400">{ONBOARDING_STEP_LABELS[getNextStep(state)!]}</span>
            </p>
          )}
          {allDone && (
            <p className="text-xs text-emerald-400 mt-3">All steps completed!</p>
          )}
        </div>

        <div className="space-y-4">
          {STEP_INFO.map(({ step, description, buttonLabel, href }) => {
            const done = state[step];
            const finalHref = step === "firstLeadsAdded" || step === "firstLeadsAnalyzed" || step === "firstDraftGenerated" || step === "firstDraftQueued"
              ? (latestCampaignId ? `/campaigns/${latestCampaignId}/leads` : href)
              : href;

            return (
              <div key={step} className={`rounded-xl border p-5 flex items-start justify-between gap-4 ${
                done ? "border-emerald-800/30 bg-emerald-950/10" : "border-zinc-800 bg-zinc-900/50"
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-sm font-semibold ${done ? "text-emerald-400" : "text-white"}`}>
                      {ONBOARDING_STEP_LABELS[step]}
                    </h3>
                    {done ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-700/50 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">Done</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400">Pending</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{description}</p>
                </div>
                <Link
                  href={finalHref}
                  className={`inline-flex h-9 shrink-0 items-center justify-center rounded-lg px-4 text-xs font-medium transition-colors ${
                    done
                      ? "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                      : "bg-indigo-500 text-white hover:bg-indigo-400"
                  }`}
                >
                  {buttonLabel}
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
