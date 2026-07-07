import { NextRequest, NextResponse } from "next/server";
import { sendQueuedEmailsForCampaign } from "@/lib/sending";
import { getSession } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { campaignId, confirmed } = await request.json();
  if (!campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  const env = getEnv();

  if (env.EMAIL_MODE === "smtp" && !confirmed) {
    return NextResponse.json({ error: "Confirmation required for real SMTP sending." }, { status: 400 });
  }

  const result = await sendQueuedEmailsForCampaign(session.userId, campaignId);
  return NextResponse.json(result, { status: 200 });
}
