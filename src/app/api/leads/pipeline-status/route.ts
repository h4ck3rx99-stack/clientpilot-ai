import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadActivity } from "@/lib/lead-activity";

const VALID_STATUSES = [
  "NOT_CONTACTED",
  "CONTACTED",
  "REPLIED",
  "INTERESTED",
  "NOT_INTERESTED",
  "MEETING_BOOKED",
  "WON",
  "LOST",
  "FOLLOW_UP",
];

export async function PUT(request: NextRequest) {
  const { leadId, pipelineStatus } = await request.json();

  if (!leadId || !pipelineStatus) {
    return NextResponse.json(
      { error: "leadId and pipelineStatus are required." },
      { status: 400 }
    );
  }

  if (!VALID_STATUSES.includes(pipelineStatus)) {
    return NextResponse.json(
      { error: `Invalid pipeline status: ${pipelineStatus}` },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    pipelineStatus,
  };

  const replyStatuses = ["REPLIED", "INTERESTED", "MEETING_BOOKED"];
  if (replyStatuses.includes(pipelineStatus) && !lead.repliedAt) {
    updateData.repliedAt = new Date();
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: updateData,
  });

  await createLeadActivity({
    leadId: lead.id,
    campaignId: lead.campaignId,
    type: "STATUS_CHANGED",
    message: `Pipeline status changed to ${pipelineStatus}.`,
  });

  return NextResponse.json({ success: true, pipelineStatus });
}
