import Link from "next/link";
import { getSession } from "@/lib/auth/session";

const features = [
  {
    title: "AI lead scoring",
    description: "Every lead gets a fit score based on industry, pain points, and sourcing quality so you focus on best-fit prospects.",
  },
  {
    title: "Personalized outreach",
    description: "Each email is custom-written around the lead's specific context, not a generic template blast.",
  },
  {
    title: "Safe review queue",
    description: "Emails land in a queue for your approval. Nothing goes out without you seeing it first.",
  },
  {
    title: "Unsubscribe tracking",
    description: "Every email includes one-click unsubscribe. Compliance built in from day one.",
  },
  {
    title: "Daily send limits",
    description: "Hard caps on daily sends per campaign protect your sender reputation and keep you compliant.",
  },
];

export default async function Home() {
  const session = await getSession();
  const loggedIn = !!session;

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">CP</div>
          <span className="text-sm font-semibold">ClientPilot AI</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          {loggedIn ? (
            <>
              <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
              <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">Profile</Link>
              <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
              <Link href="/campaigns/new" className="text-zinc-400 hover:text-white transition-colors">New Campaign</Link>
              <Link href="/unsubscribes" className="text-zinc-400 hover:text-white transition-colors">Unsubscribes</Link>
              <Link href="/settings/ai" className="text-zinc-400 hover:text-white transition-colors">AI Settings</Link>
              <Link href="/settings/email" className="text-zinc-400 hover:text-white transition-colors">Email Settings</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">Log in</Link>
              <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white hover:bg-indigo-400 transition-colors">Get Started</Link>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        <section className="flex flex-col items-center text-center px-6 pt-28 pb-20 max-w-3xl mx-auto w-full">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            Find clients <br />
            <span className="text-indigo-400">while you work.</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
            Tell AI what you sell. It finds best-fit businesses, writes
            personalized outreach, and prepares emails for review.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            {loggedIn ? (
              <>
                <Link href="/dashboard" className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-6 text-sm font-medium text-white hover:bg-indigo-400 transition-colors">Go to Dashboard</Link>
                <Link href="/campaigns/new" className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-700 px-6 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">New Campaign</Link>
              </>
            ) : (
              <>
                <Link href="/register" className="inline-flex h-11 items-center justify-center rounded-lg bg-indigo-500 px-6 text-sm font-medium text-white hover:bg-indigo-400 transition-colors">Get Started</Link>
                <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-700 px-6 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">Log in</Link>
              </>
            )}
          </div>
        </section>

        <section className="border-t border-zinc-800 px-6 py-20 max-w-5xl mx-auto w-full">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title}>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
