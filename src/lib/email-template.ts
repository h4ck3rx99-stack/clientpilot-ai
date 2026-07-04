export type OutreachInput = {
  companyName?: string | null;
  industry?: string | null;
  painPoint?: string | null;
  offerAngle?: string | null;
  serviceToPitch?: string;
  offer?: string;
  cta?: string;
  senderName?: string;
  senderEmail?: string;
};

export function generateOutreachEmail(input: OutreachInput): {
  subject: string;
  body: string;
} {
  const company = input.companyName || "your company";
  const service = input.serviceToPitch || "our services";
  const offer = input.offer || "a special offer";

  const subject = `Quick thought for ${company}`;

  const body = [
    `Hi there,`,
    ``,
    `I wanted to reach out because I believe ${service} could help ${company} achieve better results.`,
    input.painPoint ? `I understand that ${input.painPoint.toLowerCase()} can be a challenge, and we specialize in solving exactly that.` : ``,
    ``,
    input.offer ? `${offer}` : ``,
    ``,
    input.cta ? `${input.cta}` : `Would you be open to a quick chat this week?`,
    ``,
    `Best regards,`,
    input.senderName || `The Team`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, body };
}
