import { AIProvider, AIProviderName, AIProviderStatus, AIJsonResult, GenerationInput } from "../types";
import { safeParseJson } from "../safety";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider implements AIProvider {
  name: AIProviderName = "openrouter";
  model: string;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    this.model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
  }

  getStatus(): AIProviderStatus {
    if (!this.apiKey) return "missing-config";
    return "available";
  }

  async generateJson<T>(input: GenerationInput): Promise<AIJsonResult<T>> {
    const status = this.getStatus();
    if (status !== "available") {
      return { provider: this.name, model: this.model, success: false, error: "OPENROUTER_API_KEY not configured" };
    }

    const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "20000", 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const payload = {
        model: this.model,
        messages: [
          { role: "system" as const, content: input.systemPrompt },
          { role: "user" as const, content: input.userPrompt },
        ],
        temperature: input.temperature ?? 0.3,
        max_tokens: input.maxTokens ?? 900,
        response_format: { type: "json_object" as const },
      };

      let res = await fetch(OPENROUTER_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (res.status === 400) {
        const errorBody = await res.text();
        if (errorBody.includes("response_format")) {
          const retryPayload = { ...payload, response_format: undefined };
          res = await fetch(OPENROUTER_BASE, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(retryPayload),
            signal: controller.signal,
          });
        } else {
          return { provider: this.name, model: this.model, success: false, error: `Bad request: ${errorBody}` };
        }
      }

      if (!res.ok) {
        const errorText = await res.text();
        return { provider: this.name, model: this.model, success: false, error: `HTTP ${res.status}: ${errorText}` };
      }

      const json = await res.json();
      const content: string = json.choices?.[0]?.message?.content || "";

      if (!content) {
        return { provider: this.name, model: this.model, success: false, error: "Empty response from OpenRouter" };
      }

      const parsed = safeParseJson<T>(content);
      if (parsed.error) {
        return { provider: this.name, model: this.model, success: false, error: parsed.error };
      }

      return { provider: this.name, model: this.model, success: true, data: parsed.data };
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return { provider: this.name, model: this.model, success: false, error: "Request timed out" };
      }
      return { provider: this.name, model: this.model, success: false, error: (err as Error).message };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
