import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import DevToolsActions from "./actions";

export default async function DevToolsPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/dashboard");
  }

  const user = await requireUser();

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
          <Link href="/onboarding" className="text-zinc-400 hover:text-white transition-colors">Onboarding</Link>
          <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">Profile</Link>
          <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
          <Link href="/settings/dev-tools" className="text-white font-medium">Dev Tools</Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Dev Tools</h1>
        <p className="text-sm text-zinc-500 mb-6">Sample data generator for personal testing. Only available in development mode.</p>

        <div className="rounded-xl border border-amber-800/30 bg-amber-950/10 p-4 mb-6">
          <p className="text-xs text-amber-400">
            Dev tools are hidden in production. Use with caution — sample data is real data in your database.
          </p>
        </div>

        <DevToolsActions userId={user.id} />
      </main>
    </div>
  );
}
