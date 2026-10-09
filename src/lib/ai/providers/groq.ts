import { AIProvider, AIProviderName, AIProviderStatus, AIJsonResult, GenerationInput } from "../types";
import { safeParseJson } from "../safety";

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements AIProvider {
  name: AIProviderName = "groq";
  model: string;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    this.model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  }

  getStatus(): AIProviderStatus {
    if (!this.apiKey) return "missing-config";
    return "available";
  }

  async generateJson<T>(input: GenerationInput): Promise<AIJsonResult<T>> {
    const status = this.getStatus();
    if (status !== "available") {
      return { provider: this.name, model: this.model, success: false, error: "GROQ_API_KEY not configured" };
    }

    const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || "20000", 10);
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

    let retries = 3;
    let delayMs = 3000;
    let lastErrorMsg = "Unknown error";

    while (retries > 0) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        let res = await fetch(GROQ_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (res.status === 429) {
          clearTimeout(timeoutId);
          if (retries > 1) {
            console.warn(`[Groq] Rate limited (429). Retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            retries--;
            delayMs += 2000; // Exponential backoff
            continue;
          }
          return { provider: this.name, model: this.model, success: false, error: "Rate limited (429)" };
        }

        if (res.status === 400) {
          const errorBody = await res.text();
          clearTimeout(timeoutId);
          if (errorBody.includes("response_format")) {
            // Fallback for models that do not support json_object format
            const retryPayload = { ...payload, response_format: undefined };
            const retryRes = await fetch(GROQ_BASE, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
              },
              body: JSON.stringify(retryPayload),
            });
            if (!retryRes.ok) {
              return { provider: this.name, model: this.model, success: false, error: `HTTP ${retryRes.status} on fallback` };
            }
            const json = await retryRes.json();
            const content = json.choices?.[0]?.message?.content || "";
            const parsed = safeParseJson<T>(content);
            return { provider: this.name, model: this.model, success: !parsed.error, data: parsed.data, error: parsed.error };
          }
          return { provider: this.name, model: this.model, success: false, error: `Bad request: ${errorBody}` };
        }

        if (!res.ok) {
          const errorText = await res.text();
          clearTimeout(timeoutId);
          return { provider: this.name, model: this.model, success: false, error: `HTTP ${res.status}: ${errorText}` };
        }

        const json = await res.json();
        clearTimeout(timeoutId);
        const content: string = json.choices?.[0]?.message?.content || "";

        if (!content) {
          return { provider: this.name, model: this.model, success: false, error: "Empty response from Groq" };
        }

        const parsed = safeParseJson<T>(content);
        if (parsed.error) {
          return { provider: this.name, model: this.model, success: false, error: parsed.error };
        }

        return { provider: this.name, model: this.model, success: true, data: parsed.data };
      } catch (err) {
        clearTimeout(timeoutId);
        if ((err as Error).name === "AbortError") {
          lastErrorMsg = "Request timed out";
        } else {
          lastErrorMsg = (err as Error).message;
        }

        if (retries > 1) {
          console.warn(`[Groq] Request failed (${lastErrorMsg}). Retrying in 1500ms...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          retries--;
          continue;
        }
        return { provider: this.name, model: this.model, success: false, error: lastErrorMsg };
      }
    }

    return { provider: this.name, model: this.model, success: false, error: lastErrorMsg };
  }
}
