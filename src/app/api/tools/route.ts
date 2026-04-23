import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

interface CustomToolConfig {
  name: string;
  label: string;
  description: string;
  source: "builtin" | "mcp" | "sdk";
  mcp_server_id?: string;
  mcp_tool_name?: string;
  parameters: Record<string, { type: string; description?: string }>;
}

interface Settings {
  custom_tools: CustomToolConfig[];
  [key: string]: unknown;
}

async function readSettings(): Promise<Settings> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { custom_tools: [] } as Settings;
  }
}

async function writeSettings(settings: Settings): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

/** GET /api/tools — list all registered tools (sdk builtin + custom builtin + custom MCP) */
export async function GET() {
  const settings = await readSettings();

  // SDK built-in tools from pi-coding-agent
  const sdkTools: CustomToolConfig[] = [
    {
      name: "read",
      label: "Read",
      description: "Read file contents from the local filesystem.",
      source: "sdk" as const,
      parameters: {
        path: { type: "string", description: "File path to read" },
        offset: { type: "number", description: "Line offset to start from" },
        limit: { type: "number", description: "Number of lines to read" },
      },
    },
    {
      name: "bash",
      label: "Bash",
      description: "Execute shell commands in a bash shell.",
      source: "sdk" as const,
      parameters: {
        command: { type: "string", description: "Shell command to execute" },
        timeout: { type: "number", description: "Timeout in milliseconds" },
      },
    },
    {
      name: "edit",
      label: "Edit",
      description: "Edit file contents by replacing specific strings.",
      source: "sdk" as const,
      parameters: {
        path: { type: "string", description: "File path to edit" },
        edits: { type: "array", description: "Array of {oldText, newText} replacements" },
      },
    },
    {
      name: "write",
      label: "Write",
      description: "Write content to a file on the local filesystem.",
      source: "sdk" as const,
      parameters: {
        path: { type: "string", description: "File path to write" },
        content: { type: "string", description: "Content to write" },
      },
    },
    {
      name: "grep",
      label: "Grep",
      description: "Search file contents using regex patterns.",
      source: "sdk" as const,
      parameters: {
        pattern: { type: "string", description: "Regex pattern to search for" },
        path: { type: "string", description: "Directory or file to search in" },
        glob: { type: "string", description: "Glob pattern to filter files" },
      },
    },
    {
      name: "find",
      label: "Find",
      description: "Find files by name pattern.",
      source: "sdk" as const,
      parameters: {
        pattern: { type: "string", description: "File name pattern" },
        path: { type: "string", description: "Directory to search in" },
      },
    },
    {
      name: "ls",
      label: "Ls",
      description: "List directory contents.",
      source: "sdk" as const,
      parameters: {
        path: { type: "string", description: "Directory path to list" },
      },
    },
  ];

  // Custom built-in tools (our web_search, etc.)
  const customBuiltinTools: CustomToolConfig[] = [
    {
      name: "web_search",
      label: "Web Search",
      description: "Search the web for real-time information. Returns titles, URLs, and summaries.",
      source: "builtin",
      parameters: {
        query: { type: "string", description: "Search query string" },
      },
    },
  ];

  const mcpTools: CustomToolConfig[] = settings.custom_tools || [];
  return NextResponse.json({ tools: [...sdkTools, ...customBuiltinTools, ...mcpTools] });
}

/** POST /api/tools — register a new tool */
export async function POST(req: NextRequest) {
  const tool: CustomToolConfig = await req.json();

  if (!tool.name || !tool.label) {
    return NextResponse.json({ error: "name and label are required" }, { status: 400 });
  }

  const settings = await readSettings();
  if (!settings.custom_tools) settings.custom_tools = [];

  // Check for duplicate
  const existing = settings.custom_tools.findIndex((t) => t.name === tool.name);
  if (existing >= 0) {
    settings.custom_tools[existing] = tool;
  } else {
    settings.custom_tools.push(tool);
  }

  await writeSettings(settings);
  return NextResponse.json({ ok: true, tool });
}

/** DELETE /api/tools?name=xxx — remove a tool */
export async function DELETE(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "name parameter is required" }, { status: 400 });
  }

  const settings = await readSettings();
  settings.custom_tools = (settings.custom_tools || []).filter((t) => t.name !== name);
  await writeSettings(settings);
  return NextResponse.json({ ok: true });
}
