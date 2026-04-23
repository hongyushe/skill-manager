import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { readSkill, appendExecutionLog } from "@/lib/storage";
import { assemblePrompt, executeSkill } from "@/lib/executor";
import { notifyViaLobster } from "@/lib/notify";
import { PiConfig } from "@/lib/pi-config";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

async function getApiConfig(): Promise<PiConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const settings = JSON.parse(raw);
    return {
      baseURL: settings.base_url || "https://api.openai.com/v1",
      apiKey: settings.api_key || "",
      model: settings.model || "gpt-4o",
      zaiApiKey: settings.zai_api_key || "",
    };
  } catch {
    return {
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4o",
      zaiApiKey: "",
    };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const trigger = req.nextUrl.searchParams.get("trigger") || "manual";
  const taskId = req.nextUrl.searchParams.get("task_id");
  const chainDepth = parseInt(req.nextUrl.searchParams.get("chain_depth") || "0");

  if (chainDepth > 5) {
    return NextResponse.json({ error: "Max chain depth exceeded" }, { status: 400 });
  }

  // Block non-manual triggers if automation is disabled for this skill
  if (trigger !== "manual") {
    try {
      const raw = await fs.readFile(CONFIG_PATH, "utf-8");
      const settings = JSON.parse(raw);
      const vis = (settings.skill_visibility || {})[name];
      if (vis && !vis.automation_enabled) {
        return NextResponse.json(
          { error: `Automation is disabled for skill "${name}"` },
          { status: 403 }
        );
      }
    } catch {}
  }

  try {
    const skill = await readSkill(name);

    // Build prompt from skill content + optional task instruction
    let prompt: string;
    let taskName: string | undefined;
    if (taskId) {
      const task = skill.custom.tasks.find((t) => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: `Task ${taskId} not found` }, { status: 404 });
      }
      prompt = `${skill.parsed.rawContent}\n\n---\n\n## Task: ${task.name}\n${task.instruction}`;
      taskName = task.name;
    } else {
      prompt = assemblePrompt(skill.parsed.rawContent, skill.custom);
    }

    const config = await getApiConfig();
    const startTime = Date.now();

    // Read tool configs from settings
    const settingsRaw = await fs.readFile(CONFIG_PATH, "utf-8").catch(() => "{}");
    const settingsObj = JSON.parse(settingsRaw);
    const customToolConfigs = settingsObj.custom_tools || [];
    const mcpServers = settingsObj.mcp_servers || [];

    // Pi agent loop — tools filtered by skill's allowed_tools (empty = all)
    const { output, usage, process: processSteps, reasoningTurns } = await executeSkill(
      prompt, config, name, skill.custom.tools, customToolConfigs, mcpServers
    );
    const durationMs = Date.now() - startTime;

    const log = {
      id: `exec-${Date.now()}`,
      triggered_by: trigger,
      timestamp: new Date().toISOString(),
      model: config.model,
      status: "success" as const,
      input_prompt: prompt,
      output,
      duration_ms: durationMs,
      token_usage: { prompt: usage.prompt_tokens, completion: usage.completion_tokens },
      ...(taskId && { task_id: taskId }),
      ...(taskName && { task_name: taskName }),
    };

    await appendExecutionLog(name, log);

    // Notify via Lobster CLI (fire and forget)
    notifyViaLobster(name, output).catch(() => {});

    // Check for chain
    const chainTrigger = skill.custom.triggers.find(
      (t) => t.type === "chain" && t.status === "active"
    );
    if (chainTrigger?.chainTarget) {
      const port = process.env.PORT || "3000";
      fetch(
        `http://localhost:${port}/api/execute/${chainTrigger.chainTarget}?trigger=chain&chain_depth=${chainDepth + 1}`,
        { method: "POST" }
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true, output, process: processSteps, reasoningTurns, duration_ms: durationMs, usage });
  } catch (e) {
    try {
      await appendExecutionLog(name, {
        id: `exec-${Date.now()}`,
        triggered_by: trigger,
        timestamp: new Date().toISOString(),
        model: process.env.OPENAI_MODEL || "gpt-4o",
        status: "failed",
        input_prompt: "",
        output: String(e),
        duration_ms: 0,
        token_usage: { prompt: 0, completion: 0 },
        ...(taskId && { task_id: taskId }),
      });
    } catch {}

    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
