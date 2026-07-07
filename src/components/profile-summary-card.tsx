import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getSession } from "@/lib/auth/session";

export default async function ProfileSummaryCard() {
  const session = await getSession();
  if (!session) redirect("/login");
  const profile = await getProfile(session.userId);

  if (!profile) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <p className="text-sm text-zinc-400 mb-4">
          Complete your profile before creating campaigns.
        </p>
        <Link
          href="/profile"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400 transition-colors"
        >
          Create Profile
        </Link>
      </div>
    );
  }

  const servicesPreview =
    profile.services && profile.services.length > 80
      ? profile.services.slice(0, 80) + "..."
      : profile.services;

  const ctaPreview =
    profile.defaultCTA && profile.defaultCTA.length > 60
      ? profile.defaultCTA.slice(0, 60) + "..."
      : profile.defaultCTA;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">
          {profile.businessName}
        </h3>
        <Link
          href="/profile"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Edit Profile
        </Link>
      </div>
      <div className="space-y-1.5 text-xs text-zinc-400">
        <p>
          <span className="text-zinc-500">Sender:</span> {profile.senderName} &middot;{" "}
          {profile.senderEmail}
        </p>
        {servicesPreview && (
          <p>
            <span className="text-zinc-500">Services:</span> {servicesPreview}
          </p>
        )}
        {ctaPreview && (
          <p>
            <span className="text-zinc-500">Default CTA:</span> {ctaPreview}
          </p>
        )}
      </div>
    </div>
  );
}
