export type EmailProviderName = "simulation" | "smtp";

export type EmailSendInput = {
  to: string;
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  unsubscribeUrl?: string;
};

export type EmailSendResult = {
  success: boolean;
  provider: EmailProviderName;
  messageId?: string;
  error?: string;
};

export interface EmailProvider {
  name: EmailProviderName;
  isConfigured(): boolean;
  sendEmail(input: EmailSendInput): Promise<EmailSendResult>;
}
