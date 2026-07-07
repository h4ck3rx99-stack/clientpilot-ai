import { EmailProvider, EmailProviderName, EmailSendInput, EmailSendResult } from "./providers/types";
import { SmtpProvider } from "./providers/smtp";
import { SimulationProvider } from "./providers/simulation";

export function getEmailProvider(): EmailProvider {
  const mode = (process.env.EMAIL_MODE || "simulation") as EmailProviderName;
  if (mode === "smtp") {
    return new SmtpProvider();
  }
  return new SimulationProvider();
}

export function getEmailProviderStatus(): {
  mode: string;
  smtpConfigured: boolean;
  smtpHost: string;
  smtpPort: number;
  fromName: string;
  fromEmail: string;
} {
  const smtp = new SmtpProvider();
  return {
    mode: process.env.EMAIL_MODE || "simulation",
    smtpConfigured: smtp.isConfigured(),
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: parseInt(process.env.SMTP_PORT || "587", 10),
    fromName: process.env.SMTP_FROM_NAME || "",
    fromEmail: process.env.SMTP_FROM_EMAIL || "",
  };
}

export async function sendEmailWithProvider(
  input: EmailSendInput
): Promise<EmailSendResult> {
  const provider = getEmailProvider();
  return provider.sendEmail(input);
}

export { SmtpProvider } from "./providers/smtp";
export { SimulationProvider } from "./providers/simulation";
