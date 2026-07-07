import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google";

export async function GET() {
  try {
    const url = await getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_oauth_failed", process.env.APP_URL || "http://localhost:3000"));
  }
}
