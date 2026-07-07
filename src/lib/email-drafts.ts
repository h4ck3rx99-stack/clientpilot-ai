import { prisma } from "./prisma";

export type EmailDraftInput = {
  subject: string;
  body: string;
  status?: string;
  type?: string;
  followUpNumber?: number;
};

export async function getEmailDraftsByCampaignId(userId: string, campaignId: string) {
  return prisma.emailDraft.findMany({
    where: { userId, lead: { campaignId } },
    orderBy: { createdAt: "desc" },
    include: {
      lead: {
        select: { companyName: true, email: true, fitScore: true },
      },
    },
  });
}

export async function getEmailDraftById(userId: string, id: string) {
  return prisma.emailDraft.findFirst({
    where: { id, userId },
    include: {
      lead: {
        select: {
          companyName: true,
          email: true,
          fitScore: true,
          industry: true,
          painPoint: true,
          offerAngle: true,
          personalizationLine: true,
          sourceUrl: true,
          campaignId: true,
          pipelineStatus: true,
        },
      },
    },
  });
}

export async function createDraftForLead(
  leadId: string,
  data: { subject: string; body: string; status?: string; type?: string; followUpNumber?: number }
) {
  return prisma.emailDraft.create({
    data: {
      leadId,
      subject: data.subject,
      body: data.body,
      status: data.status || "DRAFT",
      type: data.type || "INITIAL",
      followUpNumber: data.followUpNumber ?? 0,
    },
  });
}

export async function updateEmailDraft(
  id: string,
  data: Partial<EmailDraftInput>
) {
  return prisma.emailDraft.update({
    where: { id },
    data: {
      ...(data.subject !== undefined && { subject: data.subject }),
      ...(data.body !== undefined && { body: data.body }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.followUpNumber !== undefined && {
        followUpNumber: data.followUpNumber,
      }),
    },
  });
}

export async function updateEmailDraftStatus(
  id: string,
  status: "DRAFT" | "QUEUED" | "SENT" | "FAILED" | "CANCELLED"
) {
  return prisma.emailDraft.update({
    where: { id },
    data: { status },
  });
}

export async function getEmailDraftStatsForCampaign(campaignId: string) {
  const [total, draft, queued, sent, cancelled] = await Promise.all([
    prisma.emailDraft.count({ where: { lead: { campaignId } } }),
    prisma.emailDraft.count({
      where: { lead: { campaignId }, status: "DRAFT" },
    }),
    prisma.emailDraft.count({
      where: { lead: { campaignId }, status: "QUEUED" },
    }),
    prisma.emailDraft.count({
      where: { lead: { campaignId }, status: "SENT" },
    }),
    prisma.emailDraft.count({
      where: { lead: { campaignId }, status: "CANCELLED" },
    }),
  ]);

  return { total, draft, queued, sent, cancelled };
}

export async function getRecentDraftsForCampaign(
  campaignId: string,
  limit = 5
) {
  return prisma.emailDraft.findMany({
    where: { lead: { campaignId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      lead: { select: { companyName: true, email: true } },
    },
  });
}

export async function hasActiveDraftForLead(leadId: string): Promise<boolean> {
  const count = await prisma.emailDraft.count({
    where: {
      leadId,
      status: { in: ["DRAFT", "QUEUED"] },
    },
  });
  return count > 0;
}
