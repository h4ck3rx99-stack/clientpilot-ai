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

export async function getCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });
}

export async function getCampaignById(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } },
  });
}

export async function createCampaign(data: CampaignInput) {
  return prisma.campaign.create({
    data: {
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

export async function updateCampaign(id: string, data: CampaignInput) {
  return prisma.campaign.update({
    where: { id },
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
  id: string,
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED"
) {
  return prisma.campaign.update({
    where: { id },
    data: { status },
  });
}

export async function getRecentCampaigns(limit = 5) {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getDashboardMetrics() {
  const [totalCampaigns, totalLeads, emailsQueued, emailsSent] =
    await Promise.all([
      prisma.campaign.count(),
      prisma.lead.count(),
      prisma.emailDraft.count({ where: { status: "QUEUED" } }),
      prisma.emailDraft.count({ where: { status: "SENT" } }),
    ]);

  return { totalCampaigns, totalLeads, emailsQueued, emailsSent };
}
