export type QualityResult = {
  score: number;
  warnings: string[];
  suggestions: string[];
};

const BANNED_PATTERNS = [
  /guaranteed?\s+(results?|income|profit|success)/i,
  /act\s+(now|fast|quickly)/i,
  /limited\s+(time|offer|spot)/i,
  /exclusive\s+opportunity/i,
  /don'?t\s+miss\s+(out|this)/i,
  /click\s+here/i,
  /free\s+(money|cash|gift|prize)/i,
  /earn\s+\$\d/i,
];

const PUSHY_PATTERNS = [
  /urgent/i,
  /immediately/i,
  /asap/i,
  /right\s+away/i,
  /without\s+delay/i,
  /must\s+(\w+\s+){0,2}(act|respond|reply)/i,
];

export function scoreEmailQuality(subject: string, body: string): QualityResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const bodyWords = body.split(/\s+/).filter(Boolean);
  const wordCount = bodyWords.length;
  const exclamationCount = (body.match(/!/g) || []).length;

  if (subject.length > 70) {
    warnings.push("Subject is over 70 characters — aim for shorter subjects");
    score -= 10;
  }

  if (wordCount > 180) {
    warnings.push(`Body is ${wordCount} words — keep initial emails under 180 words`);
    score -= 10;
  }

  if (wordCount < 30) {
    warnings.push("Body seems very short — add context and value");
    score -= 10;
  }

  if (!/hello|hi\b|dear|greetings/i.test(body)) {
    warnings.push("No greeting found — add a polite opening");
    score -= 10;
  }

  if (!/(?:i'?m|my|our|we|the\s+\w+\s+team)\b.*\b(?:at|from|with)\b/i.test(body) && !body.includes("\n-- \n")) {
    warnings.push("No sender name or business mentioned — help the recipient know who you are");
    score -= 10;
  }

  if (!/(?:would\s+you|are\s+you|could\s+we|let'?s|call|meet|chat|talk|discuss|interested|open\s+to)/i.test(body)) {
    warnings.push("No clear call to action found");
    score -= 10;
  }

  if (!body.includes("unsubscribe") && !body.includes("opt-out")) {
    suggestions.push("Add an unsubscribe link or opt-out note");
    score -= 5;
  }

  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(body) || pattern.test(subject)) {
      warnings.push(`Contains language that may appear pushy or spammy: "${pattern.source}"`);
      score -= 15;
    }
  }

  for (const pattern of PUSHY_PATTERNS) {
    if (pattern.test(body) || pattern.test(subject)) {
      warnings.push(`Contains urgency language: "${pattern.source}" — keep tone relaxed`);
      score -= 10;
    }
  }

  if (exclamationCount > 2) {
    warnings.push(`Too many exclamation marks (${exclamationCount}) — keep tone measured`);
    score -= 5;
  }

  if (body.includes("{{") || body.includes("<<") || body.includes("[Name]") || body.includes("[Company]")) {
    warnings.push("Body contains template placeholders — make sure these were replaced");
    score -= 15;
  }

  suggestions.push("Keep subject under 60 characters for best open rates");
  suggestions.push("Personalize the opening line to the recipient");
  suggestions.push("End with a single clear question or CTA");

  return {
    score: Math.max(0, score),
    warnings: [...new Set(warnings)],
    suggestions: [...new Set(suggestions)],
  };
}
