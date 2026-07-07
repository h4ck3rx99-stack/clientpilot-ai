export type AIProviderName = "groq" | "gemini" | "openrouter" | "local-rules";

export type AIProviderStatus = "available" | "missing-config" | "error";

export type AIJsonResult<T> = {
  provider: AIProviderName;
  model: string;
  success: boolean;
  data?: T;
  error?: string;
};

export type GenerationInput = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
};

export interface AIProvider {
  name: AIProviderName;
  model: string;
  getStatus(): AIProviderStatus;
  generateJson<T>(input: GenerationInput): Promise<AIJsonResult<T>>;
}

export type AIUsageLogInput = {
  provider: AIProviderName;
  model: string;
  taskType: AILeadTaskType;
  success: boolean;
  errorMessage?: string;
};

export type AILeadTaskType =
  | "LEAD_INTELLIGENCE"
  | "LEAD_ANALYSIS"
  | "INITIAL_EMAIL"
  | "FOLLOW_UP_EMAIL";
