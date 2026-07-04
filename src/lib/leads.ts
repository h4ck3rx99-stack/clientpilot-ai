import { prisma } from "./prisma";

export type LeadInput = {
  companyName: string;
  website?: string;
  email?: string;
  sourceUrl?: string;
  industry?: string;
  painPoint?: string;
  offerAngle?: string;
  personalizationLine?: string;
  fitScore?: number;
  scoreBreakdown?: string;
  status?: string;
};

export type CsvRow = {
  companyName: string;
  website: string;
  email: string;
  sourceUrl: string;
  industry?: string;
};

export async function getLeadsByCampaignId(campaignId: string) {
  return prisma.lead.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({ where: { id } });
}

export async function createLead(campaignId: string, data: LeadInput) {
  return prisma.lead.create({
    data: {
      campaignId,
      companyName: data.companyName,
      website: data.website ?? null,
      email: data.email ?? null,
      sourceUrl: data.sourceUrl ?? null,
      industry: data.industry ?? null,
      painPoint: data.painPoint ?? null,
      offerAngle: data.offerAngle ?? null,
      personalizationLine: data.personalizationLine ?? null,
      fitScore: data.fitScore ?? 0,
      scoreBreakdown: data.scoreBreakdown ?? null,
      status: data.status ?? "NEW",
    },
  });
}

export async function updateLead(id: string, data: LeadInput) {
  return prisma.lead.update({
    where: { id },
    data: {
      companyName: data.companyName,
      website: data.website ?? null,
      email: data.email ?? null,
      sourceUrl: data.sourceUrl ?? null,
      industry: data.industry ?? null,
      painPoint: data.painPoint ?? null,
      offerAngle: data.offerAngle ?? null,
      personalizationLine: data.personalizationLine ?? null,
      fitScore: data.fitScore ?? 0,
      scoreBreakdown: data.scoreBreakdown ?? undefined,
      status: data.status ?? undefined,
    },
  });
}

export async function getLeadCountForCampaign(campaignId: string) {
  return prisma.lead.count({ where: { campaignId } });
}

export async function getRecentLeadsForCampaign(
  campaignId: string,
  limit = 5
) {
  return prisma.lead.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/*
 * MVP CSV parser — simple comma-separated value parser.
 * This parser splits each line by comma and trims whitespace.
 * It does NOT handle quoted commas, multiline fields, or escaped quotes.
 * Replace with a robust CSV library (e.g. papaparse) for production use.
 */
export function parseCsvText(text: string): {
  headers: string[];
  rows: string[][];
} {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, ""));
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(",").map((v) => v.trim());
    rows.push(values);
  }

  return { headers, rows };
}

export function validateCsvHeaders(
  headers: string[]
): { valid: boolean; missing: string[] } {
  const required = ["companyname", "website", "email", "sourceurl"];
  const missing = required.filter((r) => !headers.includes(r));
  return { valid: missing.length === 0, missing };
}

export function csvRowToInput(
  headers: string[],
  values: string[]
): { data?: CsvRow; error?: string } {
  function getCol(name: string): string | undefined {
    const idx = headers.indexOf(name.toLowerCase());
    return idx !== -1 && idx < values.length ? values[idx] : undefined;
  }

  const companyName = getCol("companyname") || "";
  const website = getCol("website") || "";
  const email = getCol("email") || "";
  const sourceUrl = getCol("sourceurl") || "";
  const industry = getCol("industry") || undefined;

  const errors: string[] = [];
  if (!companyName) errors.push("companyName is required");
  if (!website) errors.push("website is required");
  else if (!/^https?:\/\/.+/.test(website))
    errors.push("website must be a valid URL");
  if (!email) errors.push("email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push("email must be a valid email address");
  if (!sourceUrl) errors.push("sourceUrl is required");
  else if (!/^https?:\/\/.+/.test(sourceUrl))
    errors.push("sourceUrl must be a valid URL");

  if (errors.length > 0) {
    return { error: errors.join("; ") };
  }

  return {
    data: { companyName, website, email, sourceUrl, industry },
  };
}
