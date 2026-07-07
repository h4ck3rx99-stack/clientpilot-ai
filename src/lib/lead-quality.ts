type LeadInput = {
  companyName: string | null;
  website: string | null;
  email: string | null;
  sourceUrl: string | null;
  industry: string | null;
  personalizationLine: string | null;
  fitScore: number | null;
  status?: string | null;
  pipelineStatus?: string | null;
};

export type LeadQualityResult = {
  score: number;
  warnings: string[];
};

function isValidUrl(str: string | null): boolean {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidEmail(str: string | null): boolean {
  if (!str) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

export function scoreLeadQuality(lead: LeadInput): LeadQualityResult {
  const warnings: string[] = [];
  let score = 100;

  if (!lead.companyName || lead.companyName.trim().length === 0) {
    warnings.push("Missing company name");
    score -= 20;
  }

  if (!isValidUrl(lead.website)) {
    warnings.push("Missing or invalid website");
    score -= 15;
  }

  if (!isValidEmail(lead.email)) {
    warnings.push("Missing or invalid email address");
    score -= 20;
  }

  if (!isValidUrl(lead.sourceUrl)) {
    warnings.push("Missing source URL — every lead should have a source");
    score -= 15;
  }

  if (!lead.industry || lead.industry.trim().length === 0) {
    warnings.push("Missing industry — helps with personalization");
    score -= 10;
  }

  if (!lead.personalizationLine || lead.personalizationLine.trim().length === 0) {
    warnings.push("No personalization line — run analysis to improve outreach quality");
    score -= 10;
  }

  if (!lead.fitScore || lead.fitScore < 60) {
    warnings.push("Low fit score — consider higher-quality leads");
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    warnings,
  };
}
