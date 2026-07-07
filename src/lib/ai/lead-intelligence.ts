import { prisma } from "@/lib/prisma";
import { generateJsonWithFallback } from "./index";
import { LocalRulesProvider, LocalIntelligenceInput } from "./providers/local-rules";
import { validateLeadIntelligenceJson, ensureUnsubscribeSentence, enforceStringLength, sanitizeAIText } from "./safety";
import type { AILeadTaskType, AIProviderName } from "./types";

export type LeadIntelligenceResult = {
  industry: string;
  painPoint: string;
  offerAngle: string;
  personalizationLine: string;
  emailSubject: string;
  emailBody: string;
};

export type GenerateLeadIntelligenceOutput = {
  result: LeadIntelligenceResult;
  provider: AIProviderName;
  model: string;
};

export async function generateLeadIntelligence(
  leadId: string
): Promise<{ data?: GenerateLeadIntelligenceOutput; error?: string }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      campaign: {
        select: {
          targetNiche: true,
          targetLocation: true,
          serviceToPitch: true,
          offer: true,
          cta: true,
        },
      },
    },
  });

  if (!lead) return { error: "Lead not found" };

  const profile = await prisma.userProfile.findFirst();
  if (!profile) return { error: "Profile not found" };

  const systemPrompt =
    "You write concise B2B outreach analysis and emails. Return only valid JSON. Do not invent facts. Do not use manipulative wording.";

  const userPrompt = [
    `Business: ${profile.businessName || "Our business"}`,
    `Sender: ${profile.senderName || "Team member"}`,
    `Services: ${profile.services || profile.services || "lead generation services"}`,
    `Proof: ${profile.proof || ""}`,
    `Campaign service: ${lead.campaign.serviceToPitch}`,
    `Target niche: ${lead.campaign.targetNiche}`,
    `Target location: ${lead.campaign.targetLocation}`,
    `Offer: ${lead.campaign.offer}`,
    `CTA: ${lead.campaign.cta}`,
    ``,
    `Lead company: ${lead.companyName}`,
    `Lead website: ${lead.website || "N/A"}`,
    `Lead email: ${lead.email || "N/A"}`,
    `Lead source: ${lead.sourceUrl || "N/A"}`,
    `Lead industry: ${lead.industry || "N/A"}`,
  ].join("\n");

  const jsonResult = await generateJsonWithFallback<Record<string, unknown>>({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens: 900,
  });

  if (jsonResult.success && jsonResult.data) {
    const validationError = validateLeadIntelligenceJson(jsonResult.data);
    if (!validationError) {
      const d = jsonResult.data;
      const emailBody = enforceStringLength(
        ensureUnsubscribeSentence(sanitizeAIText(d.emailBody as string)),
        3000
      );
      const emailSubject = enforceStringLength(sanitizeAIText(d.emailSubject as string), 120);

      return {
        data: {
          result: {
            industry: sanitizeAIText(d.industry as string),
            painPoint: sanitizeAIText(d.painPoint as string),
            offerAngle: sanitizeAIText(d.offerAngle as string),
            personalizationLine: sanitizeAIText(d.personalizationLine as string),
            emailSubject,
            emailBody,
          },
          provider: jsonResult.provider,
          model: jsonResult.model,
        },
      };
    }

    console.error(`[AI] Validation error: ${validationError}, falling back to local rules`);
  }

  const local = new LocalRulesProvider();
  const localInput: LocalIntelligenceInput = {
    companyName: lead.companyName,
    website: lead.website,
    email: lead.email,
    sourceUrl: lead.sourceUrl,
    industry: lead.industry ?? undefined,
    targetNiche: lead.campaign.targetNiche,
    serviceToPitch: lead.campaign.serviceToPitch,
    services: profile.services ?? undefined,
    businessName: profile.businessName,
    senderName: profile.senderName,
    offer: lead.campaign.offer,
    cta: lead.campaign.cta,
  };

  const localResult = await local.generateLeadIntelligence(localInput);
  if (localResult.success && localResult.data) {
    return {
      data: {
        result: localResult.data,
        provider: localResult.provider,
        model: localResult.model,
      },
    };
  }

  return { error: localResult.error || "Local rules also failed" };
}

export async function logAIUsage(input: {
  provider: AIProviderName;
  model: string;
  taskType: AILeadTaskType;
  success: boolean;
  errorMessage?: string;
}) {
  try {
    await prisma.aIUsageLog.create({
      data: {
        provider: input.provider,
        model: input.model,
        taskType: input.taskType,
        success: input.success,
        errorMessage: input.errorMessage || null,
      },
    });
  } catch (e) {
    console.error("[AI] Failed to log usage:", e);
  }
}
