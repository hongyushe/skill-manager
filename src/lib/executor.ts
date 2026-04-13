import OpenAI from "openai";
import { CustomData } from "./types";

export function assemblePrompt(
  skillContent: string,
  custom: CustomData
): string {
  const parts: string[] = [skillContent];

  if (custom.execDetails.length > 0) {
    parts.push("\n\n---\n\n## Additional Execution Instructions");
    for (const e of custom.execDetails) {
      parts.push(`\n### ${e.id}: ${e.intent}\n${e.prompt}`);
    }
  }

  return parts.join("\n");
}

export async function executeSkill(
  prompt: string,
  config?: { baseURL?: string; apiKey?: string; model?: string }
): Promise<{
  output: string;
  usage: { prompt_tokens: number; completion_tokens: number };
}> {
  const client = new OpenAI({
    baseURL: config?.baseURL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
  });
  const model = config?.model || process.env.OPENAI_MODEL || "gpt-4o";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant executing a skill. Follow the skill instructions precisely and provide a thorough response.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  return {
    output: completion.choices[0]?.message?.content || "",
    usage: {
      prompt_tokens: completion.usage?.prompt_tokens || 0,
      completion_tokens: completion.usage?.completion_tokens || 0,
    },
  };
}
