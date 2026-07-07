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
        serviceToPitch: "Website design, landing pages, AI automation, dashboards, CRM systems, and lead follow-up workflows",
        targetNiche: "Local businesses, education institutes, clinics, agencies, consultants, restaurants, gyms, and service businesses",
        targetLocation: "Bangalore",
        offer: "Free website or automation audit",
        cta: "If this sounds useful, would you be open to a quick 15-minute call this week?",
        dailySendLimit: 500,
        minimumFitScore: 75,
        status: "ACTIVE",
      },
    });
  } else {
    campaign = await prisma.campaign.create({
      data: {
        userId,
        name: "RE Dev Ops outreach",
        serviceToPitch: "Website design, landing pages, AI automation, dashboards, CRM systems, and lead follow-up workflows",
        targetNiche: "Local businesses, education institutes, clinics, agencies, consultants, restaurants, gyms, and service businesses",
        targetLocation: "Bangalore",
        offer: "Free website or automation audit",
        cta: "If this sounds useful, would you be open to a quick 15-minute call this week?",
        dailySendLimit: 500,
        minimumFitScore: 75,
        status: "ACTIVE",
      },
    });
  }

  return NextResponse.json({ profile, campaign });
}
