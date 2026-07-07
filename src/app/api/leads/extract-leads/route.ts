import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { extractLeadsFromPastedText } from "@/lib/lead-discovery";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { campaignId, sourceUrl, pastedText } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    if (!sourceUrl || !sourceUrl.startsWith("http")) {
      return NextResponse.json({ error: "A valid source URL starting with http:// or https:// is required" }, { status: 400 });
    }

    if (!pastedText || pastedText.trim().length < 10) {
      return NextResponse.json({ error: "Pasted text is too short. Please paste at least 10 characters of public listing text." }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.userId !== session.userId) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { leads, provider, model } = await extractLeadsFromPastedText(campaign, sourceUrl, pastedText);

    const aiFailed = provider === "local-rules" && model === "regex-parser";

    return NextResponse.json({
      leads, provider, model,
      count: leads.length,
      aiFailed,
      warning: aiFailed ? "AI extraction failed, used local parser instead." : undefined,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
