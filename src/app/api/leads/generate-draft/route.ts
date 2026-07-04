import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOutreachEmail } from "@/lib/email-template";
import { canGenerateDraft } from "@/lib/compliance";
import { hasActiveDraftForLead } from "@/lib/email-drafts";

export async function POST(request: NextRequest) {
  const { leadId } = await request.json();
  if (!leadId) {
    return NextResponse.json(
      { error: "leadId is required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      campaign: {
        select: {
          minimumFitScore: true,
          id: true,
          serviceToPitch: true,
          offer: true,
          cta: true,
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const profile = await prisma.userProfile.findFirst();

  const compliance = canGenerateDraft({
    profileExists: !!profile,
    hasSourceUrl: !!lead.sourceUrl && lead.sourceUrl.startsWith("http"),
    hasValidEmail: !!lead.email && lead.email.includes("@"),
    leadStatus: lead.status,
    fitScore: lead.fitScore,
    minimumFitScore: lead.campaign.minimumFitScore,
    isUnsubscribed: false,
    hasActiveDraft: await hasActiveDraftForLead(lead.id),
  });

  if (!compliance.allowed) {
    return NextResponse.json(
      { error: compliance.reasons.join(" ") },
      { status: 400 }
    );
  }

  const { subject, body } = generateOutreachEmail({
    businessName: profile?.businessName,
    senderName: profile?.senderName,
    senderEmail: profile?.senderEmail,
    services: profile?.services,
    proof: profile?.proof,
    tone: profile?.tone,
    serviceToPitch: lead.campaign.serviceToPitch || undefined,
    offer: lead.campaign.offer || undefined,
    cta: lead.campaign.cta || undefined,
    companyName: lead.companyName,
    industry: lead.industry,
    painPoint: lead.painPoint,
    offerAngle: lead.offerAngle,
    personalizationLine: lead.personalizationLine,
  });

  const draft = await prisma.emailDraft.create({
    data: {
      leadId: lead.id,
      subject,
      body,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ draft }, { status: 201 });
}
