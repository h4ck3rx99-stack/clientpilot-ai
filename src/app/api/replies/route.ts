import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { classifyReplyBody } from "@/lib/reply-classifier";

// GET - Retrieve all leads with replies
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leadsWithReplies = await prisma.lead.findMany({
      where: {
        userId: session.userId,
        replies: {
          some: {},
        },
      },
      include: {
        replies: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(leadsWithReplies);
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Process a new incoming reply
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, replyBody } = body;

    if (!leadId || !replyBody) {
      return NextResponse.json(
        { error: "leadId and replyBody are required" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: session.userId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // 1. Classify the reply body
    const category = await classifyReplyBody(replyBody);

    // 2. Create the reply record
    const reply = await prisma.leadReply.create({
      data: {
        leadId,
        body: replyBody,
        category,
      },
    });

    // 3. Update pipeline status based on category rules
    const updateData: Record<string, any> = {};
    
    if (category === "unsubscribe") {
      // Add email to unsubscribes
      if (lead.email) {
        await prisma.unsubscribe.upsert({
          where: { email: lead.email },
          update: {},
          create: {
            email: lead.email,
            userId: session.userId,
          },
        });
      }
      updateData.pipelineStatus = "NOT_INTERESTED";
      updateData.emailStatus = "SENT"; // stops further sending
    } else if (category === "not_interested") {
      updateData.pipelineStatus = "NOT_INTERESTED";
    } else if (category === "interested") {
      updateData.pipelineStatus = "INTERESTED";
    } else if (category === "asking_pricing" || category === "more_info") {
      updateData.pipelineStatus = "REPLIED";
    } else if (category === "follow_up_later") {
      updateData.pipelineStatus = "FOLLOW_UP";
      // Set next follow up date to 7 days from now
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + 7);
      updateData.nextFollowUpAt = nextFollowUp;
    } else if (category === "auto_reply") {
      // Automated reply: log but do not change pipelineStatus (leave contacted/follow-up active)
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      reply,
      category,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error processing reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
