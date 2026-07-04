import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.emailDraft.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "Email draft not found" },
      { status: 404 }
    );
  }

  const errors: string[] = [];
  if (body.subject !== undefined) {
    const s = (body.subject as string).trim();
    if (!s) errors.push("Subject is required");
    else if (s.length > 120) errors.push("Subject must be 120 characters or fewer");
    body.subject = s;
  }
  if (body.body !== undefined) {
    const b = (body.body as string).trim();
    if (!b) errors.push("Body is required");
    else if (b.length > 3000) errors.push("Body must be 3000 characters or fewer");
    body.body = b;
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const updateData: Record<string, string> = {};
  if (body.subject !== undefined) updateData.subject = body.subject;
  if (body.body !== undefined) updateData.body = body.body;
  if (body.status !== undefined) updateData.status = body.status;

  const updated = await prisma.emailDraft.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ draft: updated });
}
