import { prisma } from "./prisma";
import { isUnsubscribedPlaceholder } from "./compliance";
import { createLeadActivity } from "./lead-activity";
import { sendEmailWithProvider, getEmailProvider } from "./email";
import { getOrCreateUnsubscribeToken, buildUnsubscribeUrl } from "./unsubscribe";

function getLocalDateBoundaries(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

export async function getTodaySendCountForCampaign(
  userId: string,
  campaignId: string
): Promise<number> {
  const { start, end } = getLocalDateBoundaries();
  return prisma.emailSendLog.count({
    where: {
      campaign: { userId },
      campaignId,
      status: "SENT",
      simulated: true,
      sentAt: { gte: start, lt: end },
    },
  });
}

export async function getTodayRealSendCount(): Promise<number> {
  const { start, end } = getLocalDateBoundaries();
  return prisma.emailSendLog.count({
    where: {
      status: "SENT",
      realSend: true,
      sentAt: { gte: start, lt: end },
    },
  });
}

export async function getTodayRealSendCountForCampaign(
  campaignId: string
): Promise<number> {
  const { start, end } = getLocalDateBoundaries();
  return prisma.emailSendLog.count({
    where: {
      campaignId,
      status: "SENT",
      realSend: true,
      sentAt: { gte: start, lt: end },
    },
  });
}

export type CanSendResult = {
  allowed: boolean;
  reasons: string[];
};

export async function canSendDraft(userId: string, draftId: string): Promise<CanSendResult> {
  const reasons: string[] = [];

  const draft = await prisma.emailDraft.findFirst({
    where: { id: draftId, userId },
    include: { lead: true },
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
      reasons.push(`Campaign must be ACTIVE (current: ${campaign.status}).`);
    }
    if (lead && lead.fitScore < campaign.minimumFitScore) {
      reasons.push(`Lead fit score (${lead.fitScore}) is below campaign threshold (${campaign.minimumFitScore}).`);
    }

    const todayCount = await getTodaySendCountForCampaign(userId, campaign.id);
    if (todayCount >= campaign.dailySendLimit) {
      reasons.push(`Daily send limit reached (${todayCount}/${campaign.dailySendLimit}).`);
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
  userId: string,
  draftId: string
): Promise<SendResult> {
  const draft = await prisma.emailDraft.findFirst({
    where: { id: draftId, userId },
    include: { lead: { include: { campaign: true } } },
  });

  if (!draft || !draft.lead) {
    return { status: "failed", companyName: "Unknown", email: "Unknown", reason: "Draft or lead not found." };
  }

  const { allowed, reasons } = await canSendDraft(userId, draftId);

  if (!allowed) {
    await prisma.emailSendLog.create({
      data: {
        userId,
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

    await createLeadActivity(userId, {
      leadId: draft.lead.id,
      campaignId: draft.lead.campaignId,
      type: "SEND_SKIPPED",
      message: `Send skipped for ${draft.lead.email}: ${reasons.join("; ")}.`,
    });

    return { status: "skipped", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: reasons.join("; ") };
  }

  try {
    const now = new Date();

    await prisma.emailSendLog.create({
      data: {
        userId,
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
    const leadUpdateData: Record<string, unknown> = { status: "SENT", lastContactedAt: now };

    if (isFollowUp) {
      const keepStatuses = ["INTERESTED", "REPLIED", "MEETING_BOOKED"];
      if (!keepStatuses.includes(draft.lead.pipelineStatus)) {
        leadUpdateData.pipelineStatus = "FOLLOW_UP";
      }
    } else {
      leadUpdateData.pipelineStatus = "CONTACTED";
    }

    await prisma.lead.update({ where: { id: draft.lead.id }, data: leadUpdateData });

    if (isFollowUp) {
      await createLeadActivity(userId, {
        leadId: draft.lead.id,
        campaignId: draft.lead.campaignId,
        type: "FOLLOW_UP_SENT_SIMULATED",
        message: `Simulated follow-up #${draft.followUpNumber} sent to ${draft.lead.email}.`,
      });
    } else {
      await createLeadActivity(userId, {
        leadId: draft.lead.id,
        campaignId: draft.lead.campaignId,
        type: "EMAIL_SENT_SIMULATED",
        message: `Simulated email sent to ${draft.lead.email}.`,
      });
    }

    return { status: "sent", companyName: draft.lead.companyName, email: draft.lead.email || "" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    await prisma.emailSendLog.create({
      data: {
        userId,
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

    return { status: "failed", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: msg };
  }
}

export async function sendDraft(userId: string, draftId: string): Promise<SendResult> {
  const draft = await prisma.emailDraft.findFirst({
    where: { id: draftId, userId },
    include: { lead: { include: { campaign: true } } },
  });

  if (!draft || !draft.lead) {
    return { status: "failed", companyName: "Unknown", email: "Unknown", reason: "Draft or lead not found." };
  }

  const { allowed, reasons } = await canSendDraft(userId, draftId);
  if (!allowed) {
    await prisma.emailSendLog.create({
      data: {
        userId,
        emailDraftId: draft.id,
        campaignId: draft.lead.campaignId,
        leadId: draft.lead.id,
        recipientEmail: draft.lead.email || "unknown",
        subject: draft.subject,
        status: "SKIPPED",
        reason: reasons.join("; "),
        simulated: false,
        realSend: process.env.EMAIL_MODE === "smtp",
        provider: process.env.EMAIL_MODE === "smtp" ? "smtp" : "simulation",
      },
    });

    await createLeadActivity(userId, {
      leadId: draft.lead.id,
      campaignId: draft.lead.campaignId,
      type: "SEND_SKIPPED",
      message: `Send skipped for ${draft.lead.email}: ${reasons.join("; ")}.`,
    });

    return { status: "skipped", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: reasons.join("; ") };
  }

  const provider = getEmailProvider();

  if (provider.name === "simulation") {
    return simulateSendDraft(userId, draftId);
  }

  // Real SMTP sending
  try {
    const realDailyLimit = parseInt(process.env.REAL_SEND_DAILY_LIMIT || "20", 10);
    const todayRealCount = await getTodayRealSendCount();
    if (todayRealCount >= realDailyLimit) {
      await createSkipLog(userId, draft, `Real send daily limit reached (${todayRealCount}/${realDailyLimit})`);
      return { status: "skipped", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: "Real send daily limit reached." };
    }

    const campaignRealCount = await getTodayRealSendCountForCampaign(draft.lead.campaignId);
    if (campaignRealCount >= draft.lead.campaign.dailySendLimit) {
      await createSkipLog(userId, draft, `Campaign daily send limit reached (${campaignRealCount}/${draft.lead.campaign.dailySendLimit})`);
      return { status: "skipped", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: "Campaign daily send limit reached." };
    }

    const token = await getOrCreateUnsubscribeToken(userId, draft.lead.email!, draft.lead.campaignId, draft.lead.id);
    const unsubscribeUrl = buildUnsubscribeUrl(token);

    const fromName = process.env.SMTP_FROM_NAME || "";
    const fromEmail = process.env.SMTP_FROM_EMAIL || "";

    const result = await sendEmailWithProvider({
      to: draft.lead.email!,
      subject: draft.subject,
      body: draft.body,
      fromName,
      fromEmail,
      unsubscribeUrl,
    });

    if (result.success) {
      const now = new Date();

      await prisma.emailSendLog.create({
        data: {
          userId,
          emailDraftId: draft.id,
          campaignId: draft.lead.campaignId,
          leadId: draft.lead.id,
          recipientEmail: draft.lead.email || "",
          subject: draft.subject,
          status: "SENT",
          simulated: false,
          realSend: true,
          provider: "smtp",
          messageId: result.messageId || null,
          sentAt: now,
        },
      });

      await prisma.emailDraft.update({
        where: { id: draft.id },
        data: { status: "SENT", sentAt: now },
      });

      const isFollowUp = draft.type === "FOLLOW_UP" || draft.followUpNumber > 0;
      const leadUpdateData: Record<string, unknown> = { status: "SENT", lastContactedAt: now };

      if (isFollowUp) {
        const keepStatuses = ["INTERESTED", "REPLIED", "MEETING_BOOKED"];
        if (!keepStatuses.includes(draft.lead.pipelineStatus)) {
          leadUpdateData.pipelineStatus = "FOLLOW_UP";
        }
      } else {
        leadUpdateData.pipelineStatus = "CONTACTED";
      }

      await prisma.lead.update({ where: { id: draft.lead.id }, data: leadUpdateData });

      await createLeadActivity(userId, {
        leadId: draft.lead.id,
        campaignId: draft.lead.campaignId,
        type: "EMAIL_SENT_REAL",
        message: `Real email sent to ${draft.lead.email} via SMTP.`,
      });

      return { status: "sent", companyName: draft.lead.companyName, email: draft.lead.email || "" };
    }

    await prisma.emailSendLog.create({
      data: {
        userId,
        emailDraftId: draft.id,
        campaignId: draft.lead.campaignId,
        leadId: draft.lead.id,
        recipientEmail: draft.lead.email || "unknown",
        subject: draft.subject,
        status: "FAILED",
        reason: result.error || "SMTP send failed",
        simulated: false,
        realSend: true,
        provider: "smtp",
      },
    });

    await createLeadActivity(userId, {
      leadId: draft.lead.id,
      campaignId: draft.lead.campaignId,
      type: "EMAIL_SEND_FAILED",
      message: result.error || "SMTP send failed",
    });

    return { status: "failed", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: result.error || "SMTP send failed" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    await prisma.emailSendLog.create({
      data: {
        userId,
        emailDraftId: draft.id,
        campaignId: draft.lead.campaignId,
        leadId: draft.lead.id,
        recipientEmail: draft.lead.email || "unknown",
        subject: draft.subject,
        status: "FAILED",
        reason: msg,
        simulated: false,
        realSend: true,
        provider: "smtp",
      },
    });

    return { status: "failed", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: msg };
  }
}

async function createSkipLog(
  userId: string,
  draft: { id: string; subject: string; lead: { campaignId: string; id: string; companyName: string; email: string | null } },
  reason: string
) {
  await prisma.emailSendLog.create({
    data: {
      userId,
      emailDraftId: draft.id,
      campaignId: draft.lead.campaignId,
      leadId: draft.lead.id,
      recipientEmail: draft.lead.email || "unknown",
      subject: draft.subject,
      status: "SKIPPED",
      reason,
      simulated: false,
      realSend: true,
      provider: "smtp",
    },
  });
}

export type BatchSendSummary = {
  sent: number;
  skipped: number;
  failed: number;
  remainingCapacity: number;
  provider: string;
  results: SendResult[];
};

export async function simulateSendQueuedEmailsForCampaign(
  userId: string,
  campaignId: string
): Promise<BatchSendSummary> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId, userId } });
  if (!campaign) {
    return { sent: 0, skipped: 0, failed: 0, remainingCapacity: 0, provider: "simulation", results: [] };
  }

  const todayCount = await getTodaySendCountForCampaign(userId, campaignId);
  const remaining = Math.max(0, campaign.dailySendLimit - todayCount);

  const queuedDrafts = await prisma.emailDraft.findMany({
    where: { lead: { campaignId }, status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    include: {
      lead: {
        select: { id: true, companyName: true, email: true, fitScore: true, sourceUrl: true, status: true, campaignId: true },
      },
    },
  });

  if (remaining <= 0) {
    return {
      sent: 0, skipped: 0, failed: 0, remainingCapacity: 0, provider: "simulation",
      results: queuedDrafts.map((d) => ({
        status: "skipped" as const,
        companyName: d.lead.companyName,
        email: d.lead.email || "",
        reason: "Daily send limit already reached.",
      })),
    };
  }

  let sentCount = 0, skippedCount = 0, failedCount = 0;
  const results: SendResult[] = [];

  for (const draft of queuedDrafts) {
    if (sentCount >= remaining) {
      results.push({ status: "skipped", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: "Daily send limit reached." });
      skippedCount++;
      continue;
    }

    const result = await simulateSendDraft(userId, draft.id);
    results.push(result);
    if (result.status === "sent") sentCount++;
    else if (result.status === "skipped") skippedCount++;
    else if (result.status === "failed") failedCount++;
  }

  return {
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    remainingCapacity: Math.max(0, remaining - sentCount),
    provider: "simulation",
    results,
  };
}

export async function sendQueuedEmailsForCampaign(
  userId: string,
  campaignId: string
): Promise<BatchSendSummary> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId, userId } });
  if (!campaign) {
    return { sent: 0, skipped: 0, failed: 0, remainingCapacity: 0, provider: "unknown", results: [] };
  }

  const provider = getEmailProvider();
  const mode = provider.name;

  if (mode === "simulation") {
    return simulateSendQueuedEmailsForCampaign(userId, campaignId);
  }

  const realDailyLimit = parseInt(process.env.REAL_SEND_DAILY_LIMIT || "20", 10);
  const batchLimit = parseInt(process.env.REAL_SEND_BATCH_LIMIT || "10", 10);
  const delayMs = parseInt(process.env.REAL_SEND_DELAY_MS || "5000", 10);

  const todayRealCount = await getTodayRealSendCount();
  const campaignRealCount = await getTodayRealSendCountForCampaign(campaignId);

  const remainingGlobal = Math.max(0, realDailyLimit - todayRealCount);
  const remainingCampaign = Math.max(0, campaign.dailySendLimit - campaignRealCount);
  const remaining = Math.min(remainingGlobal, remainingCampaign, batchLimit);

  const queuedDrafts = await prisma.emailDraft.findMany({
    where: { lead: { campaignId }, status: "QUEUED" },
    orderBy: { createdAt: "asc" },
    include: {
      lead: {
        select: { id: true, companyName: true, email: true, fitScore: true, sourceUrl: true, status: true, campaignId: true },
      },
    },
  });

  if (remaining <= 0) {
    return {
      sent: 0, skipped: 0, failed: 0, remainingCapacity: 0, provider: "smtp",
      results: queuedDrafts.map((d) => ({
        status: "skipped" as const,
        companyName: d.lead.companyName,
        email: d.lead.email || "",
        reason: "Daily send limit reached.",
      })),
    };
  }

  let sentCount = 0, skippedCount = 0, failedCount = 0;
  const results: SendResult[] = [];

  for (const draft of queuedDrafts) {
    if (sentCount >= remaining) {
      results.push({ status: "skipped", companyName: draft.lead.companyName, email: draft.lead.email || "", reason: "Batch/daily limit reached." });
      skippedCount++;
      continue;
    }

    const result = await sendDraft(userId, draft.id);
    results.push(result);
    if (result.status === "sent") sentCount++;
    else if (result.status === "skipped") skippedCount++;
    else if (result.status === "failed") failedCount++;

    if (result.status === "sent" && sentCount < remaining) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return {
    sent: sentCount,
    skipped: skippedCount,
    failed: failedCount,
    remainingCapacity: Math.max(0, remaining - sentCount),
    provider: "smtp",
    results,
  };
}
