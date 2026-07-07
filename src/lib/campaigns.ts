import { prisma } from "./prisma";

export type CampaignInput = {
  name: string;
  serviceToPitch: string;
  targetNiche: string;
  targetLocation: string;
  offer: string;
  cta: string;
  dailySendLimit?: number;
  minimumFitScore?: number;
};

export async function getCampaigns(userId: string) {
  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });
}

export async function getCampaignById(userId: string, id: string) {
  return prisma.campaign.findFirst({
    where: { id, userId },
    include: { _count: { select: { leads: true } } },
  });
}

export async function createCampaign(userId: string, data: CampaignInput) {
  return prisma.campaign.create({
    data: {
      userId,
      name: data.name,
      serviceToPitch: data.serviceToPitch,
      targetNiche: data.targetNiche,
      targetLocation: data.targetLocation,
      offer: data.offer,
      cta: data.cta,
      dailySendLimit: data.dailySendLimit ?? 20,
      minimumFitScore: data.minimumFitScore ?? 60,
      status: "DRAFT",
    },
  });
}

export async function updateCampaign(userId: string, id: string, data: CampaignInput) {
  return prisma.campaign.update({
    where: { id, userId },
    data: {
      name: data.name,
      serviceToPitch: data.serviceToPitch,
      targetNiche: data.targetNiche,
      targetLocation: data.targetLocation,
      offer: data.offer,
      cta: data.cta,
      dailySendLimit: data.dailySendLimit ?? 20,
      minimumFitScore: data.minimumFitScore ?? 60,
    },
  });
}

export async function updateCampaignStatus(
  userId: string,
  id: string,
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED"
) {
  return prisma.campaign.update({
    where: { id, userId },
    data: { status },
  });
}

export async function getRecentCampaigns(userId: string, limit = 5) {
  return prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { _count: { select: { leads: true } } },
  });
}

export async function getDashboardMetrics(userId: string) {
  const [
    totalCampaigns,
    totalLeads,
    draftsPending,
    emailsSent,
    highFitLeads,
  ] = await Promise.all([
    prisma.campaign.count({ where: { userId } }),
    prisma.lead.count({ where: { userId } }),
    prisma.emailDraft.count({ where: { userId, status: "DRAFT" } }),
    prisma.emailDraft.count({ where: { userId, status: "SENT" } }),
    prisma.lead.count({ where: { userId, status: "ANALYZED", fitScore: { gte: 75 } } }),
  ]);

  return { totalCampaigns, totalLeads, draftsPending, emailsSent, highFitLeads };
}
