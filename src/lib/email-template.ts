export type OutreachInput = {
  businessName?: string | null;
  senderName?: string | null;
  senderEmail?: string | null;
  services?: string | null;
  proof?: string | null;
  tone?: string | null;
  serviceToPitch?: string;
  offer?: string;
  cta?: string;
  companyName?: string | null;
  industry?: string | null;
  painPoint?: string | null;
  offerAngle?: string | null;
  personalizationLine?: string | null;
};

export function generateOutreachEmail(
  input: OutreachInput
): { subject: string; body: string } {
  const company = input.companyName || "your company";
  const senderName = input.senderName || "The Team";
  const business = input.businessName || "";
  const services = input.services || input.serviceToPitch || "our services";
  const cta = input.cta || "Would you be open to a quick chat?";
  const personalization =
    input.personalizationLine ||
    `I came across ${company} and wanted to reach out.`;
  const painPoint =
    input.painPoint ||
    `I believe ${services} could help ${company} improve how they manage leads and outreach.`;
  const offer = input.offer || "";
  const proof = input.proof || "";

  const subject =
    `Quick idea for ${company}`.length <= 70
      ? `Quick idea for ${company}`
      : `Idea for ${company}`;

  const bodyLines: string[] = [
    `Hi there,`,
    ``,
    personalization,
    ``,
    painPoint,
    ``,
  ];

  if (services) {
    const serviceLine = business
      ? `I run ${business}, where I help businesses with ${services.toLowerCase()}.`
      : `We help businesses with ${services.toLowerCase()}.`;
    bodyLines.push(serviceLine);
    bodyLines.push(``);
  }

  if (offer) {
    bodyLines.push(offer);
    bodyLines.push(``);
  }

  if (proof) {
    bodyLines.push(proof);
    bodyLines.push(``);
  }

  bodyLines.push(cta);
  bodyLines.push(``);
  bodyLines.push(`Best,`);
  bodyLines.push(senderName);
  if (business) bodyLines.push(business);
  bodyLines.push(``);
  bodyLines.push(
    `If this is not relevant, you can reply "unsubscribe" and I will not contact you again.`
  );

  return { subject, body: bodyLines.join("\n") };
}

export type FollowUpInput = {
  businessName?: string | null;
  senderName?: string | null;
  services?: string | null;
  serviceToPitch?: string;
  cta?: string;
  companyName?: string | null;
  industry?: string | null;
  painPoint?: string | null;
  offerAngle?: string | null;
  personalizationLine?: string | null;
  followUpNumber: number;
};

export function generateFollowUpEmail(
  input: FollowUpInput
): { subject: string; body: string } {
  const company = input.companyName || "your company";
  const senderName = input.senderName || "The Team";
  const business = input.businessName || "";
  const services = input.services || input.serviceToPitch || "our services";
  const cta = input.cta || "Would you be open to a quick chat?";
  const painPoint =
    input.painPoint ||
    `I think ${services} could help ${company} improve how they manage leads and outreach.`;
  const personalization =
    input.personalizationLine ||
    `I came across ${company} and wanted to reach out.`;

  if (input.followUpNumber === 1) {
    const subject =
      `Quick follow-up for ${company}`.length <= 70
        ? `Quick follow-up for ${company}`
        : `Follow-up for ${company}`;

    const bodyLines: string[] = [
      `Hi there,`,
      ``,
      `I wanted to quickly follow up on my previous note.`,
      ``,
      personalization,
      ``,
      painPoint,
      ``,
      serviceLine(business, services),
      ``,
      cta,
      ``,
      `Best,`,
      senderName,
    ];
    if (business) bodyLines.push(business);
    bodyLines.push(``);
    bodyLines.push(
      `If this is not relevant, you can reply "unsubscribe" and I will not contact you again.`
    );

    return { subject, body: bodyLines.join("\n") };
  }

  const subject =
    `Last quick note for ${company}`.length <= 70
      ? `Last quick note for ${company}`
      : `Last note for ${company}`;

  const bodyLines: string[] = [
    `Hi there,`,
    ``,
    `Just sending one last quick note in case this is useful.`,
    ``,
    `Based on ${company}'s work in the ${
      input.industry || "industry"
    } space, I think a lightweight ${services.toLowerCase()} could help your team handle leads faster without adding extra manual work.`,
    ``,
    cta,
    ``,
    `Best,`,
    senderName,
  ];
  if (business) bodyLines.push(business);
  bodyLines.push(``);
  bodyLines.push(
    `If this is not relevant, you can reply "unsubscribe" and I will not contact you again.`
  );

  return { subject, body: bodyLines.join("\n") };
}

function serviceLine(business: string, services: string): string {
  return business
    ? `I run ${business}, where I help businesses with ${services.toLowerCase()}.`
    : `We help businesses with ${services.toLowerCase()}.`;
}
