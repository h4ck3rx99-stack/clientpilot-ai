import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadActivity } from "@/lib/lead-activity";
import { getSession } from "@/lib/auth/session";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { leadId, notes, nextFollowUpAt, pipelineStatus } =
    await request.json();

  if (!leadId) {
    return NextResponse.json(
      { error: "leadId is required." },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead || lead.userId !== session.userId) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (notes !== undefined) {
    updateData.notes = notes?.trim() || null;
  }
  if (nextFollowUpAt !== undefined) {
    updateData.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : null;
  }
  if (pipelineStatus !== undefined) {
    updateData.pipelineStatus = pipelineStatus;
    const replyStatuses = ["REPLIED", "INTERESTED", "MEETING_BOOKED"];
    if (replyStatuses.includes(pipelineStatus) && !lead.repliedAt) {
      updateData.repliedAt = new Date();
    }
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  if (pipelineStatus !== undefined && pipelineStatus !== lead.pipelineStatus) {
    await createLeadActivity(session.userId, {
      leadId: lead.id,
      campaignId: lead.campaignId,
      type: "STATUS_CHANGED",
      message: `Pipeline status changed to ${pipelineStatus}.`,
    });
  }

  if (notes !== undefined && notes?.trim() !== (lead.notes || "")) {
    await createLeadActivity(session.userId, {
      leadId: lead.id,
      campaignId: lead.campaignId,
      type: "NOTE_ADDED",
      message: "Note added to lead.",
    });
  }

  if (nextFollowUpAt !== undefined) {
    const oldDateStr = lead.nextFollowUpAt?.toISOString() || "";
    const newDateStr = new Date(nextFollowUpAt).toISOString();
    if (nextFollowUpAt && newDateStr !== oldDateStr) {
      await createLeadActivity(session.userId, {
        leadId: lead.id,
        campaignId: lead.campaignId,
        type: "FOLLOW_UP_SET",
        message: `Follow-up set for ${new Date(nextFollowUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
      });
    }
  }

  return NextResponse.json({ success: true });
}
