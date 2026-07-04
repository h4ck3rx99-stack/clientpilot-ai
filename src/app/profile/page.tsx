import Link from "next/link";
import { getProfile } from "@/lib/profile";
import ProfileForm from "@/components/profile-form";

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            CP
          </div>
          <span className="text-sm font-semibold">ClientPilot AI</span>
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
            className="text-white font-medium"
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
            className="text-zinc-400 hover:text-white transition-colors"
          >
            New Campaign
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">
          {profile ? "Edit Profile" : "Create Profile"}
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          {profile
            ? "Update your business details used for outreach."
            : "Tell ClientPilot AI what you sell so it can write better outreach."}
        </p>

        <ProfileForm profile={profile} />
      </main>
    </>
  );
}
