import { NextRequest, NextResponse } from "next/server";
import {
  generateFollowUpDraftForLead,
  generateFollowUpsForCampaign,
} from "@/lib/follow-ups";

export async function POST(request: NextRequest) {
  const { campaignId, leadId } = await request.json();

  if (leadId) {
    const result = await generateFollowUpDraftForLead(leadId);
    return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
  }

  if (!campaignId) {
    return NextResponse.json(
      { error: "campaignId or leadId is required" },
      { status: 400 }
    );
  }

  const result = await generateFollowUpsForCampaign(campaignId);
  return NextResponse.json(result, { status: 200 });
}
