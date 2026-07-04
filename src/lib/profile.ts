import { prisma } from "./prisma";

export type ProfileData = {
  businessName: string;
  senderName: string;
  senderEmail: string;
  services: string;
  proof?: string;
  tone?: string;
  defaultCTA: string;
};

export async function getProfile() {
  return prisma.userProfile.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function upsertProfile(data: ProfileData) {
  const existing = await prisma.userProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return prisma.userProfile.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.userProfile.create({ data });
}
