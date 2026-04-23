import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export interface McpConnection {
  client: Client;
  transport: StreamableHTTPClientTransport;
}

/**
 * Connect to any MCP server via Streamable HTTP transport.
 * Handles initialization automatically.
 */
export async function connectMcp(
  url: string,
  apiKey: string,
  clientName = "skill-manager",
  clientVersion = "1.0.0"
): Promise<McpConnection> {
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  });

  const client = new Client(
    { name: clientName, version: clientVersion },
    { capabilities: {} }
  );

  await client.connect(transport);
  return { client, transport };
}

/**
 * Call a tool on an MCP server. Connects fresh each call to avoid stale sessions.
 */
export async function callMcpTool(
  url: string,
  apiKey: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const { client, transport } = await connectMcp(url, apiKey);

  try {
    const result = await client.callTool({ name: toolName, arguments: args });

    // Extract text content from result
    if (result.content && Array.isArray(result.content)) {
      const textItems = result.content
        .filter((c: { type: string }) => c.type === "text")
        .map((c: { text?: string }) => c.text || "");

      if (textItems.length === 0) return null;

      // Try parsing as JSON
      const combined = textItems.join("");
      try {
        return JSON.parse(combined);
      } catch {
        return combined;
      }
    }

    return result;
  } finally {
    await transport.terminateSession().catch(() => {});
  }
}
