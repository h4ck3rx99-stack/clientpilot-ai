import { prisma } from "./prisma";

export type ActivityInput = {
  leadId: string;
  campaignId: string;
  type: string;
  message: string;
};

export async function createLeadActivity(userId: string, input: ActivityInput) {
  return prisma.leadActivity.create({
    data: {
      userId,
      leadId: input.leadId,
      campaignId: input.campaignId,
      type: input.type,
      message: input.message,
    },
  });
}

export async function getLeadActivities(leadId: string) {
  return prisma.leadActivity.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRecentActivitiesForCampaign(
  campaignId: string,
  limit = 5
) {
  return prisma.leadActivity.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      lead: { select: { companyName: true } },
    },
  });
}

export async function getRecentActivities(userId: string, limit = 5) {
  return prisma.leadActivity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      lead: { select: { companyName: true } },
      campaign: { select: { name: true, id: true } },
    },
  });
}
