import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLead } from "@/lib/leads";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const lead = await getLeadById(session.userId, id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(lead);
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
      companyName,
      website,
      email,
      sourceUrl,
      industry,
      painPoint,
      offerAngle,
      personalizationLine,
      fitScore,
      status,
    } = body;

    const errors: string[] = [];
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
    const score = Number(fitScore);
    if (score < 0 || score > 100)
      errors.push("Fit score must be between 0 and 100");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const lead = await updateLead(id, {
      companyName: companyName.trim(),
      website: website.trim(),
      email: email.trim(),
      sourceUrl: sourceUrl.trim(),
      industry: industry?.trim(),
      painPoint: painPoint?.trim(),
      offerAngle: offerAngle?.trim(),
      personalizationLine: personalizationLine?.trim(),
      fitScore: score,
      status,
    });

    return NextResponse.json(lead);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
