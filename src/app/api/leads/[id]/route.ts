import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// DELETE - Decline a lead (removes it from the campaign)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.userId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Lead declined and removed" });
  } catch (error) {
    console.error("Error declining lead:", error);
    return NextResponse.json(
      { error: "Internal server error during delete" },
      { status: 500 }
    );
  }
}

// PATCH - Update lead fields (email draft, queue status, pipeline status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { emailSubject, emailBody, emailStatus, pipelineStatus, phone, email } = body;

    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.userId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (emailSubject !== undefined) updateData.emailSubject = emailSubject;
    if (emailBody !== undefined) updateData.emailBody = emailBody;
    if (emailStatus !== undefined) {
      updateData.emailStatus = emailStatus;
      if (emailStatus === "SENT") {
        updateData.sentAt = new Date();
        updateData.lastContactedAt = new Date();
      }
    }
    if (pipelineStatus !== undefined) updateData.pipelineStatus = pipelineStatus;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Internal server error during update" },
      { status: 500 }
    );
  }
}
