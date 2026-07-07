import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/profile";
import { getSession, getCurrentUser } from "@/lib/auth/session";
import ProfileForm from "@/components/profile-form";

function authProviderLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "credentials") return "Email / Password";
  return provider;
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await getCurrentUser();
  const profile = await getProfile(session.userId);

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
          <Link
            href="/unsubscribes"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Unsubscribes
          </Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        {user && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-8">
            <h2 className="text-sm font-semibold text-white mb-3">Account</h2>
            <div className="flex items-center gap-3 mb-3">
              {user.image ? (
                <img src={user.image} alt="" className="size-10 rounded-full" />
              ) : (
                <div className="size-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-white font-medium">{user.name || "Unnamed"}</p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              Signed in via <span className="text-zinc-300">{authProviderLabel(user.authProvider)}</span>
            </div>
          </div>
        )}

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
