import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getEmailProvider } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { recipientEmail, subject, body: emailBody, realSend } = body;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
    }
    if (!subject?.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }
    if (!emailBody?.trim()) {
      return NextResponse.json({ error: "Body is required" }, { status: 400 });
    }

    if (realSend) {
      const mode = process.env.EMAIL_MODE || "simulation";
      if (mode !== "smtp") {
        return NextResponse.json({ error: "EMAIL_MODE must be smtp to send real test emails" }, { status: 400 });
      }
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      if (!smtpHost || !smtpUser || !smtpPass) {
        return NextResponse.json({ error: "SMTP is not fully configured" }, { status: 400 });
      }

      try {
        const provider = getEmailProvider();
        const result = await provider.sendEmail({
          to: recipientEmail,
          subject,
          body: emailBody,
          fromEmail: process.env.SMTP_FROM_EMAIL || smtpUser,
          fromName: process.env.SMTP_FROM_NAME || "ClientPilot AI",
        });

        await prisma.testEmailLog.create({
          data: {
            userId: session.userId,
            recipientEmail,
            subject,
            status: result.success ? "SENT" : "FAILED",
            provider: result.provider || "smtp",
            reason: result.error || null,
            realSend: true,
          },
        });

        if (!result.success) {
          return NextResponse.json({ error: result.error || "Failed to send" }, { status: 500 });
        }

        return NextResponse.json({ status: "sent", provider: result.provider });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        await prisma.testEmailLog.create({
          data: {
            userId: session.userId,
            recipientEmail,
            subject,
            status: "FAILED",
            provider: "smtp",
            reason: msg,
            realSend: true,
          },
        });
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    // Simulation
    await prisma.testEmailLog.create({
      data: {
        userId: session.userId,
        recipientEmail,
        subject,
        status: "SENT",
        provider: "simulation",
        realSend: false,
      },
    });

    return NextResponse.json({ status: "simulated", provider: "simulation" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
