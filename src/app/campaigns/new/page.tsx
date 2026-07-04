"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CampaignForm from "@/components/campaign-form";

type Profile = {
  id: string;
  businessName: string | null;
  services: string | null;
};

export default function NewCampaignPage() {
  const [profile, setProfile] = useState<Profile | null | "loading">(
    "loading"
  );

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data))
      .catch(() => setProfile(null));
  }, []);

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              CP
            </div>
            <span className="text-sm font-semibold">ClientPilot AI</span>
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/campaigns"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Campaigns
          </Link>
          <Link
            href="/campaigns/new"
            className="text-white font-medium"
          >
            New Campaign
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">New campaign</h1>

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
              <span className="text-white font-medium">
                {profile.businessName}
              </span>
              {profile.services && (
                <span className="text-zinc-500">
                  {" "}
                  &middot;{" "}
                  {profile.services.length > 60
                    ? profile.services.slice(0, 60) + "..."
                    : profile.services}
                </span>
              )}
            </p>
          </div>
        )}

        <CampaignForm
          action="create"
          cancelHref="/dashboard"
        />
      </main>
    </>
  );
}
