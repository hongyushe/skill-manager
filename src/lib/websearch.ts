import { callMcpTool } from "./mcp-client";

const ZAI_MCP_URL = "https://api.z.ai/api/mcp/web_search_prime/mcp";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  siteName?: string;
}

export async function webSearch(
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  const result = await callMcpTool(ZAI_MCP_URL, apiKey, "web_search_prime", {
    search_query: query,
  });

  if (!result) return [];

  // Result is parsed JSON from callMcpTool
  if (Array.isArray(result)) {
    return result.map((item: Record<string, string>) => ({
      title: item.title || "",
      url: item.url || "",
      content: item.content || item.summary || item.text || "",
      siteName: item.siteName || item.site_name || "",
    }));
  }

  return [];
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return "No search results found.";

  return results
    .map(
      (r, i) =>
        `${i + 1}. ${r.title ? `**${r.title}**\n` : ""}` +
        `${r.content}\n` +
        `${r.url ? `Source: ${r.url}` : ""}` +
        `${r.siteName ? ` | Site: ${r.siteName}` : ""}`
    )
    .join("\n\n");
}
