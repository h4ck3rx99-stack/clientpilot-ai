import { NextResponse } from "next/server";
import { getProfile, upsertProfile } from "@/lib/profile";

export async function GET() {
  try {
    const profile = await getProfile();
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      businessName,
      senderName,
      senderEmail,
      services,
      proof,
      tone,
      defaultCTA,
    } = body;

    const errors: string[] = [];
    if (!businessName?.trim()) errors.push("Business name is required");
    if (!senderName?.trim()) errors.push("Sender name is required");
    if (!senderEmail?.trim()) errors.push("Sender email is required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail))
      errors.push("Sender email must be a valid email address");
    if (!services?.trim()) errors.push("Services offered is required");
    if (!defaultCTA?.trim()) errors.push("Default CTA is required");

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const profile = await upsertProfile({
      businessName: businessName.trim(),
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim(),
      services: services.trim(),
      proof: proof?.trim(),
      tone: tone?.trim(),
      defaultCTA: defaultCTA.trim(),
    });

    return NextResponse.json(profile, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
