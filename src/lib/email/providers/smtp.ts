import nodemailer from "nodemailer";
import { EmailProvider, EmailProviderName, EmailSendInput, EmailSendResult } from "./types";

export class SmtpProvider implements EmailProvider {
  name: EmailProviderName = "smtp";

  private getConfig() {
    return {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
      fromName: process.env.SMTP_FROM_NAME || "",
      fromEmail: process.env.SMTP_FROM_EMAIL || "",
    };
  }

  isConfigured(): boolean {
    const cfg = this.getConfig();
    return !!(cfg.host && cfg.user && cfg.pass && cfg.fromEmail);
  }

  async sendEmail(input: EmailSendInput): Promise<EmailSendResult> {
    const cfg = this.getConfig();

    if (!this.isConfigured()) {
      return { success: false, provider: "smtp", error: "SMTP not configured" };
    }

    const fromName = input.fromName || cfg.fromName;
    const fromEmail = input.fromEmail || cfg.fromEmail;

    let textBody = input.body;
    if (input.unsubscribeUrl) {
      textBody += `\n\n---\nIf this is not relevant, you can unsubscribe here: ${input.unsubscribeUrl}`;
    }

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });

    try {
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: input.to,
        subject: input.subject,
        text: textBody,
      });

      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId || undefined,
      };
    } catch (err) {
      return {
        success: false,
        provider: "smtp",
        error: (err as Error).message,
      };
    }
  }
}
