import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "clientpilot_session";
const MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable is required in production");
  }
  return new TextEncoder().encode(secret || "dev-secret-change-in-production");
}

export type SessionPayload = {
  userId: string;
  email: string;
};

type SessionJWT = SessionPayload & { exp?: number };

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SEC,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const verified = await jwtVerify(token, getSecret());
    const payload = verified.payload as SessionJWT;

    if (!payload.userId || !payload.email) return null;

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  authProvider: string;
  businessName: string | null;
  senderName: string | null;
  senderEmail: string | null;
  services: string | null;
  defaultCTA: string | null;
  calendarLink: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      authProvider: true,
      businessName: true,
      senderName: true,
      senderEmail: true,
      services: true,
      defaultCTA: true,
      calendarLink: true,
    },
  });

  return user;
}

export async function requireUser(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      authProvider: true,
      businessName: true,
      senderName: true,
      senderEmail: true,
      services: true,
      defaultCTA: true,
      calendarLink: true,
    },
  });

  if (!user) redirect("/login");

  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}


