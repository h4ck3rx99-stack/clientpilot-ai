import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeGoogleCodeForTokens, getGoogleUserInfo, validateGoogleState } from "@/lib/auth/google";
import { createSession } from "@/lib/auth/session";

const BASE_URL = () => process.env.APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const stateValid = await validateGoogleState(state);
    if (!stateValid) {
      return NextResponse.redirect(new URL("/login?error=google_oauth_failed", BASE_URL()));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=google_oauth_failed", BASE_URL()));
    }

    const tokens = await exchangeGoogleCodeForTokens(code);
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (googleUser.emailVerified === false) {
      return NextResponse.redirect(new URL("/login?error=google_email_unverified", BASE_URL()));
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();

    const existingByGoogleId = await prisma.user.findUnique({ where: { googleId: googleUser.googleId } });

    if (existingByGoogleId) {
      await createSession(existingByGoogleId.id, existingByGoogleId.email);
      return redirectAfterLogin(existingByGoogleId.id);
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: googleUser.googleId,
          image: googleUser.picture || existingByEmail.image,
          name: googleUser.name || existingByEmail.name,
          authProvider: existingByEmail.passwordHash ? "credentials" : "google",
        },
      });
      await createSession(existingByEmail.id, existingByEmail.email);
      return redirectAfterLogin(existingByEmail.id);
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: googleUser.name || null,
        googleId: googleUser.googleId,
        image: googleUser.picture || null,
        authProvider: "google",
      },
    });

    await createSession(user.id, user.email);
    return redirectAfterLogin(user.id);
  } catch {
    return NextResponse.redirect(new URL("/login?error=google_oauth_failed", BASE_URL()));
  }
}

async function redirectAfterLogin(userId: string): Promise<NextResponse> {
  return NextResponse.redirect(new URL("/dashboard", BASE_URL()));
}
