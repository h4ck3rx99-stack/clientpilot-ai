import { NextRequest, NextResponse } from "next/server";
import { getLeadsByCampaignId, createLead } from "@/lib/leads";

export async function GET(request: NextRequest) {
  try {
    const campaignId = request.nextUrl.searchParams.get("campaignId");
    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId query parameter is required" },
        { status: 400 }
      );
    }
    const leads = await getLeadsByCampaignId(campaignId);
    return NextResponse.json(leads);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaignId,
      companyName,
      website,
      email,
      sourceUrl,
      industry,
      painPoint,
      offerAngle,
      personalizationLine,
    } = body;

    const errors: string[] = [];
    if (!campaignId) errors.push("campaignId is required");
    if (!companyName?.trim()) errors.push("Company name is required");
    if (!website?.trim()) errors.push("Website is required");
    else if (!/^https?:\/\/.+/.test(website))
      errors.push("Website must be a valid URL");
    if (!email?.trim()) errors.push("Email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push("Email must be a valid email address");
    if (!sourceUrl?.trim()) errors.push("Source URL is required");
    else if (!/^https?:\/\/.+/.test(sourceUrl))
      errors.push("Source URL must be a valid URL");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const lead = await createLead(campaignId, {
      companyName: companyName.trim(),
      website: website.trim(),
      email: email.trim(),
      sourceUrl: sourceUrl.trim(),
      industry: industry?.trim(),
      painPoint: painPoint?.trim(),
      offerAngle: offerAngle?.trim(),
      personalizationLine: personalizationLine?.trim(),
      fitScore: 0,
      status: "NEW",
    });

    return NextResponse.json(lead, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
