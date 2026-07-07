import { NextRequest, NextResponse } from "next/server";
import {
  generateFollowUpDraftForLead,
  generateFollowUpsForCampaign,
} from "@/lib/follow-ups";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId, leadId } = await request.json();

  if (leadId) {
    const result = await generateFollowUpDraftForLead(session.userId, leadId);
    return NextResponse.json(result, { status: result.status === "failed" ? 500 : 200 });
  }

  if (!campaignId) {
    return NextResponse.json(
      { error: "campaignId or leadId is required" },
      { status: 400 }
    );
  }

  const result = await generateFollowUpsForCampaign(session.userId, campaignId);
  return NextResponse.json(result, { status: 200 });
}
