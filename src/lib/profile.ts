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

export async function getProfile(userId: string) {
  return prisma.userProfile.findFirst({ where: { userId } });
}

export async function upsertProfile(userId: string, data: ProfileData) {
  const existing = await prisma.userProfile.findFirst({
    where: { userId },
  });

  if (existing) {
    return prisma.userProfile.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.userProfile.create({ data: { ...data, userId } });
}
