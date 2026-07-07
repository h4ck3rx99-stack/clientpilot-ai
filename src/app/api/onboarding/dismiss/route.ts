import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { dismissOnboarding } from "@/lib/onboarding";

export async function POST() {
  try {
    const user = await requireUser();
    await dismissOnboarding(user.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
