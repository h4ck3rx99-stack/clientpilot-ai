import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unsubscribeByToken } from "@/lib/unsubscribe";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();

  if (body.token) {
    const result = await unsubscribeByToken(session.userId, body.token);
    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    }
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  const { email, reason } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 }
    );
  }

  const existing = await prisma.unsubscribe.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existing) {
    return NextResponse.json(
      { message: "Email is already in the unsubscribe list.", existing },
      { status: 200 }
    );
  }

  const record = await prisma.unsubscribe.create({
    data: {
      email: email.toLowerCase().trim(),
      reason: reason?.trim() || null,
    },
  });

  return NextResponse.json(
    { message: "Email added to unsubscribe list.", record },
    { status: 201 }
  );
}

export async function GET() {
  const records = await prisma.unsubscribe.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ records });
}
