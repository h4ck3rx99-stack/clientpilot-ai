import { NextRequest, NextResponse } from "next/server";
import { sendQueuedEmailsForCampaign } from "@/lib/sending";

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json();
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const result = await sendQueuedEmailsForCampaign(campaignId);
  return NextResponse.json(result, { status: 200 });
}
