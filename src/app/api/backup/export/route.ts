import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";

export async function GET() {
  try {
    const user = await requireUser();
    const today = new Date().toISOString().slice(0, 10);

    const [profile, campaigns, leads, emailDrafts, sendLogs, activities, unsubscribes, onboarding] =
      await Promise.all([
        prisma.userProfile.findFirst({ where: { userId: user.id } }),
        prisma.campaign.findMany({ where: { userId: user.id } }),
        prisma.lead.findMany({ where: { userId: user.id } }),
        prisma.emailDraft.findMany({ where: { userId: user.id } }),
        prisma.emailSendLog.findMany({ where: { userId: user.id } }),
        prisma.leadActivity.findMany({ where: { userId: user.id } }),
        prisma.unsubscribe.findMany({ where: { userId: user.id } }),
        prisma.onboardingState.findUnique({ where: { userId: user.id } }),
      ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile,
      campaigns,
      leads,
      emailDrafts,
      sendLogs,
      activities,
      unsubscribes,
      onboardingState: onboarding || null,
    };

    const filename = `clientpilot-backup-${today}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
