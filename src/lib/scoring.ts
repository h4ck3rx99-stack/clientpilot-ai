export type ScoringInput = {
  industry?: string | null;
  painPoint?: string | null;
  sourceUrl?: string | null;
  companyName?: string;
  targetNiche?: string;
};

export function calculateLeadFitScore(input: ScoringInput): number {
  let score = 0;

  if (input.sourceUrl) {
    score += 10;
  }

  if (input.painPoint && input.painPoint.length > 0) {
    score += 20;
  }

  if (input.industry && input.targetNiche) {
    const nicheWords = input.targetNiche.toLowerCase().split(/\s+/);
    const industryWords = input.industry.toLowerCase().split(/\s+/);
    const matched = nicheWords.some((w) => industryWords.includes(w));
    if (matched) {
      score += 30;
    }
  }

  return Math.min(score, 100);
}
