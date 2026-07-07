import { AIProvider, AIProviderName, AIProviderStatus, AIJsonResult, GenerationInput } from "./types";
import { GroqProvider } from "./providers/groq";
import { GeminiProvider } from "./providers/gemini";
import { OpenRouterProvider } from "./providers/openrouter";
import { LocalRulesProvider } from "./providers/local-rules";

function getProviders(): AIProvider[] {
  return [
    new GroqProvider(),
    new GeminiProvider(),
    new OpenRouterProvider(),
    new LocalRulesProvider(),
  ];
}

export function getProviderStatuses(): { name: AIProviderName; model: string; status: AIProviderStatus }[] {
  return getProviders().map((p) => ({
    name: p.name,
    model: p.model,
    status: p.getStatus(),
  }));
}

export function getConfiguredProvider(): AIProviderName {
  return (process.env.AI_PROVIDER as AIProviderName) || "groq";
}

export async function generateJsonWithFallback<T>(
  input: GenerationInput
): Promise<AIJsonResult<T> & { fallbackUsed?: boolean }> {
  const preferred = getConfiguredProvider();
  const providers = getProviders();

  const ordered = [
    providers.find((p) => p.name === preferred),
    ...providers.filter((p) => p.name !== preferred && p.name !== "local-rules"),
    providers.find((p) => p.name === "local-rules"),
  ].filter(Boolean) as AIProvider[];

  let lastError: string | undefined;

  for (const provider of ordered) {
    const status = provider.getStatus();
    if (status !== "available") {
      if (provider.name !== "local-rules") {
        console.error(`[AI] Provider ${provider.name} is not available (${status})`);
      }
      continue;
    }

    const result = await provider.generateJson<T>(input);
    if (result.success) {
      return { ...result, fallbackUsed: provider.name !== preferred };
    }

    lastError = result.error;
    if (provider.name !== "local-rules") {
      console.error(`[AI] Provider ${provider.name} failed: ${result.error}`);
    }
  }

  return {
    provider: "local-rules" as AIProviderName,
    model: "deterministic-rules",
    success: false,
    error: lastError || "All providers failed",
  };
}

export { GroqProvider } from "./providers/groq";
export { GeminiProvider } from "./providers/gemini";
export { OpenRouterProvider } from "./providers/openrouter";
export { LocalRulesProvider } from "./providers/local-rules";
