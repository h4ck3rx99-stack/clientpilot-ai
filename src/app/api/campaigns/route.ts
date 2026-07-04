import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      serviceToPitch,
      targetNiche,
      targetLocation,
      offer,
      cta,
      dailySendLimit,
      minimumFitScore,
    } = body;

    if (!name || !serviceToPitch || !targetNiche || !targetLocation || !offer || !cta) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        serviceToPitch,
        targetNiche,
        targetLocation,
        offer,
        cta,
        dailySendLimit: Number(dailySendLimit) || 20,
        minimumFitScore: Number(minimumFitScore) || 60,
        status: "DRAFT",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
