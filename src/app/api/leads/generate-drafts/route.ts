import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { generateOutreachEmail } from "@/lib/email-template";
import { hasActiveDraftForLead } from "@/lib/email-drafts";
import { getProfile } from "@/lib/profile";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId } = await request.json();
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.userId !== session.userId) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const profile = await getProfile(session.userId);
  if (!profile) {
    return NextResponse.json({ error: "Create your profile before generating drafts." }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: {
      campaignId,
      userId: session.userId,
      status: "ANALYZED",
      fitScore: { gte: campaign.minimumFitScore },
    },
  });

  const results = { generated: 0, skipped: 0 };

  for (const lead of leads) {
    if (await hasActiveDraftForLead(lead.id)) {
      results.skipped++;
      continue;
    }

    const { subject, body } = generateOutreachEmail({
      businessName: profile.businessName,
      senderName: profile.senderName,
      senderEmail: profile.senderEmail,
      services: profile.services,
      proof: profile.proof,
      tone: profile.tone,
      serviceToPitch: campaign.serviceToPitch || undefined,
      offer: campaign.offer || undefined,
      cta: campaign.cta || undefined,
      companyName: lead.companyName,
      industry: lead.industry,
      painPoint: lead.painPoint,
      offerAngle: lead.offerAngle,
      personalizationLine: lead.personalizationLine,
    });

    await prisma.emailDraft.create({
      data: {
        leadId: lead.id,
        userId: session.userId,
        subject,
        body,
        status: "DRAFT",
      },
    });

    results.generated++;
  }

  return NextResponse.json(results, { status: 201 });
}
