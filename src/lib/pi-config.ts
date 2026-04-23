import { defineTool } from "@mariozechner/pi-coding-agent";
import { Type } from "@mariozechner/pi-ai";
import { webSearch } from "./websearch";
import { callMcpTool } from "./mcp-client";

export interface PiConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  zaiApiKey: string;
}

export interface CustomToolConfig {
  name: string;
  label: string;
  description: string;
  source: "builtin" | "mcp";
  mcp_server_id?: string;
  mcp_tool_name?: string;
  parameters: Record<string, { type: string; description?: string }>;
}

export interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  api_key: string;
}

/** Built-in tool registry — maps tool name to factory function */
const BUILTIN_TOOLS: Record<string, (config: PiConfig) => ReturnType<typeof defineTool>> = {
  web_search: (config) =>
    defineTool({
      name: "web_search",
      label: "Web Search",
      description:
        "Search the web for real-time information. Returns titles, URLs, and summaries.",
      parameters: Type.Object({
        query: Type.String({ description: "Search query string" }),
      }),
      execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
        try {
          const results = await webSearch(params.query, config.zaiApiKey);
          if (results.length === 0) {
            return { content: [{ type: "text" as const, text: "No results found." }], details: {} };
          }
          const formatted = results
            .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}`)
            .join("\n\n");
          return { content: [{ type: "text" as const, text: formatted }], details: {} };
        } catch (err) {
          return { content: [{ type: "text" as const, text: `Web search failed: ${String(err)}` }], details: {} };
        }
      },
    }),
};

/** Create a defineTool from an MCP tool config */
function createMcpToolDefinition(
  tool: CustomToolConfig,
  servers: McpServerConfig[]
): ReturnType<typeof defineTool> {
  const server = tool.mcp_server_id
    ? servers.find((s) => s.id === tool.mcp_server_id)
    : null;

  // Build JSON Schema parameters
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, val] of Object.entries(tool.parameters)) {
    properties[key] = { type: val.type, description: val.description };
    required.push(key);
  }

  return defineTool({
    name: tool.name,
    label: tool.label,
    description: tool.description,
    parameters: {
      type: "object",
      properties,
      required,
    } as any,
    execute: async (_toolCallId, params, _signal, _onUpdate, _ctx) => {
      try {
        if (!server) {
          return { content: [{ type: "text" as const, text: `MCP server not found for tool ${tool.name}` }], details: {} };
        }
        const result = await callMcpTool(
          server.url,
          server.api_key,
          tool.mcp_tool_name || tool.name,
          params as Record<string, unknown>
        );
        const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
        return { content: [{ type: "text" as const, text }], details: {} };
      } catch (err) {
        return { content: [{ type: "text" as const, text: `Tool ${tool.name} failed: ${String(err)}` }], details: {} };
      }
    },
  });
}

/** Resolve all registered tools (builtin + custom MCP) */
export function resolveAllTools(
  config: PiConfig,
  customTools: CustomToolConfig[],
  mcpServers: McpServerConfig[]
): ReturnType<typeof defineTool>[] {
  const tools: ReturnType<typeof defineTool>[] = [];

  // 1. Built-in tools
  for (const factory of Object.values(BUILTIN_TOOLS)) {
    tools.push(factory(config));
  }

  // 2. Custom MCP tools
  for (const tool of customTools) {
    if (tool.source === "mcp") {
      tools.push(createMcpToolDefinition(tool, mcpServers));
    }
  }

  return tools;
}

/** Resolve declared tool names into actual pi ToolDefinitions */
export function resolveTools(
  declared: string[],
  config: PiConfig
): ReturnType<typeof defineTool>[] {
  const tools: ReturnType<typeof defineTool>[] = [];
  for (const name of declared) {
    const factory = BUILTIN_TOOLS[name];
    if (factory) {
      tools.push(factory(config));
    }
  }
  return tools;
}
