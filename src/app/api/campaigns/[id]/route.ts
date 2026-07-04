import { NextRequest, NextResponse } from "next/server";
import { getCampaignById, updateCampaign, updateCampaignStatus } from "@/lib/campaigns";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await getCampaignById(id);
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

    const campaign = await updateCampaign(id, {
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
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const campaign = await updateCampaignStatus(id, status);
    return NextResponse.json(campaign);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
