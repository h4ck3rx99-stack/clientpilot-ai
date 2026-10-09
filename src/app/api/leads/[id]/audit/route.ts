import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { auditWebsitePresence } from "@/lib/website-audit";

export async function POST(
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

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        senderName: true,
        businessName: true,
        calendarLink: true,
      },
    });

    const senderName = user?.senderName || "The team";
    const businessName = user?.businessName || "our agency";
    const calendarLink = user?.calendarLink || undefined;

    // Run audit
    const audit = await auditWebsitePresence(
      lead.companyName,
      lead.website || "",
      lead.serviceToPitch,
      senderName,
      businessName,
      calendarLink
    );

    // Save changes
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        websiteAudit: JSON.stringify(audit.issues),
        emailSubject: audit.emailSubject,
        emailBody: audit.emailBody,
        emailStatus: "DRAFT", // reset to draft when re-auditing
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      audit,
    });
  } catch (error) {
    console.error("Error running website audit:", error);
    return NextResponse.json(
      { error: "Internal server error during website audit" },
      { status: 500 }
    );
  }
}
