import { prisma } from "./prisma";
import { isUnsubscribedPlaceholder } from "./compliance";
import { createLeadActivity } from "./lead-activity";

function getLocalDateBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

export async function getTodaySendCountForCampaign(
  campaignId: string
): Promise<number> {
  const { start, end } = getLocalDateBoundaries();
  return prisma.emailSendLog.count({
    where: {
      campaignId,
      status: "SENT",
      simulated: true,
      sentAt: { gte: start, lt: end },
    },
  });
}

export type CanSendResult = {
  allowed: boolean;
  reasons: string[];
};

export async function canSendDraft(draftId: string): Promise<CanSendResult> {
  const reasons: string[] = [];

  const draft = await prisma.emailDraft.findUnique({
    where: { id: draftId },
    include: {
      lead: true,
    },
  });

  if (!draft) {
    return { allowed: false, reasons: ["Draft not found."] };
  }

  if (draft.status !== "QUEUED") {
    reasons.push(`Draft status must be QUEUED (current: ${draft.status}).`);
  }

  const lead = draft.lead;
  if (!lead || !lead.email) {
    reasons.push("Lead not found or missing email.");
  } else {
    if (!lead.email.includes("@")) {
      reasons.push("Lead email is invalid.");
    }
    if (!lead.sourceUrl || !lead.sourceUrl.startsWith("http")) {
      reasons.push("Lead missing source URL for compliance.");
    }
    if (lead.status === "UNSUBSCRIBED") {
      reasons.push("Lead has unsubscribed.");
    }

    const unsubscribed = await isUnsubscribedPlaceholder(lead.email);
    if (unsubscribed) {
      reasons.push("Email is in the unsubscribe list.");
    }
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: lead?.campaignId || "" },
  });

  if (!campaign) {
    reasons.push("Campaign not found.");
  } else {
    if (campaign.status !== "ACTIVE") {
      reasons.push(
        `Campaign must be ACTIVE (current: ${campaign.status}).`
      );
    }
    if (lead && lead.fitScore < campaign.minimumFitScore) {
      reasons.push(
        `Lead fit score (${lead.fitScore}) is below campaign threshold (${campaign.minimumFitScore}).`
      );
    }

    const todayCount = await getTodaySendCountForCampaign(campaign.id);
    if (todayCount >= campaign.dailySendLimit) {
      reasons.push(
        `Daily send limit reached (${todayCount}/${campaign.dailySendLimit}).`
      );
    }
  }

  if (draft.status === "SENT") {
    reasons.push("This draft has already been sent.");
  }

  const previousSent = await prisma.emailSendLog.findFirst({
    where: { emailDraftId: draftId, status: "SENT" },
  });
  if (previousSent) {
    reasons.push("A send log with SENT status already exists for this draft.");
  }

  return { allowed: reasons.length === 0, reasons };
}

export type SendResult = {
  status: "sent" | "skipped" | "failed";
  companyName: string;
  email: string;
  reason?: string;
};

export async function simulateSendDraft(
  draftId: string
): Promise<SendResult> {
  const draft = await prisma.emailDraft.findUnique({
    where: { id: draftId },
    include: {
      lead: { include: { campaign: true } },
    },
  });

  if (!draft || !draft.lead) {
    return {
      status: "failed",
      companyName: "Unknown",
      email: "Unknown",
      reason: "Draft or lead not found.",
    };
  }

  const { allowed, reasons } = await canSendDraft(draftId);

  if (!allowed) {
    await prisma.emailSendLog.create({
      data: {
        emailDraftId: draft.id,
        campaignId: draft.lead.campaignId,
        leadId: draft.lead.id,
        recipientEmail: draft.lead.email || "unknown",
        subject: draft.subject,
        status: "SKIPPED",
        reason: reasons.join("; "),
        simulated: true,
      },
    });

    await createLeadActivity({
      leadId: draft.lead.id,
      campaignId: draft.lead.campaignId,
      type: "SEND_SKIPPED",
      message: `Send skipped for ${draft.lead.email}: ${reasons.join("; ")}.`,
    });

    return {
      status: "skipped",
      companyName: draft.lead.companyName,
      email: draft.lead.email || "",
      reason: reasons.join("; "),
    };
  }

  try {
    const now = new Date();

    await prisma.emailSendLog.create({
      data: {
        emailDraftId: draft.id,
        campaignId: draft.lead.campaignId,
        leadId: draft.lead.id,
        recipientEmail: draft.lead.email || "",
        subject: draft.subject,
        status: "SENT",
        simulated: true,
        sentAt: now,
      },
    });

    await prisma.emailDraft.update({
      where: { id: draft.id },
      data: { status: "SENT", sentAt: now },
    });

    const isFollowUp = draft.type === "FOLLOW_UP" || draft.followUpNumber > 0;

    const leadUpdateData: Record<string, unknown> = {
      status: "SENT",
      lastContactedAt: now,
    };

    if (isFollowUp) {
      const keepStatuses = ["INTERESTED", "REPLIED", "MEETING_BOOKED"];
      if (!keepStatuses.includes(draft.lead.pipelineStatus)) {
        leadUpdateData.pipelineStatus = "FOLLOW_UP";
      }
    } else {
      leadUpdateData.pipelineStatus = "CONTACTED";
    }

    await prisma.lead.update({
      where: { id: draft.lead.id },
      data: leadUpdateData,
    });

    if (isFollowUp) {
      await createLeadActivity({
        leadId: draft.lead.id,
        campaignId: draft.lead.campaignId,
        type: "FOLLOW_UP_SENT_SIMULATED",
        message: `Simulated follow-up #${draft.followUpNumber} sent to ${draft.lead.email}.`,
      });
    } else {
      await createLeadActivity({
        leadId: draft.lead.id,
        campaignId: draft.lead.campaignId,
        type: "EMAIL_SENT_SIMULATED",
        message: `Simulated email sent to ${draft.lead.email}.`,
      });
    }

    return {
      status: "sent",
      companyName: draft.lead.companyName,
      email: draft.lead.email || "",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    await prisma.emailSendLog.create({
      data: {
        emailDraftId: draft.id,
        campaignId: draft.lead.campaignId,
        leadId: draft.lead.id,
        recipientEmail: draft.lead.email || "unknown",
        subject: draft.subject,
        status: "FAILED",
        reason: msg,
        simulated: true,
      },
    });

    return {
      status: "failed",
      companyName: draft.lead.companyName,
      email: draft.lead.email || "",
      reason: msg,
    };
  }
}

export type BatchSendSummary = {
  sent: number;
  skipped: number;
  failed: number;
  remainingCapacity: number;
  results: SendResult[];
};

export async function simulateSendQueuedEmailsForCampaign(
  campaignId: string
): Promise<BatchSendSummary> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    return { sent: 0, skipped: 0, failed: 0, remainingCapacity: 0, results: [] };
  }

  const todayCount = await getTodaySendCountForCampaign(campaignId);
  const remaining = Math.max(0, campaign.dailySendLimit - todayCount);

  const queuedDrafts = await prisma.emailDraft.findMany({
    where: {
      lead: { campaignId },
      status: "QUEUED",
    },
    orderBy: { createdAt: "asc" },
    include: {
      lead: {
        select: {
          id: true,
          companyName: true,
          email: true,
          fitScore: true,
          sourceUrl: true,
          status: true,
          campaignId: true,
        },
      },
    },
  });

  if (remaining <= 0) {
    return {
      sent: 0,
      skipped: 0,
      failed: 0,
      remainingCapacity: 0,
      results: queuedDrafts.map((d) => ({
        status: "skipped" as const,
        companyName: d.lead.companyName,
        email: d.lead.email || "",
        reason: "Daily send limit already reached.",
      })),
    };
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const results: SendResult[] = [];

  for (const draft of queuedDrafts) {
    if (sentCount >= remaining) {
      results.push({
        status: "skipped",
        companyName: draft.lead.companyName,
        email: draft.lead.email || "",
        reason: "Daily send limit reached.",
      });
      skippedCount++;
      continue;
    }

    const result = await simulateSendDraft(draft.id);
    results.push(result);

    if (result.status === "sent") sentCount++;
    else if (result.status === "skipped") skippedCount++;
    else if (result.status === "failed") failedCount++;
  }

  const finalRemaining = Math.max(0, remaining - sentCount);

  return {
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    remainingCapacity: finalRemaining,
    results,
  };
}
