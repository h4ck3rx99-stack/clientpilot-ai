import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignById } from "@/lib/campaigns";
import CsvImportForm from "./csv-import-form";

export default async function ImportLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

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
          <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
          <Link href="/profile" className="text-zinc-400 hover:text-white transition-colors">Profile</Link>
          <Link href="/campaigns" className="text-zinc-400 hover:text-white transition-colors">Campaigns</Link>
          <Link href="/campaigns/new" className="text-zinc-400 hover:text-white transition-colors">New Campaign</Link>
          <Link href="/unsubscribes" className="text-zinc-400 hover:text-white transition-colors">Unsubscribes</Link>
        </nav>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <Link
          href={`/campaigns/${id}/leads`}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block"
        >
          &larr; Back to leads
        </Link>
        <h1 className="text-2xl font-bold mb-1">Import CSV</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Paste CSV data to import multiple leads for {campaign.name}.
        </p>

        <div className="rounded-xl border border-amber-800 bg-amber-950/50 p-4 mb-6">
          <p className="text-xs text-amber-300">
            Only add public business contact information. Every lead should
            include a source URL so outreach stays transparent and reviewable.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 mb-6">
          <p className="text-xs text-zinc-400 mb-2">Expected CSV format:</p>
          <pre className="text-xs text-zinc-500 bg-zinc-950 rounded p-3 overflow-x-auto">
{`companyName,website,email,sourceUrl,industry
Orange Education,https://orangeeducation.com,info@orangeeducation.com,https://orangeeducation.com,Education`}
          </pre>
          <p className="text-xs text-zinc-600 mt-2">
            Required columns: companyName, website, email, sourceUrl
            <br />
            Optional columns: industry
          </p>
        </div>

        <CsvImportForm campaignId={id} />
      </main>
    </>
  );
}
