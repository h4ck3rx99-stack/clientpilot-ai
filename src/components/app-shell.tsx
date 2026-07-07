import Link from "next/link";
import LogoutButton from "./logout-button";

type NavItem = { label: string; href: string; developmentOnly?: boolean; section?: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Daily", href: "/daily" },
  { label: "Launch", href: "/launch" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Profile", href: "/profile" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "New Campaign", href: "/campaigns/new" },
  { label: "Unsubscribes", href: "/unsubscribes" },
  { label: "AI Settings", href: "/settings/ai" },
  { label: "Email Settings", href: "/settings/email" },
  { label: "Test Email", href: "/settings/test-email" },
  { label: "Deliverability", href: "/settings/deliverability" },
  { label: "System", href: "/settings/system" },
  { label: "Backup", href: "/settings/backup" },
  { label: "Dev Tools", href: "/settings/dev-tools", developmentOnly: true },
];

function isActive(activePage: string, itemHref: string): boolean {
  if (activePage === itemHref) return true;
  if (itemHref === "/dashboard") return false;
  if (itemHref === "/") return false;
  return activePage.startsWith(itemHref);
}

export default async function AppShell({ activePage, email, children }: { activePage: string; email: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Topbar */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 bg-black z-40">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="size-7 rounded-lg bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">CP</div>
            <span className="text-sm font-semibold hidden sm:inline">ClientPilot AI</span>
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500 text-xs hidden md:inline">{email}</span>
          <Link href="/onboarding" className="text-xs text-zinc-400 hover:text-white transition-colors">Setup</Link>
          <LogoutButton />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r border-zinc-800 hidden lg:block min-h-[calc(100vh-3.5rem)]">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.filter(n => !n.developmentOnly || process.env.NODE_ENV !== "production").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(activePage, item.href)
                    ? "bg-zinc-800 text-white font-medium"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black z-40 overflow-x-auto">
          <nav className="flex gap-1 p-2 text-[11px]">
            {NAV_ITEMS.filter(n => !n.developmentOnly || process.env.NODE_ENV !== "production").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 transition-colors ${
                  isActive(activePage, item.href) ? "bg-zinc-800 text-white font-medium" : "text-zinc-500"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 px-4 lg:px-6 py-6 max-w-6xl mx-auto w-full pb-20 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
