import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { createCampaign } from "@/lib/campaigns";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      name, serviceToPitch, targetNiche, targetLocation, offer, cta,
      dailySendLimit, minimumFitScore,
    } = body;

    if (!name || !serviceToPitch || !targetNiche || !targetLocation || !offer || !cta) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const campaign = await createCampaign(session.userId, {
      name, serviceToPitch, targetNiche, targetLocation, offer, cta,
      dailySendLimit: Number(dailySendLimit) || 20,
      minimumFitScore: Number(minimumFitScore) || 60,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
