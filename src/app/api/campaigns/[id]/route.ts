import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, updateCampaign, updateCampaignStatus } from "@/lib/campaigns";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const campaign = await getCampaignById(session.userId, id);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(campaign);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
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

    const errors: string[] = [];
    if (!name?.trim()) errors.push("Campaign name is required");
    if (!serviceToPitch?.trim()) errors.push("Service to pitch is required");
    if (!targetNiche?.trim()) errors.push("Target niche is required");
    if (!targetLocation?.trim()) errors.push("Target location is required");
    if (!offer?.trim()) errors.push("Offer is required");
    if (!cta?.trim()) errors.push("CTA is required");
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const campaign = await updateCampaign(session.userId, id, {
      name: name.trim(),
      serviceToPitch: serviceToPitch.trim(),
      targetNiche: targetNiche.trim(),
      targetLocation: targetLocation.trim(),
      offer: offer.trim(),
      cta: cta.trim(),
      dailySendLimit: Number(dailySendLimit) || 20,
      minimumFitScore: Number(minimumFitScore) || 60,
    });

    return NextResponse.json(campaign);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const campaign = await updateCampaignStatus(session.userId, id, status);
    return NextResponse.json(campaign);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
