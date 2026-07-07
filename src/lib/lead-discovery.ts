import { prisma } from "./prisma";
import { safeParseJson } from "./ai/safety";
import { generateJsonWithFallback } from "./ai";

export type ExtractedLead = {
  companyName: string;
  website: string;
  email: string;
  sourceUrl: string;
  industry: string;
  confidence: number;
  notes: string;
};

export function generateSearchQueriesForCampaign(campaign: {
  targetNiche: string;
  targetLocation: string;
  serviceToPitch: string;
}): string[] {
  const niche = campaign.targetNiche;
  const loc = campaign.targetLocation;
  const service = campaign.serviceToPitch;
  const queries: string[] = [];

  const additions = [
    `${niche} in ${loc} contact email`,
    `${niche} ${loc} website email`,
    `${niche} businesses ${loc} email address`,
    `${loc} ${niche} companies contact`,
    `site:.in ${niche} ${loc} contact`,
    `${niche} ${loc} directory email`,
    `${loc} ${niche} service providers email`,
    `list of ${niche} companies in ${loc} with email`,
    `${niche} agencies ${loc}`,
    `${service} companies ${loc} email`,
    `best ${niche} ${loc} contact information`,
    `${niche} firms ${loc} email address`,
  ];

  for (const q of additions) {
    if (queries.length < 12) {
      queries.push(q);
    }
  }

  return queries;
}

export async function extractLeadsFromPastedText(
  campaign: { targetNiche: string; targetLocation: string; serviceToPitch: string },
  sourceUrl: string,
  pastedText: string
): Promise<{ leads: ExtractedLead[]; provider: string; model: string }> {
  const aiResult = await tryAiExtraction(campaign, pastedText);

  if (aiResult) {
    const leads = aiResult.leads.map((l) => ({
      ...l,
      sourceUrl,
    }));
    return { leads, provider: aiResult.provider, model: aiResult.model };
  }

  const localLeads = localExtractLeads(pastedText, sourceUrl, campaign.targetNiche);
  return { leads: localLeads, provider: "local-rules", model: "regex-parser" };
}

async function tryAiExtraction(
  campaign: { targetNiche: string; targetLocation: string },
  pastedText: string
): Promise<{ leads: ExtractedLead[]; provider: string; model: string } | null> {
  const systemPrompt =
    "You extract public B2B lead data from user-provided pasted text. Return only valid JSON. Do not invent emails or websites. If data is missing, use empty string.";

  const userPrompt = [
    `Campaign niche: ${campaign.targetNiche}`,
    `Campaign location: ${campaign.targetLocation}`,
    ``,
    `Pasted text:`,
    pastedText.slice(0, 8000),
    ``,
    `Extract all business leads. Return JSON:`,
    `{"leads":[{"companyName":"","website":"","email":"","industry":"","confidence":0,"notes":""}]}`,
    `Max 25 leads. Do not invent data.`,
  ].join("\n");

  const result = await generateJsonWithFallback<{ leads: ExtractedLead[] }>({
    systemPrompt,
    userPrompt,
    temperature: 0.1,
    maxTokens: 2000,
  });

  if (result.success && result.data?.leads && Array.isArray(result.data.leads)) {
    const valid = result.data.leads
      .filter((l) => l.companyName?.trim())
      .slice(0, 25)
      .map((l) => ({
        companyName: l.companyName.trim(),
        website: l.website?.trim() || "",
        email: l.email?.trim() || "",
        sourceUrl: l.sourceUrl?.trim() || "",
        industry: l.industry?.trim() || campaign.targetNiche,
        confidence: Math.min(Math.max(l.confidence || 0, 0), 100),
        notes: l.notes?.trim() || "",
      }));
    return { leads: valid, provider: result.provider, model: result.model };
  }

  return null;
}

function localExtractLeads(
  text: string,
  sourceUrl: string,
  defaultIndustry: string
): ExtractedLead[] {
  const emails = extractEmails(text);
  const urls = extractUrls(text);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const leads: ExtractedLead[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineEmails = extractEmails(line);
    const lineUrls = extractUrls(line);

    if (lineEmails.length === 0) continue;

    for (const email of lineEmails) {
      if (seen.has(email)) continue;
      seen.add(email);

      const companyName = inferCompanyName(line, lines, i, email);
      const website = lineUrls.find((u) => !u.includes("mailto:")) || findNearbyUrl(lines, i) || "";
      const confidence = companyName && website ? 75 : companyName ? 55 : 35;

      const notes: string[] = [];
      if (!companyName) notes.push("Company name could not be confidently extracted");
      if (!website) notes.push("Website URL not found nearby");
      const sourceEmail = emails.find((e) => e !== email);
      if (sourceEmail) notes.push(`Other emails in text: ${sourceEmail}`);

      leads.push({
        companyName: companyName || `Business at ${email.split("@")[1] || "unknown"}`,
        website,
        email,
        sourceUrl,
        industry: defaultIndustry,
        confidence,
        notes: notes.join("; "),
      });
    }
  }

  return leads.slice(0, 25);
}

function extractEmails(text: string): string[] {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set((text.match(regex) || []).map((e) => e.toLowerCase()))];
}

function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s<>"']+/g;
  return [...new Set(text.match(regex) || [])];
}

function inferCompanyName(
  currentLine: string,
  allLines: string[],
  index: number,
  email: string
): string {
  const domain = email.split("@")[1]?.replace(/\.(com|org|net|in|co|uk|io|ai)$/, "") || "";
  const domainName = domain
    .split(/[.-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const cleaned = currentLine.replace(/https?:\/\/[^\s]+/g, "").replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "").trim();

  const businessKeywords = /(Pvt\.?\s*Ltd\.?|Limited|LLC|Inc\.?|Corp\.?|Technologies|Solutions|Services|Agency|Studio|Consulting|Enterprises|Group|Company)/i;
  const possibleName = cleaned.replace(/[,;:|]/g, "").trim();

  if (possibleName.length > 2 && possibleName.length < 100 && businessKeywords.test(possibleName)) {
    return possibleName;
  }

  if (possibleName.length > 2 && possibleName.length < 60) {
    return possibleName;
  }

  const prevLines: string[] = [];
  for (let j = Math.max(0, index - 3); j < index; j++) {
    const p = allLines[j].replace(/https?:\/\/[^\s]+/g, "").replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "").trim();
    if (p.length > 3 && p.length < 80) prevLines.push(p);
  }

  for (const pl of prevLines) {
    if (businessKeywords.test(pl)) return pl;
  }

  return prevLines[0] || domainName || "";
}

function findNearbyUrl(lines: string[], index: number): string {
  for (let j = Math.max(0, index - 3); j <= Math.min(lines.length - 1, index + 3); j++) {
    const urls = extractUrls(lines[j]);
    const nonMailto = urls.find((u) => !u.includes("mailto:"));
    if (nonMailto) return nonMailto;
  }
  return "";
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/$/, "");
}

export async function findDuplicateLeadByEmail(
  campaignId: string,
  email: string
): Promise<boolean> {
  if (!email) return false;
  const normalized = normalizeEmail(email);
  const existing = await prisma.lead.findFirst({
    where: {
      campaignId,
      email: normalized,
    },
  });
  return !!existing;
}

export function validateExtractedLead(
  lead: ExtractedLead
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!lead.companyName?.trim()) errors.push("Company name is required");
  if (!lead.email?.trim()) errors.push("Email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email))
    errors.push("Invalid email format");
  if (!lead.website?.trim()) errors.push("Website is required");
  else if (!/^https?:\/\/.+/.test(lead.website))
    errors.push("Website must be a valid URL starting with http:// or https://");
  if (!lead.sourceUrl?.trim()) errors.push("Source URL is required");
  else if (!/^https?:\/\/.+/.test(lead.sourceUrl))
    errors.push("Source URL must be a valid URL");
  return { valid: errors.length === 0, errors };
}
