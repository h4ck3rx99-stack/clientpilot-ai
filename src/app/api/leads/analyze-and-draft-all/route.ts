import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLeadIntelligence, logAIUsage } from "@/lib/ai/lead-intelligence";
import { calculateLeadFitScore } from "@/lib/scoring";
import { hasActiveDraftForLead } from "@/lib/email-drafts";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return NextResponse.json({ error: "Create your profile first." }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const maxLeads = parseInt(process.env.AI_MAX_BULK_LEADS_PER_RUN || "25", 10);
    const delayMs = parseInt(process.env.AI_BULK_DELAY_MS || "2500", 10);
    const profileData = {
      businessName: profile.businessName || undefined,
      senderName: profile.senderName || undefined,
      services: profile.services || undefined,
    };

    const allLeads = await prisma.lead.findMany({
      where: { campaignId, status: { in: ["NEW", "ANALYZED", "REJECTED"] } },
      take: maxLeads,
    });

    const summary = {
      total: allLeads.length,
      analyzed: 0,
      draftsCreated: 0,
      rejected: 0,
      skipped: 0,
      providerUsage: {} as Record<string, number>,
      rateLimitErrors: 0,
    };

    for (const lead of allLeads) {
      const intelligence = await generateLeadIntelligence(lead.id);

      if (!intelligence.data) {
        await logAIUsage({
          provider: "local-rules",
          model: "deterministic-rules",
          taskType: "LEAD_INTELLIGENCE",
          success: false,
          errorMessage: intelligence.error,
        });
        summary.skipped++;
        continue;
      }

      const { result, provider, model } = intelligence.data;

      summary.providerUsage[provider] = (summary.providerUsage[provider] || 0) + 1;

      const { total, breakdown } = calculateLeadFitScore({
        companyName: lead.companyName,
        website: lead.website,
        email: lead.email,
        sourceUrl: lead.sourceUrl,
        industry: result.industry,
        targetNiche: campaign.targetNiche,
        serviceToPitch: campaign.serviceToPitch,
        services: profileData.services,
      });

      const passedThreshold = total >= campaign.minimumFitScore;
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

      summary.analyzed++;

      if (passedThreshold && !(await hasActiveDraftForLead(lead.id))) {
        await prisma.emailDraft.create({
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
        summary.draftsCreated++;
      } else if (!passedThreshold) {
        summary.rejected++;
      }

      await logAIUsage({
        provider,
        model,
        taskType: "LEAD_INTELLIGENCE",
        success: true,
      });

      await delay(delayMs);
    }

    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
