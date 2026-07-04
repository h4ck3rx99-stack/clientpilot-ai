import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLead } from "@/lib/leads";
import { getCampaignById } from "@/lib/campaigns";
import { getProfile } from "@/lib/profile";
import { analyzeLead } from "@/lib/lead-analysis";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const lead = await getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json(
        { error: "Create your profile before analyzing leads." },
        { status: 400 }
      );
    }

    const campaign = await getCampaignById(lead.campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

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

    const updated = await updateLead(leadId, {
      companyName: lead.companyName,
      industry: result.industry,
      painPoint: result.painPoint,
      offerAngle: result.offerAngle,
      personalizationLine: result.personalizationLine,
      fitScore: result.fitScore,
      scoreBreakdown: JSON.stringify(result.scoreBreakdown),
      status: newStatus,
    });

    return NextResponse.json({
      lead: updated,
      analysis: {
        ...result,
        scoreBreakdown: result.scoreBreakdown,
      },
      passedThreshold: newStatus === "ANALYZED",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
