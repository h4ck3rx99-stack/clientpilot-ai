import { calculateLeadFitScore, ScoreBreakdown } from "./scoring";

export type AnalysisResult = {
  industry: string;
  painPoint: string;
  offerAngle: string;
  personalizationLine: string;
  fitScore: number;
  scoreBreakdown: ScoreBreakdown;
};

export function analyzeLead(input: {
  companyName: string;
  website?: string | null;
  email?: string | null;
  sourceUrl?: string | null;
  industry?: string | null;
  targetNiche?: string;
  serviceToPitch?: string;
  services?: string;
}): AnalysisResult {
  const fallbackIndustry = input.industry || guessIndustry(input);
  const painPoint = generatePainPoint(fallbackIndustry);
  const offerAngle = generateOfferAngle(fallbackIndustry);
  const personalizationLine = generatePersonalization(
    fallbackIndustry,
    input
  );
  const { total, breakdown } = calculateLeadFitScore({
    ...input,
    industry: fallbackIndustry,
  });

  return {
    industry: fallbackIndustry,
    painPoint,
    offerAngle,
    personalizationLine,
    fitScore: total,
    scoreBreakdown: breakdown,
  };
}

function guessIndustry(input: {
  companyName?: string;
  website?: string | null;
  targetNiche?: string;
}): string {
  const text = [input.companyName, input.website, input.targetNiche]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const industryHints: Record<string, string[]> = {
    Education: ["education", "school", "academy", "university", "college", "learn", "training", "student", "campus", "edu"],
    Healthcare: ["clinic", "health", "medical", "hospital", "doctor", "dental", "care", "patient", "wellness", "pharma"],
    Legal: ["law", "legal", "attorney", "lawyer", "firm", "justice", "advocate", "litigation", "compliance"],
    "Real Estate": ["realestate", "real estate", "property", "housing", "apartment", "rental", "mortgage", "realtor"],
    "Financial Services": ["fintech", "finance", "bank", "insurance", "investment", "wealth", "capital", "fund", "financial"],
    Technology: ["tech", "software", "saas", "startup", "digital", "platform", "cloud", "app", "ai", "data", "dev", "code"],
    Ecommerce: ["shop", "store", "ecommerce", "e-commerce", "retail", "product", "merchant", "wholesale"],
    Consulting: ["consult", "advisory", "strategy", "solutions", "partner", "professional services"],
    Agency: ["agency", "studio", "creative", "marketing", "media", "brand", "design", "production"],
  };

  for (const [industry, hints] of Object.entries(industryHints)) {
    if (hints.some((h) => text.includes(h))) {
      return industry;
    }
  }

  return input.targetNiche || "General Business";
}

function generatePainPoint(
  industry: string
): string {
  const lower = industry.toLowerCase();

  if (
    lower.includes("education") ||
    lower.includes("school") ||
    lower.includes("academy")
  ) {
    return "Student enquiries, admissions follow-ups, and appointment scheduling can take up a lot of manual time.";
  }
  if (
    lower.includes("clinic") ||
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("healthcare")
  ) {
    return "Appointment requests, patient follow-ups, and missed calls can create manual workload.";
  }
  if (
    lower.includes("law") ||
    lower.includes("legal") ||
    lower.includes("attorney")
  ) {
    return "Many legal practices lose potential clients when contact forms, websites, or intake flows are unclear.";
  }
  if (lower.includes("agency") || lower.includes("creative")) {
    return "Agencies often manage many leads and projects across scattered tools.";
  }
  if (
    lower.includes("fintech") ||
    lower.includes("finance") ||
    lower.includes("bank")
  ) {
    return "Financial service providers need efficient lead tracking and client onboarding to stay competitive.";
  }
  if (lower.includes("tech") || lower.includes("saas")) {
    return "Growing tech companies often struggle with lead follow-up and customer onboarding at scale.";
  }
  if (lower.includes("ecommerce") || lower.includes("shop") || lower.includes("retail")) {
    return "E-commerce businesses lose revenue when customer follow-ups and support are slow or manual.";
  }
  if (lower.includes("real estate") || lower.includes("property")) {
    return "Real estate professionals need fast responses to property enquiries to convert leads into clients.";
  }
  if (lower.includes("consult")) {
    return "Consultants often spend too much time on administrative follow-ups instead of client work.";
  }

  return "Manual lead handling, weak online presence, and slow follow-ups can reduce conversions.";
}

function generateOfferAngle(
  industry: string
): string {
  const lower = industry.toLowerCase();

  if (
    lower.includes("education") ||
    lower.includes("school") ||
    lower.includes("academy")
  ) {
    return "AI enquiry automation and follow-up system.";
  }
  if (
    lower.includes("clinic") ||
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("healthcare")
  ) {
    return "Booking and follow-up automation.";
  }
  if (
    lower.includes("law") ||
    lower.includes("legal") ||
    lower.includes("attorney")
  ) {
    return "Website and client intake improvement.";
  }
  if (lower.includes("agency") || lower.includes("creative")) {
    return "CRM, dashboard, and workflow automation.";
  }
  if (
    lower.includes("fintech") ||
    lower.includes("finance") ||
    lower.includes("bank")
  ) {
    return "Automated onboarding and lead management system.";
  }
  if (lower.includes("tech") || lower.includes("saas")) {
    return "Sales follow-up and customer onboarding automation.";
  }
  if (lower.includes("ecommerce") || lower.includes("shop") || lower.includes("retail")) {
    return "Cart recovery and customer communication automation.";
  }
  if (lower.includes("real estate") || lower.includes("property")) {
    return "Lead capture and enquiry follow-up system.";
  }
  if (lower.includes("consult")) {
    return "Client outreach and CRM automation.";
  }

  return "Website, automation, and client acquisition system.";
}

function generatePersonalization(
  industry: string,
  input: { companyName?: string; website?: string | null; sourceUrl?: string | null }
): string {
  const company = input.companyName || "your company";
  const ref = input.sourceUrl || input.website || "";
  const lower = industry.toLowerCase();

  if (
    lower.includes("education") ||
    lower.includes("school") ||
    lower.includes("academy")
  ) {
    return `I noticed ${company} operates in the education space, where fast enquiry responses and follow-ups can directly improve admissions conversations.`;
  }
  if (
    lower.includes("clinic") ||
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("healthcare")
  ) {
    return `I see ${company} is in healthcare, where every missed appointment or slow follow-up can mean lost patient trust.`;
  }
  if (
    lower.includes("law") ||
    lower.includes("legal") ||
    lower.includes("attorney")
  ) {
    return `I came across ${company} and understand that legal practices need a seamless way to handle initial client intake.`;
  }
  if (lower.includes("agency") || lower.includes("creative")) {
    return `${company} looks like a busy agency — the right dashboard and CRM can make project and lead management much smoother.`;
  }
  if (
    lower.includes("fintech") ||
    lower.includes("finance") ||
    lower.includes("bank")
  ) {
    return `${company} operates in a fast-moving financial space, where automated lead handling can make a real difference.`;
  }
  if (lower.includes("tech") || lower.includes("saas")) {
    return `${company} is in a competitive tech landscape, and better lead follow-up could give you an edge.`;
  }
  if (lower.includes("ecommerce") || lower.includes("shop") || lower.includes("retail")) {
    return `${company} works in e-commerce, where automating customer follow-ups can directly boost repeat sales.`;
  }
  if (lower.includes("real estate") || lower.includes("property")) {
    return `${company} is in real estate, and fast property enquiry responses are critical to closing more deals.`;
  }
  if (lower.includes("consult")) {
    return `${company} provides consulting services, and automating client outreach could free up more time for billable work.`;
  }

  if (ref) {
    return `I came across ${company} and noticed it could benefit from a cleaner system for capturing and converting business enquiries.`;
  }

  return `${company} could benefit from a better system for managing leads and follow-ups.`;
}
