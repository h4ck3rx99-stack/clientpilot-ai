import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampaignById } from "@/lib/campaigns";
import CampaignForm from "@/components/campaign-form";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const initial = {
    name: campaign.name,
    serviceToPitch: campaign.serviceToPitch,
    targetNiche: campaign.targetNiche,
    targetLocation: campaign.targetLocation,
    offer: campaign.offer,
    cta: campaign.cta,
    dailySendLimit: campaign.dailySendLimit,
    minimumFitScore: campaign.minimumFitScore,
  };

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

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href={`/campaigns/${id}`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-1 block"
          >
            &larr; Back to campaign
          </Link>
          <h1 className="text-2xl font-bold">Edit Campaign</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Update your campaign settings below.
          </p>
        </div>

        <CampaignForm
          initial={initial}
          action="update"
          cancelHref={`/campaigns/${id}`}
          campaignId={id}
        />
      </main>
    </>
  );
}
