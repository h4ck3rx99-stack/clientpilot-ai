import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email, reason } = await request.json();

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
