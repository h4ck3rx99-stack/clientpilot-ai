import { AIProvider, AIProviderName, AIProviderStatus, AIJsonResult, GenerationInput } from "../types";
import { analyzeLead } from "@/lib/lead-analysis";
import { generateOutreachEmail } from "@/lib/email-template";

export type LocalIntelligenceInput = {
  companyName: string;
  website?: string | null;
  email?: string | null;
  sourceUrl?: string | null;
  industry?: string | null;
  targetNiche?: string;
  serviceToPitch?: string;
  services?: string;
  businessName?: string | null;
  senderName?: string | null;
  offer?: string;
  cta?: string;
};

export class LocalRulesProvider implements AIProvider {
  name: AIProviderName = "local-rules";
  model = "deterministic-rules";

  getStatus(): AIProviderStatus {
    return "available";
  }

  async generateJson<T>(_input: GenerationInput): Promise<AIJsonResult<T>> {
    return { provider: this.name, model: this.model, success: false, error: "Use generateLeadIntelligenceLocal() instead" };
  }

  async generateLeadIntelligence(input: LocalIntelligenceInput): Promise<AIJsonResult<{
    industry: string;
    painPoint: string;
    offerAngle: string;
    personalizationLine: string;
    emailSubject: string;
    emailBody: string;
  }>> {
    const analysis = analyzeLead(input);

    const emailResult = generateOutreachEmail({
      businessName: input.businessName,
      senderName: input.senderName,
      services: input.services,
      serviceToPitch: input.serviceToPitch,
      offer: input.offer,
      cta: input.cta,
      companyName: input.companyName,
      industry: analysis.industry,
      painPoint: analysis.painPoint,
      offerAngle: analysis.offerAngle,
      personalizationLine: analysis.personalizationLine,
    });

    return {
      provider: this.name,
      model: this.model,
      success: true,
      data: {
        industry: analysis.industry,
        painPoint: analysis.painPoint,
        offerAngle: analysis.offerAngle,
        personalizationLine: analysis.personalizationLine,
        emailSubject: emailResult.subject,
        emailBody: emailResult.body,
      },
    };
  }
}
