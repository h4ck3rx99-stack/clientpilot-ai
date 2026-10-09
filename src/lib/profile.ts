import { prisma } from "./prisma";

export type ProfileData = {
  businessName: string;
  senderName: string;
  senderEmail: string;
  services: string;
  defaultCTA: string;
  calendarLink?: string;
};

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      businessName: true,
      senderName: true,
      senderEmail: true,
      services: true,
      defaultCTA: true,
      calendarLink: true,
      email: true,
      name: true,
    },
  });

  if (!user) return null;

  return {
    businessName: user.businessName,
    senderName: user.senderName || user.name,
    senderEmail: user.senderEmail || user.email,
    services: user.services,
    defaultCTA: user.defaultCTA,
    calendarLink: user.calendarLink,
  };
}

export async function upsertProfile(userId: string, data: ProfileData) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      businessName: data.businessName,
      senderName: data.senderName,
      senderEmail: data.senderEmail,
      services: data.services,
      defaultCTA: data.defaultCTA,
      calendarLink: data.calendarLink,
    },
  });
}
