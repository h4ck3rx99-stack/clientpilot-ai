import { prisma } from "./prisma";

export function hasSourceUrl(sourceUrl: string | null | undefined): boolean {
  return !!sourceUrl && sourceUrl.trim().length > 0;
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
