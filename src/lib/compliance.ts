import { prisma } from "./prisma";

export function hasSourceUrl(sourceUrl: string | null | undefined): boolean {
  return !!sourceUrl && /^https?:\/\/.+/.test(sourceUrl.trim());
}

export function meetsFitScoreThreshold(
  fitScore: number,
  threshold: number
): boolean {
  return fitScore >= threshold;
}

export function canQueueEmail(status: string | null | undefined): boolean {
  if (!status) return true;
  return !["SENT", "UNSUBSCRIBED", "CANCELLED"].includes(status);
}

export async function isUnsubscribedPlaceholder(
  email: string
): Promise<boolean> {
  const existing = await prisma.unsubscribe.findUnique({
    where: { email },
  });
  return existing !== null;
}

export async function underDailyLimitPlaceholder(): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sentToday = await prisma.emailDraft.count({
    where: {
      status: "SENT",
      sentAt: { gte: today },
    },
  });

  return sentToday < 20;
}

export type CanGenerateDraftInput = {
  profileExists: boolean;
  hasSourceUrl: boolean;
  hasValidEmail: boolean;
  leadStatus: string;
  fitScore: number;
  minimumFitScore: number;
  isUnsubscribed: boolean;
  hasActiveDraft: boolean;
};

export function canGenerateDraft(
  input: CanGenerateDraftInput
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!input.profileExists) {
    reasons.push("Create your profile before generating outreach drafts.");
  }
  if (!input.hasSourceUrl) {
    reasons.push("Lead must have a source URL for compliance.");
  }
  if (!input.hasValidEmail) {
    reasons.push("Lead must have a valid email address.");
  }
  if (input.leadStatus !== "ANALYZED") {
    reasons.push(
      `Lead status must be ANALYZED (current: ${input.leadStatus}).`
    );
  }
  if (!meetsFitScoreThreshold(input.fitScore, input.minimumFitScore)) {
    reasons.push(
      `Lead fit score (${input.fitScore}) is below campaign threshold (${input.minimumFitScore}).`
    );
  }
  if (input.isUnsubscribed) {
    reasons.push("This email address has unsubscribed.");
  }
  if (input.hasActiveDraft) {
    reasons.push("An active draft already exists for this lead.");
  }

  return { allowed: reasons.length === 0, reasons };
}

export function generateDraftStatus(
  leadStatus: string,
  fitScore: number,
  minimumFitScore: number
): "DRAFT" | null {
  if (leadStatus === "ANALYZED" && fitScore >= minimumFitScore) {
    return "DRAFT";
  }
  return null;
}

export type CanGenerateFollowUpDraftInput = {
  profileExists: boolean;
  campaignExists: boolean;
  leadExists: boolean;
  hasValidEmail: boolean;
  hasSourceUrl: boolean;
  isUnsubscribed: boolean;
  leadPipelineStatus: string;
  hasSentInitial: boolean;
  existingFollowUpCount: number;
  hasActiveFollowUpDraft: boolean;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
};

export function canGenerateFollowUpDraft(
  input: CanGenerateFollowUpDraftInput
): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!input.profileExists)
    reasons.push("Create your profile before generating follow-up drafts.");
  if (!input.campaignExists) reasons.push("Campaign not found.");
  if (!input.leadExists) reasons.push("Lead not found.");
  if (!input.hasValidEmail) reasons.push("Lead must have a valid email address.");
  if (!input.hasSourceUrl)
    reasons.push("Lead must have a source URL for compliance.");
  if (input.isUnsubscribed) reasons.push("This email has unsubscribed.");

  const badStatuses = ["NOT_INTERESTED", "MEETING_BOOKED", "WON", "LOST"];
  if (badStatuses.includes(input.leadPipelineStatus)) {
    reasons.push(
      `Pipeline status "${input.leadPipelineStatus}" is not eligible for follow-ups.`
    );
  }

  const allowedStatuses = ["CONTACTED", "REPLIED", "INTERESTED", "FOLLOW_UP"];
  if (!allowedStatuses.includes(input.leadPipelineStatus)) {
    reasons.push(
      `Lead must be CONTACTED, REPLIED, INTERESTED, or FOLLOW_UP (current: ${input.leadPipelineStatus}).`
    );
  }

  if (!input.hasSentInitial)
    reasons.push("Lead must have a sent initial email before follow-up.");

  if (input.existingFollowUpCount >= 2)
    reasons.push("Maximum 2 follow-ups per lead reached.");

  if (input.hasActiveFollowUpDraft)
    reasons.push(
      "An active follow-up draft already exists for this lead."
    );

  if (input.nextFollowUpAt && input.nextFollowUpAt > new Date()) {
    reasons.push("Follow-up is not due yet based on nextFollowUpAt.");
  }

  if (!input.nextFollowUpAt) {
    if (!input.lastContactedAt) {
      reasons.push("Lead has not been contacted yet.");
    } else {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      if (input.lastContactedAt > twoDaysAgo) {
        reasons.push(
          "Last contact was less than 2 days ago. Wait before follow-up."
        );
      }
    }
  }

  return { allowed: reasons.length === 0, reasons };
}
