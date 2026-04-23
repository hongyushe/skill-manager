import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

export interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  api_key: string;
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

interface Settings {
  base_url: string;
  api_key: string;
  model: string;
  skills_dir: string;
  zai_api_key: string;
  lobster_enabled: boolean;
  lobster_path: string;
  lobster_pipeline: string;
  mcp_servers: McpServerConfig[];
  custom_tools: CustomToolConfig[];
  skill_visibility: Record<string, { visible: boolean; automation_enabled: boolean }>;
}

async function readSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      base_url: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      api_key: "",
      model: process.env.OPENAI_MODEL || "gpt-4o",
      skills_dir: process.env.SKILLS_DIR || "",
      zai_api_key: "",
      lobster_enabled: false,
      lobster_path: "lobster",
      lobster_pipeline: "",
      mcp_servers: [],
      custom_tools: [],
      skill_visibility: {},
    };
  }
}

export async function GET() {
  const settings = await readSettings();
  // Mask API keys
  const maskKey = (key: string) =>
    key ? key.slice(0, 4) + "..." + key.slice(-4) : "";

  // Mask MCP server API keys
  const servers = settings.mcp_servers || [];
  const maskedServers = servers.map(s => ({
    ...s,
    api_key: maskKey(s.api_key),
    _has_key: !!s.api_key,
  }));

  return NextResponse.json({
    ...settings,
    api_key: maskKey(settings.api_key),
    _has_key: !!settings.api_key,
    zai_api_key: maskKey(settings.zai_api_key),
    _has_zai_key: !!settings.zai_api_key,
    mcp_servers: maskedServers,
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const current = await readSettings();

  const updated: Settings = {
    base_url: body.base_url || current.base_url,
    api_key: body.api_key && !body.api_key.includes("...")
      ? body.api_key
      : current.api_key,
    model: body.model || current.model,
    skills_dir: body.skills_dir || current.skills_dir,
    zai_api_key: body.zai_api_key && !body.zai_api_key.includes("...")
      ? body.zai_api_key
      : current.zai_api_key,
    lobster_enabled: body.lobster_enabled ?? current.lobster_enabled,
    lobster_path: body.lobster_path || current.lobster_path,
    lobster_pipeline: body.lobster_pipeline || current.lobster_pipeline,
    mcp_servers: body.mcp_servers ?? current.mcp_servers,
    custom_tools: body.custom_tools ?? current.custom_tools,
    skill_visibility: body.skill_visibility ?? current.skill_visibility,
  };

  // Preserve MCP server API keys if masked values sent back
  for (let i = 0; i < updated.mcp_servers.length; i++) {
    if (updated.mcp_servers[i].api_key.includes("...")) {
      const existing = current.mcp_servers.find(s => s.id === updated.mcp_servers[i].id);
      if (existing) updated.mcp_servers[i].api_key = existing.api_key;
    }
  }

  await fs.writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
