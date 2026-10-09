import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

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

    if (!lead || !lead.email) {
      return NextResponse.json({ error: "Lead or lead email not found" }, { status: 404 });
    }

    if (!lead.emailSubject || !lead.emailBody) {
      return NextResponse.json({ error: "Email subject and body must be generated first" }, { status: 400 });
    }

    const emailMode = process.env.EMAIL_MODE || "simulation";

    if (emailMode === "smtp") {
      // Real SMTP sending
      const host = process.env.SMTP_HOST;
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const secure = process.env.SMTP_SECURE === "true";
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const fromName = process.env.SMTP_FROM_NAME || "ClientPilot AI";
      const fromEmail = process.env.SMTP_FROM_EMAIL || user;

      if (!host || !user || !pass) {
        return NextResponse.json(
          { error: "SMTP is enabled but credentials are not configured in .env" },
          { status: 400 }
        );
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: lead.email,
        subject: lead.emailSubject,
        text: lead.emailBody,
      });
    }

    // Update lead sending state in database
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        emailStatus: "SENT",
        sentAt: new Date(),
        lastContactedAt: new Date(),
        pipelineStatus: "CONTACTED",
      },
    });

    return NextResponse.json({
      success: true,
      mode: emailMode,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: `Failed to send email: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
