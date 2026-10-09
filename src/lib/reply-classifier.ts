import { generateJsonWithFallback } from "./ai";

export type ReplyCategory =
  | "interested"
  | "asking_pricing"
  | "more_info"
  | "not_interested"
  | "follow_up_later"
  | "auto_reply"
  | "unsubscribe";

export async function classifyReplyBody(body: string): Promise<ReplyCategory> {
  try {
    const systemPrompt = `You are an inbox assistant. Categorize the incoming email reply into exactly one of these groups: "interested", "asking_pricing", "more_info", "not_interested", "follow_up_later", "auto_reply", or "unsubscribe". Return ONLY a valid JSON object. No other text.`;
    
    const userPrompt = `
Analyze this email reply body:
"""
${body}
"""

Determine which category it fits best:
- "unsubscribe": User explicitly asks to stop, unsubscribe, opt out, or remove them from the list.
- "not_interested": User is polite but says no, they already have a solution, or they don't need it.
- "asking_pricing": User is interested and asks about pricing, rates, or costs.
- "more_info": User asks for details, examples, or more explanation about what you do.
- "interested": User wants to jump on a call, book a meeting, or get started.
- "follow_up_later": User is busy now but asks to follow up in a week, next month, or later.
- "auto_reply": An automated out-of-office message, vacation responder, or delivery receipt.

Return ONLY:
{
  "category": "one_of_the_above_categories"
}
`;

    const result = await generateJsonWithFallback<{ category: ReplyCategory }>({
      systemPrompt,
      userPrompt,
      temperature: 0.1,
      maxTokens: 150,
    });

    if (result.success && result.data?.category) {
      const cat = result.data.category.toLowerCase().trim();
      const validCategories: ReplyCategory[] = [
        "interested",
        "asking_pricing",
        "more_info",
        "not_interested",
        "follow_up_later",
        "auto_reply",
        "unsubscribe",
      ];
      if (validCategories.includes(cat as ReplyCategory)) {
        return cat as ReplyCategory;
      }
    }
  } catch (error) {
    console.error("AI Reply classification failed:", error);
  }

  // Local regex-based classification fallback
  return classifyDeterministic(body);
}

function classifyDeterministic(body: string): ReplyCategory {
  const text = body.toLowerCase().trim();

  // 1. Unsubscribe
  if (
    text.includes("unsubscribe") ||
    text.includes("stop") ||
    text.includes("remove me") ||
    text.includes("don't email") ||
    text.includes("opt out") ||
    text.includes("never contact")
  ) {
    return "unsubscribe";
  }

  // 2. Auto Reply
  if (
    text.includes("out of office") ||
    text.includes("vacation") ||
    text.includes("automated reply") ||
    text.includes("autoresponder") ||
    text.includes("autoreply")
  ) {
    return "auto_reply";
  }

  // 3. Not Interested
  if (
    text.includes("not interested") ||
    text.includes("no thanks") ||
    text.includes("not looking") ||
    text.includes("not interested") ||
    text.includes("busy with other") ||
    text.includes("already have")
  ) {
    return "not_interested";
  }

  // 4. Pricing
  if (
    text.includes("pricing") ||
    text.includes("cost") ||
    text.includes("how much") ||
    text.includes("rates") ||
    text.includes("quote")
  ) {
    return "asking_pricing";
  }

  // 5. Follow Up Later
  if (
    text.includes("later") ||
    text.includes("next month") ||
    text.includes("next week") ||
    text.includes("busy now") ||
    text.includes("follow up in") ||
    text.includes("q3") ||
    text.includes("q4")
  ) {
    return "follow_up_later";
  }

  // 6. Interested
  if (
    text.includes("interested") ||
    text.includes("sounds good") ||
    text.includes("schedule") ||
    text.includes("book") ||
    text.includes("call") ||
    text.includes("meeting") ||
    text.includes("chat") ||
    text.includes("zoom") ||
    text.includes("let's talk")
  ) {
    return "interested";
  }

  // 7. Default
  return "more_info";
}
