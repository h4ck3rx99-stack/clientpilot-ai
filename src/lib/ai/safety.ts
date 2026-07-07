const BANNED_SALES_CLAIMS = [
  "as discussed",
  "as we spoke",
  "guaranteed",
  "I know your revenue",
  "I noticed your sales are down",
  "urgent problem",
  "you are losing customers",
  "your website is bad",
  "I saw your website",
];

export function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

export function safeParseJson<T>(text: string): { data?: T; error?: string } {
  try {
    const cleaned = stripCodeFences(text);
    const parsed = JSON.parse(cleaned) as T;
    return { data: parsed };
  } catch (e) {
    return { error: `JSON parse error: ${(e as Error).message}` };
  }
}

export function sanitizeAIText(text: string): string {
  return text.replace(/[<>]/g, "").trim();
}

export function enforceStringLength(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}

export function containsBannedSalesClaims(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_SALES_CLAIMS.some((claim) => lower.includes(claim));
}

export function ensureUnsubscribeSentence(body: string): string {
  if (
    body.toLowerCase().includes("unsubscribe") ||
    body.toLowerCase().includes("opt out")
  ) {
    return body;
  }
  return `${body}\n\nIf this is not relevant, reply "unsubscribe" and I will not contact you again.`;
}

export function validateLeadIntelligenceJson(
  data: Record<string, unknown>
): string | null {
  if (!data.industry || typeof data.industry !== "string")
    return "Missing or invalid industry";
  if (!data.painPoint || typeof data.painPoint !== "string")
    return "Missing or invalid painPoint";
  if (!data.offerAngle || typeof data.offerAngle !== "string")
    return "Missing or invalid offerAngle";
  if (!data.personalizationLine || typeof data.personalizationLine !== "string")
    return "Missing or invalid personalizationLine";
  if (!data.emailSubject || typeof data.emailSubject !== "string")
    return "Missing or invalid emailSubject";
  if (!data.emailBody || typeof data.emailBody !== "string")
    return "Missing or invalid emailBody";
  return null;
}

export function validateEmailDraftJson(
  data: Record<string, unknown>
): string | null {
  if (!data.subject || typeof data.subject !== "string")
    return "Missing or invalid subject";
  if (data.subject.length > 120) return "Subject exceeds 120 chars";
  if (!data.body || typeof data.body !== "string")
    return "Missing or invalid body";
  if (data.body.length > 3000) return "Body exceeds 3000 chars";
  if (containsBannedSalesClaims(data.body))
    return "Body contains banned sales claims";
  if (containsBannedSalesClaims(data.subject))
    return "Subject contains banned sales claims";
  return null;
}

export function estimateWordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
