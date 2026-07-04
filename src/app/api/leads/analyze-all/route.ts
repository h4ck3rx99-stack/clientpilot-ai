import { NextRequest, NextResponse } from "next/server";
import { getLeadsByCampaignId, updateLead } from "@/lib/leads";
import { getCampaignById } from "@/lib/campaigns";
import { getProfile } from "@/lib/profile";
import { analyzeLead } from "@/lib/lead-analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json(
        { error: "Create your profile before analyzing leads." },
        { status: 400 }
      );
    }

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const allLeads = await getLeadsByCampaignId(campaignId);
    const analyzable = allLeads.filter(
      (l) => !["SENT", "UNSUBSCRIBED"].includes(l.status)
    );

    let analyzed = 0;
    let passed = 0;
    let rejected = 0;

    for (const lead of analyzable) {
      const result = analyzeLead({
        companyName: lead.companyName,
        website: lead.website,
        email: lead.email,
        sourceUrl: lead.sourceUrl,
        industry: lead.industry ?? undefined,
        targetNiche: campaign.targetNiche,
        serviceToPitch: campaign.serviceToPitch,
        services: profile.services ?? undefined,
      });

      const newStatus =
        result.fitScore >= campaign.minimumFitScore ? "ANALYZED" : "REJECTED";

      await updateLead(lead.id, {
        companyName: lead.companyName,
        industry: result.industry,
        painPoint: result.painPoint,
        offerAngle: result.offerAngle,
        personalizationLine: result.personalizationLine,
        fitScore: result.fitScore,
        scoreBreakdown: JSON.stringify(result.scoreBreakdown),
        status: newStatus,
      });

      analyzed++;
      if (newStatus === "ANALYZED") passed++;
      else rejected++;
    }

    return NextResponse.json({
      analyzed,
      passedThreshold: passed,
      rejectedBelowThreshold: rejected,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
