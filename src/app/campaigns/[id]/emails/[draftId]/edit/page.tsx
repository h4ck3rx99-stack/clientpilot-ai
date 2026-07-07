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

  const readOnly =
    draft.status === "SENT" || draft.status === "CANCELLED";

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
          <h1 className="text-lg font-semibold mt-1">
            {readOnly ? "View Draft" : "Review &amp; Edit Draft"}
          </h1>
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
            <div className="flex items-center gap-2">
              {draft.type === "FOLLOW_UP" && (
                <span className="inline-flex items-center rounded-full border border-purple-700/50 bg-purple-950/30 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                  Follow-up #{draft.followUpNumber}
                </span>
              )}
              {draft.type !== "FOLLOW_UP" && (
                <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  Initial
                </span>
              )}
              <StatusBadge status={draft.status} />
            </div>
          </div>

          {draft.type === "FOLLOW_UP" && (
            <div className="rounded-lg border border-purple-800/30 bg-purple-950/20 p-3 mb-4">
              <p className="text-xs text-purple-400">
                This is a follow-up draft. Keep it short, polite, and low-pressure.
              </p>
            </div>
          )}

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

        {draft.status === "SENT" && (
          <div className="rounded-xl border border-green-800 bg-green-950/30 p-5">
            <p className="text-sm text-green-400 font-medium">
              This draft has already been sent and cannot be edited.
            </p>
            <p className="text-xs text-green-500/70 mt-1">
              View the send history for delivery details.
            </p>
          </div>
        )}

        {draft.status === "CANCELLED" && (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/30 p-5">
            <p className="text-sm text-zinc-400 font-medium">
              This draft has been cancelled and is read-only.
            </p>
          </div>
        )}

        {readOnly ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Subject
              </label>
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-300">
                {draft.subject}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Body
              </label>
              <div className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-300 whitespace-pre-wrap font-mono min-h-[200px]">
                {draft.body}
              </div>
            </div>
            <Link
              href={`/campaigns/${campaignId}/emails`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 px-5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Back to Queue
            </Link>
          </div>
        ) : (
          <EmailDraftForm
            draftId={draft.id}
            campaignId={campaignId}
            initial={{
              subject: draft.subject,
              body: draft.body,
              status: draft.status,
            }}
          />
        )}
      </main>
    </div>
  );
}
