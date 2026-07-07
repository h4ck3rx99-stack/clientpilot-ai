import { AIProvider, AIProviderName, AIProviderStatus, AIJsonResult, GenerationInput } from "../types";
import { safeParseJson } from "../safety";

export class GeminiProvider implements AIProvider {
  name: AIProviderName = "gemini";
  model: string;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  }

  getStatus(): AIProviderStatus {
    if (!this.apiKey) return "missing-config";
    return "available";
  }

  async generateJson<T>(input: GenerationInput): Promise<AIJsonResult<T>> {
    const status = this.getStatus();
    if (status !== "available") {
      return { provider: this.name, model: this.model, success: false, error: "GEMINI_API_KEY not configured" };
    }

    const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "20000", 10);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: `${input.systemPrompt}\n\n${input.userPrompt}\n\nReturn only valid JSON.` },
            ],
          },
        ],
        generationConfig: {
          temperature: input.temperature ?? 0.3,
          maxOutputTokens: input.maxTokens ?? 900,
        },
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { provider: this.name, model: this.model, success: false, error: `HTTP ${res.status}: ${errorText}` };
      }

      const json = await res.json();
      const content: string = json.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!content) {
        return { provider: this.name, model: this.model, success: false, error: "Empty response from Gemini" };
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
