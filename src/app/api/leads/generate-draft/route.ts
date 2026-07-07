import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { generateOutreachEmail } from "@/lib/email-template";
import { canGenerateDraft } from "@/lib/compliance";
import { hasActiveDraftForLead } from "@/lib/email-drafts";
import { getProfile } from "@/lib/profile";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leadId } = await request.json();
  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
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
          userId: true,
        },
      },
    },
  });

  if (!lead || lead.userId !== session.userId) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const profile = await getProfile(session.userId);

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
    return NextResponse.json({ error: compliance.reasons.join(" ") }, { status: 400 });
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
      userId: session.userId,
      subject,
      body,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ draft }, { status: 201 });
}
