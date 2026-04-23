import { CustomData } from "./types";
import { PiConfig, resolveAllTools } from "./pi-config";
import type { CustomToolConfig, McpServerConfig } from "./pi-config";
import {
  AuthStorage,
  ModelRegistry,
  SessionManager,
  createAgentSession,
  type ToolDefinition,
} from "@mariozechner/pi-coding-agent";

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

export interface ProcessStep {
  toolName: string;
  display: string;
}

export interface ExecutionResult {
  output: string;
  usage: { prompt_tokens: number; completion_tokens: number };
  process: ProcessStep[];
  reasoningTurns: number;
}

export async function executeSkill(
  prompt: string,
  config: PiConfig,
  skillName?: string,
  declaredTools: string[] = [],
  customToolConfigs: CustomToolConfig[] = [],
  mcpServers: McpServerConfig[] = []
): Promise<ExecutionResult> {
  // Set up in-memory auth with the LLM API key for the "skill-manager" provider
  const authStorage = AuthStorage.inMemory({
    "skill-manager": { type: "api_key", key: config.apiKey },
  });

  // Create model registry and register our custom provider
  const modelRegistry = ModelRegistry.inMemory(authStorage);
  modelRegistry.registerProvider("skill-manager", {
    baseUrl: config.baseURL,
    apiKey: config.apiKey,
    api: "openai-completions",
    models: [
      {
        id: config.model,
        name: config.model,
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 4096,
        compat: {
          thinkingFormat: "zai",
          supportsDeveloperRole: false,
        },
      },
    ],
  });

  const model = modelRegistry.find("skill-manager", config.model);
  if (!model) {
    throw new Error(`Model ${config.model} not found in registry`);
  }

  // Build all tools — builtin + custom MCP (all available to all skills)
  const customTools: ToolDefinition[] = resolveAllTools(config, customToolConfigs, mcpServers);

  const { session } = await createAgentSession({
    model,
    authStorage,
    modelRegistry,
    sessionManager: SessionManager.inMemory(),
    customTools,
  });

  // Override the default coding-agent system prompt with skill executor instructions
  session.state.systemPrompt =
    "You are an AI assistant executing a skill. Follow the skill instructions precisely. " +
    "Output ONLY the final result as specified by the skill instructions. " +
    "Do NOT include any reasoning, process explanation, or intermediate steps in your output. " +
    "Respond in the same language as the skill instructions. " +
    "You may use bash to run commands (including python3) if needed to complete the task.";

  // Collect final assistant output + process tracking
  let finalOutput = "";
  const processSteps: ProcessStep[] = [];
  let reasoningTurns = 0;

  session.subscribe((event) => {
    if (event.type === "message_end" && "message" in event) {
      const msg = event.message as { role?: string; content?: unknown };
      if (msg.role === "assistant" && msg.content) {
        const content = msg.content as Array<{
          type: string;
          text?: string;
        }>;
        for (const block of content) {
          if (block.type === "text" && block.text) {
            finalOutput = block.text;
          }
        }
      }
    }

    if (event.type === "tool_execution_start") {
      const args = (event as { args?: Record<string, unknown> }).args || {};
      const firstStringValue = Object.values(args).find(
        (v) => typeof v === "string"
      );
      const display = firstStringValue
        ? truncate(String(firstStringValue), 60)
        : JSON.stringify(args);
      processSteps.push({
        toolName: (event as { toolName?: string }).toolName || "unknown",
        display,
      });
    }

    if (event.type === "turn_end") {
      reasoningTurns++;
    }
  });

  // Run the agent loop
  await session.prompt(prompt);

  // Estimate token usage from messages
  const messages = session.state.messages;
  let totalPrompt = 0;
  let totalCompletion = 0;
  for (const msg of messages) {
    const text =
      typeof (msg as { content?: unknown }).content === "string"
        ? ((msg as { content?: unknown }).content as string)
        : Array.isArray((msg as { content?: unknown }).content)
          ? ((msg as { content?: unknown }).content as Array<{ text?: string }>)
              .map((b) => b.text || "")
              .join("")
          : "";
    const tokens = Math.ceil(text.length / 4);
    if ((msg as { role?: string }).role === "assistant") {
      totalCompletion += tokens;
    } else {
      totalPrompt += tokens;
    }
  }

  return {
    output: finalOutput,
    usage: { prompt_tokens: totalPrompt, completion_tokens: totalCompletion },
    process: processSteps,
    reasoningTurns,
  };
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}
