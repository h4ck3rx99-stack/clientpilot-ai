import { NextRequest, NextResponse } from "next/server";
import { simulateSendQueuedEmailsForCampaign } from "@/lib/sending";

export async function POST(request: NextRequest) {
  const { campaignId } = await request.json();
  if (!campaignId) {
    return NextResponse.json(
      { error: "campaignId is required" },
      { status: 400 }
    );
  }

  const result = await simulateSendQueuedEmailsForCampaign(campaignId);
  return NextResponse.json(result, { status: 200 });
}
