import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateJsonWithFallback } from "@/lib/ai";
import { ReplyCategory } from "@/lib/reply-classifier";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId: inputLeadId, category } = body;

    let leadId = inputLeadId;

    // 1. If no lead specified, find one that was contacted (emailStatus: SENT) or accepted
    if (!leadId) {
      const contactedLead = await prisma.lead.findFirst({
        where: {
          userId: session.userId,
          status: "ACCEPTED",
          emailStatus: "SENT",
        },
      });

      if (contactedLead) {
        leadId = contactedLead.id;
      } else {
        // Fall back to any accepted lead
        const acceptedLead = await prisma.lead.findFirst({
          where: {
            userId: session.userId,
            status: "ACCEPTED",
          },
        });

        if (acceptedLead) {
          leadId = acceptedLead.id;
        }
      }
    }

    if (!leadId) {
      return NextResponse.json(
        { error: "No accepted leads found. Please accept a client and send/simulate an email first." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: session.userId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const targetCategory: ReplyCategory = category || getRandomCategory();

    // 2. Generate a reply body matching the category
    let replyBody = "";
    try {
      const systemPrompt = `You are a business owner replying to an outreach email. Write a short email reply. Return ONLY a valid JSON object.`;
      
      const userPrompt = `
We are a business named "${lead.companyName}" in the "${lead.industry || "local business"}" space.
Write a realistic email reply to a pitch for "${lead.serviceToPitch}".
The reply must match the category: "${targetCategory}".

Return ONLY this JSON schema:
{
  "body": "Hi there, [Short email reply body matching the category style...]"
}
`;

      const result = await generateJsonWithFallback<{ body: string }>({
        systemPrompt,
        userPrompt,
        temperature: 0.8,
        maxTokens: 3000,
      });

      if (result.success && result.data?.body) {
        replyBody = result.data.body.trim();
      }
    } catch (e) {
      console.error("AI reply simulation generation failed, using fallback:", e);
    }

    if (!replyBody) {
      replyBody = getDeterministicReplyBody(lead.companyName, targetCategory);
    }

    // 3. Process the reply using our existing POST route logic (internal function call style)
    // Create the reply record
    const reply = await prisma.leadReply.create({
      data: {
        leadId,
        body: replyBody,
        category: targetCategory,
      },
    });

    // Update pipeline status based on category rules
    const updateData: Record<string, any> = {};
    
    if (targetCategory === "unsubscribe") {
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
      updateData.emailStatus = "SENT";
    } else if (targetCategory === "not_interested") {
      updateData.pipelineStatus = "NOT_INTERESTED";
    } else if (targetCategory === "interested") {
      updateData.pipelineStatus = "INTERESTED";
    } else if (targetCategory === "asking_pricing" || targetCategory === "more_info") {
      updateData.pipelineStatus = "REPLIED";
    } else if (targetCategory === "follow_up_later") {
      updateData.pipelineStatus = "FOLLOW_UP";
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + 7);
      updateData.nextFollowUpAt = nextFollowUp;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      leadName: lead.companyName,
      leadId: lead.id,
      category: targetCategory,
      reply,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error simulating reply:", error);
    return NextResponse.json(
      { error: "Internal server error during simulation" },
      { status: 500 }
    );
  }
}

function getRandomCategory(): ReplyCategory {
  const cats: ReplyCategory[] = ["interested", "asking_pricing", "more_info", "not_interested", "follow_up_later", "auto_reply", "unsubscribe"];
  return cats[Math.floor(Math.random() * cats.length)];
}

function getDeterministicReplyBody(companyName: string, category: ReplyCategory): string {
  switch (category) {
    case "interested":
      return `Hi, thanks for reaching out. The issues you mentioned with our mobile menu make a lot of sense. I'd love to chat. Are you free this Thursday at 2 PM?`;
    case "asking_pricing":
      return `Thanks for the feedback on our loading speed. How much do your optimization services cost, and how long does it take to implement?`;
    case "more_info":
      return `Hello, could you send over some examples of other local websites you have audited and optimized? I'd like to see your work before hopping on a call.`;
    case "not_interested":
      return `Hi, appreciate the note but we actually just rebuilt our website last month with another developer. We're happy with it for now. Best of luck.`;
    case "follow_up_later":
      return `Hi there, we're currently in the middle of our peak busy season. Could you follow up with us in about two weeks? We might be open to discussing website updates then.`;
    case "auto_reply":
      return `Thank you for your email. I am currently out of the office on annual leave with limited access to email. I will return on Monday. For urgent matters, please contact support.`;
    case "unsubscribe":
      return `Please unsubscribe our address from your outreach campaign list. Do not email us again.`;
  }
}
