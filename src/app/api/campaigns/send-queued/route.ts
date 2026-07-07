import { NextRequest, NextResponse } from "next/server";
import { sendQueuedEmailsForCampaign } from "@/lib/sending";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaignId } = await request.json();
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const result = await sendQueuedEmailsForCampaign(session.userId, campaignId);
  return NextResponse.json(result, { status: 200 });
}
