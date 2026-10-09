import { AIProvider, AIProviderName, AIProviderStatus, AIJsonResult, GenerationInput } from "../types";

export class LocalRulesProvider implements AIProvider {
  name: AIProviderName = "local-rules";
  model = "deterministic-rules";

  getStatus(): AIProviderStatus {
    return "available";
  }

  async generateJson<T>(_input: GenerationInput): Promise<AIJsonResult<T>> {
    return { provider: this.name, model: this.model, success: false, error: "AI provider is not configured and local rules fallback is active" };
  }
}
