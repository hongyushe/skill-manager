import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { listSkills, readSkill } from "@/lib/storage";
import { assemblePrompt, executeSkill } from "@/lib/executor";
import { appendExecutionLog } from "@/lib/storage";
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
  { params }: { params: Promise<{ hookId: string }> }
) {
  const { hookId } = await params;

  try {
    // Find which skill has this webhook endpoint
    const skills = await listSkills();
    let targetSkill: string | null = null;

    for (const name of skills) {
      try {
        const skill = await readSkill(name);
        const trigger = skill.custom.triggers.find(
          (t) => t.endpoint === `/api/hooks/${hookId}` && t.status === "active"
        );
        if (trigger) {
          targetSkill = name;
          break;
        }
      } catch {}
    }

    if (!targetSkill) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Check automation_enabled for this skill
    try {
      const raw = await fs.readFile(CONFIG_PATH, "utf-8");
      const settings = JSON.parse(raw);
      const vis = (settings.skill_visibility || {})[targetSkill];
      if (vis && !vis.automation_enabled) {
        return NextResponse.json(
          { error: `Automation is disabled for skill "${targetSkill}"` },
          { status: 403 }
        );
      }
    } catch {}

    // Execute the skill
    const skill = await readSkill(targetSkill);
    const prompt = assemblePrompt(skill.parsed.rawContent, skill.custom);
    const payload = await req.text();
    const fullPrompt = payload ? `${prompt}\n\nWebhook payload:\n${payload}` : prompt;

    const startTime = Date.now();
    const config = await getApiConfig();

    // Read tool configs from settings
    const settingsRaw = await fs.readFile(CONFIG_PATH, "utf-8").catch(() => "{}");
    const settingsObj = JSON.parse(settingsRaw);
    const customToolConfigs = settingsObj.custom_tools || [];
    const mcpServers = settingsObj.mcp_servers || [];

    const { output, usage, process: processSteps, reasoningTurns } = await executeSkill(
      fullPrompt, config, targetSkill, skill.custom.tools, customToolConfigs, mcpServers
    );
    const durationMs = Date.now() - startTime;

    await appendExecutionLog(targetSkill, {
      id: `exec-${Date.now()}`,
      triggered_by: `webhook:${hookId}`,
      timestamp: new Date().toISOString(),
      model: process.env.OPENAI_MODEL || "gpt-4o",
      status: "success",
      input_prompt: fullPrompt,
      output,
      duration_ms: durationMs,
      token_usage: { prompt: usage.prompt_tokens, completion: usage.completion_tokens },
    });

    return NextResponse.json({ ok: true, skill: targetSkill, output, process: processSteps, reasoningTurns });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
