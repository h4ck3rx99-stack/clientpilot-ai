import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.userId;

  let profile = await prisma.userProfile.findFirst({ where: { userId } });
  if (profile) {
    profile = await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        businessName: "RE Dev Ops",
        senderName: "Avani",
        senderEmail: "redevops3@gmail.com",
        services: "Web development, AI automation, dashboard and CRM systems",
        tone: "Professional",
      },
    });
  } else {
    profile = await prisma.userProfile.create({
      data: {
        userId,
        businessName: "RE Dev Ops",
        senderName: "Avani",
        senderEmail: "redevops3@gmail.com",
        services: "Web development, AI automation, dashboard and CRM systems",
        tone: "Professional",
      },
    });
  }

  const existingCampaign = await prisma.campaign.findFirst({
    where: { userId, name: "RE Dev Ops outreach" },
  });

  let campaign;
  if (existingCampaign) {
    campaign = await prisma.campaign.update({
      where: { id: existingCampaign.id },
      data: {
        serviceToPitch: "Web development, AI automation, and dashboard systems",
        targetNiche: "Local businesses, agencies, and service providers",
        targetLocation: "",
        offer: "Free consultation and audit",
        cta: "Would you be open to a quick 15-minute call this week?",
        dailySendLimit: 500,
        minimumFitScore: 60,
        status: "ACTIVE",
      },
    });
  } else {
    campaign = await prisma.campaign.create({
      data: {
        userId,
        name: "RE Dev Ops outreach",
        serviceToPitch: "Web development, AI automation, and dashboard systems",
        targetNiche: "Local businesses, agencies, and service providers",
        targetLocation: "",
        offer: "Free consultation and audit",
        cta: "Would you be open to a quick 15-minute call this week?",
        dailySendLimit: 500,
        minimumFitScore: 60,
        status: "ACTIVE",
      },
    });
  }

  return NextResponse.json({ profile, campaign });
}
