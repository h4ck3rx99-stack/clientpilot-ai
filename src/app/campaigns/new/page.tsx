"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CampaignForm, { type CampaignFormData } from "@/components/campaign-form";

type Profile = {
  id: string;
  businessName: string | null;
  services: string | null;
};

const QUERY_TEMPLATES: Record<string, CampaignFormData> = {
  "website-audit": {
    name: "Website audit outreach",
    serviceToPitch: "Website design and landing page improvement",
    targetNiche: "Local businesses",
    targetLocation: "",
    offer: "Free homepage audit",
    cta: "Would you be open to a quick 15-minute call this week?",
    dailySendLimit: 500,
    minimumFitScore: 75,
  },
  "ai-automation": {
    name: "AI automation outreach",
    serviceToPitch: "AI automation and follow-up systems",
    targetNiche: "Education institutes, clinics, and service businesses",
    targetLocation: "",
    offer: "Free automation workflow idea",
    cta: "Would you be open to a quick 15-minute call this week?",
    dailySendLimit: 500,
    minimumFitScore: 75,
  },
  "dashboard-crm": {
    name: "Dashboard and CRM outreach",
    serviceToPitch: "Dashboards, CRM, and internal workflow tools",
    targetNiche: "Agencies, consultants, and growing small businesses",
    targetLocation: "",
    offer: "Free workflow audit",
    cta: "Would you be open to a quick 15-minute call this week?",
    dailySendLimit: 500,
    minimumFitScore: 80,
  },
};

const TEMPLATES: { label: string; data: CampaignFormData }[] = [
  { label: "Website clients", data: QUERY_TEMPLATES["website-audit"] },
  { label: "AI automation clients", data: QUERY_TEMPLATES["ai-automation"] },
  { label: "Dashboard/internal tools", data: QUERY_TEMPLATES["dashboard-crm"] },
];

function NewCampaignForm() {
  const searchParams = useSearchParams();
  const templateParam = searchParams.get("template");
  const initialFormData = templateParam && QUERY_TEMPLATES[templateParam]
    ? { ...QUERY_TEMPLATES[templateParam] }
    : undefined;
  const [profile, setProfile] = useState<Profile | null | "loading">("loading");
  const [formData, setFormData] = useState<CampaignFormData | undefined>(initialFormData);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  const applyTemplate = useCallback((data: CampaignFormData) => {
    setFormData({ ...data });
  }, []);

  return (
    <>
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
          <Link href="/campaigns/new" className="text-white font-medium">New Campaign</Link>
          <Link href="/unsubscribes" className="text-zinc-400 hover:text-white transition-colors">Unsubscribes</Link>
          <Link href="/settings/ai" className="text-zinc-400 hover:text-white transition-colors">AI Settings</Link>
          <Link href="/settings/email" className="text-zinc-400 hover:text-white transition-colors">Email Settings</Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">New campaign</h1>
        <p className="text-sm text-zinc-500 mb-4">Start from scratch or use a quick-start template.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => applyTemplate(t.data)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>

        {profile === "loading" ? null : !profile ? (
          <div className="rounded-xl border border-amber-800 bg-amber-950/50 p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-amber-300">
              Create your profile first so ClientPilot AI knows what you sell.
            </p>
            <Link
              href="/profile"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-amber-600 px-4 text-xs font-medium text-white hover:bg-amber-500 transition-colors shrink-0"
            >
              Create Profile
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
            <p className="text-sm text-zinc-400">
              Using profile:{" "}
              <span className="text-white font-medium">{profile.businessName}</span>
              {profile.services && (
                <span className="text-zinc-500"> &middot; {profile.services.length > 60 ? profile.services.slice(0, 60) + "..." : profile.services}</span>
              )}
            </p>
          </div>
        )}

        <CampaignForm action="create" cancelHref="/dashboard" initial={formData} key={formData ? JSON.stringify(formData) : "empty"} />
      </main>
    </>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={null}>
      <NewCampaignForm />
    </Suspense>
  );
}
