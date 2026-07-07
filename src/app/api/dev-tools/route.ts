import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Dev tools are not available in production" }, { status: 403 });
  }

  try {
    const user = await requireUser();
    const { action } = await request.json();

    switch (action) {
      case "create-sample-campaign": {
        const campaign = await prisma.campaign.create({
          data: {
            userId: user.id,
            name: "Sample Campaign",
            serviceToPitch: "Web development and design",
            targetNiche: "Local service businesses",
            targetLocation: "Your city",
            offer: "Free website audit",
            cta: "Reply to schedule a quick call",
            dailySendLimit: 20,
            minimumFitScore: 60,
            status: "ACTIVE",
          },
        });
        return NextResponse.json({ message: `Sample campaign created: "${campaign.name}"` });
      }

      case "create-sample-leads": {
        const campaign = await prisma.campaign.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });
        if (!campaign) {
          return NextResponse.json({ error: "Create a campaign first." }, { status: 400 });
        }
        const sampleLeads = [
          { companyName: "GreenLeaf Landscaping", email: "info@greenleaf.example.com", industry: "Landscaping", painPoint: "Old website with no mobile responsiveness" },
          { companyName: "BrightStar Dental", email: "contact@brightstar.example.com", industry: "Dental", painPoint: "No online booking system" },
          { companyName: "Pioneer Realty Group", email: "hello@pioneer.example.com", industry: "Real Estate", painPoint: "Manual lead tracking in spreadsheets" },
          { companyName: "FreshBites Kitchen", email: "info@freshbites.example.com", industry: "Restaurant", painPoint: "No delivery website or online ordering" },
          { companyName: "Summit Fitness Studio", email: "team@summit.example.com", industry: "Fitness", painPoint: "Outdated class schedule website" },
        ];
        for (const lead of sampleLeads) {
          await prisma.lead.create({
            data: {
              campaignId: campaign.id,
              userId: user.id,
              ...lead,
            },
          });
        }
        return NextResponse.json({ message: "5 sample leads created." });
      }

      case "analyze-sample-leads": {
        const leads = await prisma.lead.findMany({
          where: { userId: user.id, status: "NEW" },
          take: 5,
        });
        if (leads.length === 0) {
          return NextResponse.json({ error: "No new leads to analyze." }, { status: 400 });
        }
        for (const lead of leads) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: "ANALYZED",
              fitScore: Math.floor(Math.random() * 40) + 50,
              painPoint: lead.painPoint || "Needs digital transformation support",
              offerAngle: "Free consultation to discuss improvements",
            },
          });
        }
        return NextResponse.json({ message: `${leads.length} leads analyzed with random fit scores.` });
      }

      case "generate-sample-drafts": {
        const leads = await prisma.lead.findMany({
          where: { userId: user.id, status: "ANALYZED" },
          take: 5,
        });
        if (leads.length === 0) {
          return NextResponse.json({ error: "No analyzed leads. Run analyze first." }, { status: 400 });
        }
        for (const lead of leads) {
          const existing = await prisma.emailDraft.findFirst({
            where: { leadId: lead.id, type: "INITIAL" },
          });
          if (!existing) {
            await prisma.emailDraft.create({
              data: {
                leadId: lead.id,
                userId: user.id,
                subject: `Quick question for ${lead.companyName}`,
                body: `Hi there,\n\nI came across ${lead.companyName} and noticed you might benefit from improved web presence.\n\n${lead.painPoint || "We help businesses like yours grow online."}\n\nWould you be open to a quick 15-minute chat this week?\n\nBest,\n${user.name || "Your name"}`,
                status: "DRAFT",
              },
            });
          }
        }
        return NextResponse.json({ message: `${leads.length} sample drafts generated.` });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to execute dev action." }, { status: 500 });
  }
}
