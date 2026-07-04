import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmailDraftById } from "@/lib/email-drafts";
import EmailDraftForm from "@/components/email-draft-form";
import StatusBadge from "@/components/status-badge";

export default async function EditDraftPage({
  params,
}: {
  params: Promise<{ id: string; draftId: string }>;
}) {
  const { id: campaignId, draftId } = await params;

  const draft = await getEmailDraftById(draftId);
  if (!draft || draft.lead.campaignId !== campaignId) notFound();

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href={`/campaigns/${campaignId}/emails`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Email Queue
          </Link>
          <h1 className="text-lg font-semibold mt-1">Review &amp; Edit Draft</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {draft.lead.companyName}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {draft.lead.email} &middot; Score: {draft.lead.fitScore}
              </p>
              {draft.lead.industry && (
                <p className="text-xs text-zinc-600 mt-0.5">
                  {draft.lead.industry}
                </p>
              )}
            </div>
            <StatusBadge status={draft.status} />
          </div>

          <div className="space-y-2 text-xs text-zinc-400">
            {draft.lead.painPoint && (
              <p>
                <span className="text-zinc-500">Pain: </span>
                {draft.lead.painPoint}
              </p>
            )}
            {draft.lead.offerAngle && (
              <p>
                <span className="text-zinc-500">Offer: </span>
                {draft.lead.offerAngle}
              </p>
            )}
            {draft.lead.personalizationLine && (
              <p>
                <span className="text-zinc-500">Personalization: </span>
                {draft.lead.personalizationLine}
              </p>
            )}
          </div>
        </div>

        <EmailDraftForm
          draftId={draft.id}
          campaignId={campaignId}
          initial={{
            subject: draft.subject,
            body: draft.body,
            status: draft.status,
          }}
        />
      </main>
    </div>
  );
}
