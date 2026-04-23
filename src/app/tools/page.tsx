"use client";

import { useState, useEffect } from "react";

interface CustomToolConfig {
  name: string;
  label: string;
  description: string;
  source: "builtin" | "mcp" | "sdk";
  mcp_server_id?: string;
  mcp_tool_name?: string;
  parameters: Record<string, { type: string; description?: string }>;
}

interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  api_key: string;
  _has_key?: boolean;
}

interface McpDiscoveredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export default function ToolsPage() {
  const [tools, setTools] = useState<CustomToolConfig[]>([]);
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // MCP server form state
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerApiKey, setNewServerApiKey] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoveredTools, setDiscoveredTools] = useState<McpDiscoveredTool[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [toolsRes, settingsRes] = await Promise.all([
        fetch("/api/tools"),
        fetch("/api/settings"),
      ]);
      const toolsData = await toolsRes.json();
      const settingsData = await settingsRes.json();
      setTools(toolsData.tools || []);
      setMcpServers(settingsData.mcp_servers || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function discoverMcpTools() {
    if (!newServerUrl) return;
    setDiscovering(true);
    setError("");
    setDiscoveredTools([]);

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newServerUrl, api_key: newServerApiKey }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setDiscoveredTools(data.tools || []);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setDiscovering(false);
    }
  }

  async function addServerAndTools() {
    if (!newServerName || !newServerUrl) return;

    // Create server ID from name
    const serverId = newServerName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newServer: McpServerConfig = {
      id: serverId,
      name: newServerName,
      url: newServerUrl,
      api_key: newServerApiKey,
    };

    const newTools: CustomToolConfig[] = discoveredTools.map((t) => ({
      name: t.name,
      label: t.name,
      description: t.description || "",
      source: "mcp" as const,
      mcp_server_id: serverId,
      mcp_tool_name: t.name,
      parameters: extractParams(t.inputSchema),
    }));

    // Save via settings PUT
    const updatedServers = [...mcpServers, newServer];
    const updatedTools = [
      ...tools.filter((t) => !newTools.some((nt) => nt.name === t.name)),
      ...newTools,
    ];

    try {
      const settingsRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mcp_servers: updatedServers,
          custom_tools: updatedTools,
        }),
      });
      if (!settingsRes.ok) throw new Error("Failed to save settings");

      setMcpServers(updatedServers);
      setTools(updatedTools);
      setShowAddServer(false);
      setNewServerName("");
      setNewServerUrl("");
      setNewServerApiKey("");
      setDiscoveredTools([]);
    } catch (e) {
      setError(String(e));
    }
  }

  async function deleteTool(name: string) {
    if (!confirm(`Delete tool "${name}"?`)) return;
    try {
      await fetch(`/api/tools?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setTools(tools.filter((t) => t.name !== name));
    } catch (e) {
      setError(String(e));
    }
  }

  async function deleteServer(serverId: string) {
    const server = mcpServers.find((s) => s.id === serverId);
    if (!server || !confirm(`Delete MCP server "${server.name}" and all its tools?`)) return;

    // Remove server and its tools
    const updatedServers = mcpServers.filter((s) => s.id !== serverId);
    const updatedTools = tools.filter((t) => t.mcp_server_id !== serverId);

    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mcp_servers: updatedServers,
          custom_tools: updatedTools,
        }),
      });
      setMcpServers(updatedServers);
      setTools(updatedTools);
    } catch (e) {
      setError(String(e));
    }
  }

  function extractParams(
    schema: Record<string, unknown>
  ): Record<string, { type: string; description?: string }> {
    const params: Record<string, { type: string; description?: string }> = {};
    const properties = (schema?.properties || {}) as Record<
      string,
      { type?: string; description?: string }
    >;
    for (const [key, val] of Object.entries(properties)) {
      params[key] = { type: val.type || "string", description: val.description };
    }
    return params;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Registered Tools */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Registered Tools ({tools.length})
          </h2>
          {tools.length === 0 ? (
            <p className="text-gray-500 text-sm">No tools registered yet.</p>
          ) : (
            <div className="space-y-3">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {tool.label}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            tool.source === "sdk"
                              ? "bg-gray-100 text-gray-600"
                              : tool.source === "builtin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {tool.source === "sdk" ? "SDK" : tool.source === "builtin" ? "Built-in" : "MCP"}
                        </span>
                        {tool.mcp_server_id && (
                          <span className="text-xs text-gray-400">
                            via {mcpServers.find((s) => s.id === tool.mcp_server_id)?.name || tool.mcp_server_id}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {tool.description}
                      </p>
                      {Object.keys(tool.parameters).length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {Object.entries(tool.parameters).map(([key, val]) => (
                            <span
                              key={key}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {key}: {val.type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {tool.source === "mcp" && (
                      <button
                        onClick={() => deleteTool(tool.name)}
                        className="text-red-400 hover:text-red-600 text-sm ml-4"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MCP Servers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              MCP Servers ({mcpServers.length})
            </h2>
            <button
              onClick={() => setShowAddServer(!showAddServer)}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
            >
              + Add Server
            </button>
          </div>

          {/* Existing servers */}
          {mcpServers.length > 0 && (
            <div className="space-y-3 mb-4">
              {mcpServers.map((server) => (
                <div
                  key={server.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium text-gray-900">
                        {server.name}
                      </span>
                      <p className="text-sm text-gray-500 mt-0.5 font-mono break-all">
                        {server.url}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {tools.filter((t) => t.mcp_server_id === server.id).length}{" "}
                        tool(s) registered
                      </p>
                    </div>
                    <button
                      onClick={() => deleteServer(server.id)}
                      className="text-red-400 hover:text-red-600 text-sm ml-4"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add server form */}
          {showAddServer && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Add MCP Server</h3>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="e.g. Z.AI Web Search"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  MCP Server URL
                </label>
                <input
                  type="text"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  API Key (optional)
                </label>
                <input
                  type="password"
                  value={newServerApiKey}
                  onChange={(e) => setNewServerApiKey(e.target.value)}
                  placeholder="Bearer token"
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                />
              </div>
              <button
                onClick={discoverMcpTools}
                disabled={discovering || !newServerUrl}
                className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {discovering ? "Connecting..." : "Discover Tools"}
              </button>

              {/* Discovered tools */}
              {discoveredTools.length > 0 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Discovered {discoveredTools.length} tool(s):
                  </h4>
                  <div className="space-y-2">
                    {discoveredTools.map((t) => (
                      <div key={t.name} className="text-sm bg-gray-50 rounded p-2">
                        <span className="font-medium text-gray-900">
                          {t.name}
                        </span>
                        {t.description && (
                          <p className="text-gray-600">{t.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addServerAndTools}
                    className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    Register All {discoveredTools.length} Tools
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
