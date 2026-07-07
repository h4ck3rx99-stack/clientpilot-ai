import { prisma } from "./prisma";
import { canGenerateFollowUpDraft } from "./compliance";
import { generateFollowUpEmail } from "./email-template";
import { createLeadActivity } from "./lead-activity";

export type FollowUpCandidate = {
  leadId: string;
  companyName: string;
  email: string | null;
  pipelineStatus: string;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
  fitScore: number;
  existingFollowUpCount: number;
};

export async function getFollowUpCandidatesForCampaign(
  campaignId: string
): Promise<FollowUpCandidate[]> {
  const leads = await prisma.lead.findMany({
    where: { campaignId },
    include: {
      emailDrafts: {
        where: { type: "FOLLOW_UP" },
        select: { id: true },
      },
    },
  });

  return leads.map((l) => ({
    leadId: l.id,
    companyName: l.companyName,
    email: l.email,
    pipelineStatus: l.pipelineStatus,
    lastContactedAt: l.lastContactedAt,
    nextFollowUpAt: l.nextFollowUpAt,
    fitScore: l.fitScore,
    existingFollowUpCount: l.emailDrafts.length,
  }));
}

export type GenerateFollowUpResult = {
  status: "generated" | "skipped" | "failed";
  companyName: string;
  email: string;
  reason?: string;
};

export async function generateFollowUpDraftForLead(
  leadId: string
): Promise<GenerateFollowUpResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { campaign: true, emailDrafts: true },
  });

  if (!lead) {
    return {
      status: "failed",
      companyName: "Unknown",
      email: "Unknown",
      reason: "Lead not found.",
    };
  }

  const profile = await prisma.userProfile.findFirst();
  const existingFollowUps = lead.emailDrafts.filter(
    (d) => d.type === "FOLLOW_UP"
  );
  const hasSentInitial = lead.emailDrafts.some(
    (d) => d.type === "INITIAL" && d.status === "SENT"
  );
  const hasActiveFollowUpDraft = existingFollowUps.some((d) =>
    ["DRAFT", "QUEUED"].includes(d.status)
  );

  const unsubscribed = await prisma.unsubscribe.findUnique({
    where: { email: lead.email?.toLowerCase().trim() || "" },
  });

  const compliance = canGenerateFollowUpDraft({
    profileExists: !!profile,
    campaignExists: !!lead.campaign,
    leadExists: true,
    hasValidEmail: !!lead.email && lead.email.includes("@"),
    hasSourceUrl: !!lead.sourceUrl && lead.sourceUrl.startsWith("http"),
    isUnsubscribed: !!unsubscribed,
    leadPipelineStatus: lead.pipelineStatus,
    hasSentInitial,
    existingFollowUpCount: existingFollowUps.length,
    hasActiveFollowUpDraft,
    lastContactedAt: lead.lastContactedAt,
    nextFollowUpAt: lead.nextFollowUpAt,
  });

  if (!compliance.allowed) {
    return {
      status: "skipped",
      companyName: lead.companyName,
      email: lead.email || "",
      reason: compliance.reasons.join("; "),
    };
  }

  try {
    const nextNumber = existingFollowUps.length + 1;
    const { subject, body } = generateFollowUpEmail({
      businessName: profile?.businessName,
      senderName: profile?.senderName,
      services: profile?.services,
      serviceToPitch: lead.campaign.serviceToPitch || undefined,
      cta: lead.campaign.cta || undefined,
      companyName: lead.companyName,
      industry: lead.industry,
      painPoint: lead.painPoint,
      offerAngle: lead.offerAngle,
      personalizationLine: lead.personalizationLine,
      followUpNumber: nextNumber,
    });

    await prisma.emailDraft.create({
      data: {
        leadId: lead.id,
        subject,
        body,
        status: "DRAFT",
        type: "FOLLOW_UP",
        followUpNumber: nextNumber,
      },
    });

    await createLeadActivity({
      leadId: lead.id,
      campaignId: lead.campaignId,
      type: "FOLLOW_UP_DRAFT_GENERATED",
      message: `Follow-up draft #${nextNumber} generated.`,
    });

    return {
      status: "generated",
      companyName: lead.companyName,
      email: lead.email || "",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return {
      status: "failed",
      companyName: lead.companyName,
      email: lead.email || "",
      reason: msg,
    };
  }
}

export type BatchFollowUpSummary = {
  generated: number;
  skipped: number;
  failed: number;
  results: GenerateFollowUpResult[];
};

export async function generateFollowUpsForCampaign(
  campaignId: string
): Promise<BatchFollowUpSummary> {
  const candidates = await getFollowUpCandidatesForCampaign(campaignId);
  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const results: GenerateFollowUpResult[] = [];

  for (const c of candidates) {
    const result = await generateFollowUpDraftForLead(c.leadId);
    results.push(result);
    if (result.status === "generated") generated++;
    else if (result.status === "skipped") skipped++;
    else if (result.status === "failed") failed++;
  }

  return { generated, skipped, failed, results };
}

export async function getFollowUpStatsForCampaign(campaignId: string) {
  const now = new Date();

  const [due, pendingReview, queued, sent] = await Promise.all([
    prisma.lead.count({
      where: {
        campaignId,
        pipelineStatus: { in: ["FOLLOW_UP", "INTERESTED", "REPLIED"] },
        nextFollowUpAt: { lte: now },
      },
    }),
    prisma.emailDraft.count({
      where: {
        lead: { campaignId },
        type: "FOLLOW_UP",
        status: "DRAFT",
      },
    }),
    prisma.emailDraft.count({
      where: {
        lead: { campaignId },
        type: "FOLLOW_UP",
        status: "QUEUED",
      },
    }),
    prisma.emailDraft.count({
      where: {
        lead: { campaignId },
        type: "FOLLOW_UP",
        status: "SENT",
      },
    }),
  ]);

  return { due, pendingReview, queued, sent };
}
