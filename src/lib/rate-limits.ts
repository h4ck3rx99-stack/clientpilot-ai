import { prisma } from "./prisma";

export type ActionType =
  | "AI_SINGLE"
  | "AI_BULK"
  | "EMAIL_SEND_SINGLE"
  | "EMAIL_SEND_BATCH"
  | "LEAD_IMPORT";

const HOURLY_LIMITS: Record<ActionType, number> = {
  AI_SINGLE: 200,
  AI_BULK: 10,
  EMAIL_SEND_SINGLE: 50,
  EMAIL_SEND_BATCH: 5,
  LEAD_IMPORT: 20,
};

export async function recordUserAction(userId: string, actionType: ActionType): Promise<void> {
  await prisma.userActionLog.create({
    data: { userId, actionType },
  });
}

export async function countUserActionsSince(
  userId: string,
  actionType: ActionType,
  since: Date
): Promise<number> {
  return prisma.userActionLog.count({
    where: {
      userId,
      actionType,
      createdAt: { gte: since },
    },
  });
}

export async function assertActionAllowed(
  userId: string,
  actionType: ActionType
): Promise<void> {
  const limit = HOURLY_LIMITS[actionType];
  const since = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
  const count = await countUserActionsSince(userId, actionType, since);

  if (count >= limit) {
    throw new Error(
      `Limit reached for safety. You've used ${count} of ${limit} allowed ${actionType.replace(/_/g, " ").toLowerCase()} actions per hour. Try again later or lower batch size.`
    );
  }
}
