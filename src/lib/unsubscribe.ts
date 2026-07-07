import crypto from "crypto";
import { prisma } from "./prisma";
import { createLeadActivity } from "./lead-activity";

export async function getOrCreateUnsubscribeToken(
  email: string,
  campaignId?: string,
  leadId?: string
): Promise<string> {
  const existing = await prisma.unsubscribeToken.findFirst({
    where: { email },
  });
  if (existing) return existing.token;

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.unsubscribeToken.create({
    data: { email, token, campaignId, leadId },
  });
  return token;
}

export function buildUnsubscribeUrl(token: string): string {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  return `${appUrl}/unsubscribe/${token}`;
}

export async function unsubscribeByToken(token: string): Promise<{ success: boolean; message: string }> {
  const record = await prisma.unsubscribeToken.findUnique({
    where: { token },
  });
  if (!record) {
    return { success: false, message: "Invalid unsubscribe link." };
  }

  const existing = await prisma.unsubscribe.findUnique({
    where: { email: record.email },
  });
  if (!existing) {
    await prisma.unsubscribe.create({
      data: {
        email: record.email,
        reason: "Unsubscribed via link",
      },
    });
  }

  const leads = await prisma.lead.findMany({
    where: { email: record.email },
  });
  for (const lead of leads) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "UNSUBSCRIBED" },
    });
    try {
      await createLeadActivity({
        leadId: lead.id,
        campaignId: lead.campaignId,
        type: "UNSUBSCRIBED",
        message: "Lead unsubscribed via email link.",
      });
    } catch {
      // non-critical
    }
  }

  return { success: true, message: "You have been unsubscribed." };
}
