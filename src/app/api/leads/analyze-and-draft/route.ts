import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLeadIntelligence, logAIUsage } from "@/lib/ai/lead-intelligence";
import { calculateLeadFitScore } from "@/lib/scoring";
import { hasActiveDraftForLead } from "@/lib/email-drafts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        campaign: {
          select: {
            id: true,
            minimumFitScore: true,
            targetNiche: true,
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
    if (!profile) {
      return NextResponse.json({ error: "Create your profile first." }, { status: 400 });
    }

    const profileData = {
      businessName: profile.businessName || undefined,
      senderName: profile.senderName || undefined,
      services: profile.services || undefined,
    };

    const intelligence = await generateLeadIntelligence(lead.id);

    if (!intelligence.data) {
      await logAIUsage({
        provider: "local-rules",
        model: "deterministic-rules",
        taskType: "LEAD_INTELLIGENCE",
        success: false,
        errorMessage: intelligence.error,
      });
      return NextResponse.json({ error: intelligence.error }, { status: 500 });
    }

    const { result, provider, model } = intelligence.data;

    const { total, breakdown } = calculateLeadFitScore({
      companyName: lead.companyName,
      website: lead.website,
      email: lead.email,
      sourceUrl: lead.sourceUrl,
      industry: result.industry,
      targetNiche: lead.campaign.targetNiche,
      serviceToPitch: lead.campaign.serviceToPitch,
      services: profileData.services,
    });

    const passedThreshold = total >= lead.campaign.minimumFitScore;
    const newStatus = passedThreshold ? "ANALYZED" : "REJECTED";

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        industry: result.industry,
        painPoint: result.painPoint,
        offerAngle: result.offerAngle,
        personalizationLine: result.personalizationLine,
        fitScore: total,
        scoreBreakdown: JSON.stringify(breakdown),
        status: newStatus,
        aiProviderUsed: provider,
        aiModelUsed: model,
      },
    });

    let draft = null;
    if (passedThreshold && !(await hasActiveDraftForLead(lead.id))) {
      draft = await prisma.emailDraft.create({
        data: {
          leadId: lead.id,
          subject: result.emailSubject,
          body: result.emailBody,
          status: "DRAFT",
          type: "INITIAL",
          aiProviderUsed: provider,
          aiModelUsed: model,
        },
      });
    }

    await logAIUsage({
      provider,
      model,
      taskType: "LEAD_INTELLIGENCE",
      success: true,
    });

    return NextResponse.json({
      leadId: lead.id,
      provider,
      model,
      fitScore: total,
      status: newStatus,
      draftCreated: !!draft,
      draftId: draft?.id || null,
      analysis: {
        industry: result.industry,
        painPoint: result.painPoint,
        offerAngle: result.offerAngle,
        personalizationLine: result.personalizationLine,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
