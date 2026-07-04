export type ScoreBreakdown = {
  serviceMatch: { score: number; max: number; reason: string };
  painSignal: { score: number; max: number; reason: string };
  businessActivity: { score: number; max: number; reason: string };
  reachability: { score: number; max: number; reason: string };
  personalization: { score: number; max: number; reason: string };
};

export type ScoringInput = {
  companyName?: string;
  website?: string | null;
  email?: string | null;
  sourceUrl?: string | null;
  industry?: string | null;
  targetNiche?: string;
  serviceToPitch?: string;
  services?: string;
};

const NICHE_PAIN_MAP: Record<string, { keywords: string[]; pain: string }> = {
  education: {
    keywords: ["enquiry", "calling", "automation", "website", "admissions", "follow"],
    pain: "Education sector — likely needs enquiry automation and follow-up systems",
  },
  clinic: {
    keywords: ["booking", "website", "automation", "appointment", "patient"],
    pain: "Clinic/healthcare — likely needs booking and patient follow-up automation",
  },
  healthcare: {
    keywords: ["booking", "website", "automation", "appointment", "patient"],
    pain: "Healthcare — likely needs appointment scheduling and follow-up tools",
  },
  lawyer: {
    keywords: ["website", "lead", "contact", "intake", "client"],
    pain: "Legal — likely needs improved client intake and website conversion",
  },
  legal: {
    keywords: ["website", "lead", "contact", "intake", "client"],
    pain: "Legal — likely needs improved client intake and website conversion",
  },
  agency: {
    keywords: ["crm", "dashboard", "automation", "project", "workflow"],
    pain: "Agency — likely needs CRM, dashboard, and workflow automation",
  },
  fintech: {
    keywords: ["website", "automation", "onboarding", "compliance", "lead"],
    pain: "Fintech — likely needs automated onboarding and lead management",
  },
  saas: {
    keywords: ["website", "crm", "automation", "dashboard", "trial"],
    pain: "SaaS — likely needs trial follow-up and customer onboarding automation",
  },
  ecommerce: {
    keywords: ["website", "automation", "cart", "email", "crm"],
    pain: "E-commerce — likely needs cart abandonment recovery and CRM",
  },
  realestate: {
    keywords: ["website", "listing", "lead", "contact", "automation"],
    pain: "Real estate — likely needs lead capture and property inquiry follow-up",
  },
  consulting: {
    keywords: ["website", "crm", "lead", "outreach", "automation"],
    pain: "Consulting — likely needs client outreach and CRM systems",
  },
};

function getNichePainKeywords(
  industry?: string | null,
  targetNiche?: string
): { keywords: string[]; pain: string } | null {
  const text = [industry, targetNiche].filter(Boolean).join(" ").toLowerCase();
  for (const [key, val] of Object.entries(NICHE_PAIN_MAP)) {
    if (text.includes(key)) return val;
  }
  return null;
}

export function calculateLeadFitScore(
  input: ScoringInput
): { total: number; breakdown: ScoreBreakdown } {
  const breakdown: ScoreBreakdown = {
    serviceMatch: { score: 0, max: 25, reason: "" },
    painSignal: { score: 0, max: 25, reason: "" },
    businessActivity: { score: 0, max: 15, reason: "" },
    reachability: { score: 0, max: 15, reason: "" },
    personalization: { score: 0, max: 20, reason: "" },
  };

  const companyText = [
    input.companyName,
    input.industry,
    input.website,
    input.targetNiche,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const pitchWords = (input.serviceToPitch || "").toLowerCase().split(/\s+/);
  const servicesWords = (input.services || "").toLowerCase().split(/\s+/);
  const allServiceWords = [...new Set([...pitchWords, ...servicesWords])];

  const matchedKeywords = allServiceWords.filter((w) =>
    companyText.includes(w)
  );
  const matchCount = matchedKeywords.length;
  if (matchCount > 0) {
    breakdown.serviceMatch.score = Math.min(matchCount * 5, 25);
    breakdown.serviceMatch.reason = `Matched ${matchCount} service keyword${matchCount > 1 ? "s" : ""}: ${matchedKeywords.slice(0, 3).join(", ")}`;
  } else {
    breakdown.serviceMatch.reason = "No service keyword match found";
  }

  const nichePain = getNichePainKeywords(input.industry, input.targetNiche);
  if (nichePain) {
    breakdown.painSignal.score = 25;
    breakdown.painSignal.reason = nichePain.pain;
  } else if (input.industry) {
    breakdown.painSignal.score = 10;
    breakdown.painSignal.reason = `Industry "${input.industry}" provided — general opportunity`;
  } else {
    breakdown.painSignal.reason = "No industry or niche signal available";
  }

  let activityScore = 0;
  const activityReasons: string[] = [];
  if (input.website) {
    activityScore += 6;
    activityReasons.push("Has website");
  }
  if (input.email) {
    activityScore += 5;
    activityReasons.push("Has email");
  }
  if (input.sourceUrl) {
    activityScore += 4;
    activityReasons.push("Has source URL");
  }
  breakdown.businessActivity.score = Math.min(activityScore, 15);
  breakdown.businessActivity.reason =
    activityReasons.join(", ") || "No business signals detected";

  let reachScore = 0;
  const email = input.email || "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const local = email.split("@")[0].toLowerCase();
    const genericPrefixes = ["info", "contact", "hello", "support", "admin", "enquiries", "mail", "office", "sales"];
    if (!genericPrefixes.includes(local) && !/^\d+$/.test(local)) {
      reachScore = 15;
      breakdown.reachability.reason = `Valid business email (${local}@...)`;
    } else {
      reachScore = 8;
      breakdown.reachability.reason = `Valid but generic email prefix (${local}@...)`;
    }
  } else {
    breakdown.reachability.reason = "No valid email available";
  }
  breakdown.reachability.score = reachScore;

  let persScore = 0;
  const persReasons: string[] = [];
  if (input.companyName) {
    persScore += 5;
    persReasons.push("Company name known");
  }
  if (input.industry) {
    persScore += 5;
    persReasons.push("Industry known");
  }
  if (input.website || input.sourceUrl) {
    persScore += 5;
    persReasons.push("Has web presence data");
  }
  if (input.targetNiche && input.industry) {
    const nicheW = input.targetNiche.toLowerCase().split(/\s+/);
    const indW = input.industry.toLowerCase().split(/\s+/);
    if (nicheW.some((w) => indW.includes(w))) {
      persScore += 5;
      persReasons.push("Industry matches campaign niche");
    }
  }
  breakdown.personalization.score = Math.min(persScore, 20);
  breakdown.personalization.reason =
    persReasons.join(", ") || "No personalization signals";

  const total = Math.min(
    breakdown.serviceMatch.score +
      breakdown.painSignal.score +
      breakdown.businessActivity.score +
      breakdown.reachability.score +
      breakdown.personalization.score,
    100
  );

  return { total, breakdown };
}
