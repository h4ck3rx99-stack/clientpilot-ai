import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignById } from "@/lib/campaigns";
import StatusBadge from "@/components/status-badge";
import CampaignControls from "./campaign-controls";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const detailRows = [
    { label: "Name", value: campaign.name },
    { label: "Status", value: null, isStatus: true },
    { label: "Service to pitch", value: campaign.serviceToPitch },
    { label: "Target niche", value: campaign.targetNiche },
    { label: "Target location", value: campaign.targetLocation },
    { label: "Offer", value: campaign.offer },
    { label: "CTA", value: campaign.cta },
    { label: "Daily send limit", value: String(campaign.dailySendLimit) },
    { label: "Minimum fit score", value: String(campaign.minimumFitScore) },
  ];

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
            className="text-white font-medium"
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

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/campaigns"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block"
            >
              &larr; Back to campaigns
            </Link>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
          </div>
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Edit
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-4">
            Campaign Overview
          </h2>
          <div className="space-y-3">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-start gap-3 text-sm">
                <span className="text-zinc-500 w-36 shrink-0">
                  {row.label}
                </span>
                {row.isStatus ? (
                  <StatusBadge status={campaign.status} />
                ) : (
                  <span className="text-white">{row.value}</span>
                )}
              </div>
            ))}
            <div className="flex items-start gap-3 text-sm">
              <span className="text-zinc-500 w-36 shrink-0">Created</span>
              <span className="text-zinc-300">
                {new Date(campaign.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-zinc-500 w-36 shrink-0">Updated</span>
              <span className="text-zinc-300">
                {new Date(campaign.updatedAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        <CampaignControls campaignId={campaign.id} status={campaign.status} />

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">Leads</h2>
          <p className="text-sm text-zinc-500 mb-4">No leads added yet.</p>
          <Link
            href={`/campaigns/${campaign.id}/leads/new`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Add leads manually
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">
            Email Queue
          </h2>
          <p className="text-sm text-zinc-500">
            No email drafts queued yet.
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            After leads are analyzed, personalized emails will appear here for
            review.
          </p>
        </div>
      </main>
    </>
  );
}
