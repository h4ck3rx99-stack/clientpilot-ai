import Link from "next/link";
import StatusBadge from "./status-badge";

type Campaign = {
  id: string;
  name: string;
  targetNiche: string;
  targetLocation: string;
  serviceToPitch: string;
  status: string;
  minimumFitScore: number;
  dailySendLimit: number;
  createdAt: Date;
};

export default function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:bg-zinc-900/80 transition-colors block">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">
            {campaign.name}
          </h3>
          <StatusBadge status={campaign.status} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-zinc-400">
          <div>
            <span className="text-zinc-600 block mb-0.5">Niche</span>
            {campaign.targetNiche}
          </div>
          <div>
            <span className="text-zinc-600 block mb-0.5">Location</span>
            {campaign.targetLocation}
          </div>
          <div>
            <span className="text-zinc-600 block mb-0.5">Fit score min</span>
            {campaign.minimumFitScore}
          </div>
          <div>
            <span className="text-zinc-600 block mb-0.5">Daily limit</span>
            {campaign.dailySendLimit}
          </div>
        </div>
        <p className="text-xs text-zinc-600 mt-3">
          {new Date(campaign.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
