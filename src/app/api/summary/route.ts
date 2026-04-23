import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { writeSummary, markSummarySynced, getSkillsNeedingSync } from "@/lib/storage";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

async function getSettings() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function generateSummary(skillName: string, settings: Record<string, string>): Promise<string> {
  const skillsDir = process.env.SKILLS_DIR || path.join(process.env.HOME || "/", ".claude", "skills");
  const skillMdPath = path.join(skillsDir, skillName, "SKILL.md");
  const skillContent = await fs.readFile(skillMdPath, "utf-8");

  const client = new OpenAI({
    baseURL: settings.base_url || "https://api.openai.com/v1",
    apiKey: settings.api_key,
  });
  const model = settings.model || "gpt-4o";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "Read the following skill document. Write a 200-500 character summary in the same language as the document. Cover: what the skill does, how it works at a high level, and what it's useful for. Do not include implementation details, code examples, or technical jargon. Write in plain language.",
      },
      { role: "user", content: skillContent },
    ],
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || "";
}

/** POST: generate summary for a single skill */
export async function POST(req: NextRequest) {
  const { skillName } = await req.json();
  if (!skillName) {
    return NextResponse.json({ error: "skillName required" }, { status: 400 });
  }

  const settings = await getSettings();
  if (!settings?.api_key) {
    return NextResponse.json(
      { error: "请先在 Settings 页面配置 LLM API Key" },
      { status: 400 }
    );
  }

  try {
    const summary = await generateSummary(skillName, settings);
    if (!summary) {
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }
    await writeSummary(skillName, summary);
    await markSummarySynced(skillName);
    return NextResponse.json({ summary });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

/** GET: sync all skills — regenerate summaries for new/changed skills */
export async function GET() {
  const settings = await getSettings();
  if (!settings?.api_key) {
    return NextResponse.json({ error: "No API key configured" }, { status: 400 });
  }

  const toUpdate = await getSkillsNeedingSync();
  const results: { skill: string; status: string }[] = [];

  for (const name of toUpdate) {
    try {
      const summary = await generateSummary(name, settings);
      if (summary) {
        await writeSummary(name, summary);
        await markSummarySynced(name);
        results.push({ skill: name, status: "updated" });
      }
    } catch (e) {
      results.push({ skill: name, status: `failed: ${String(e)}` });
    }
  }

  return NextResponse.json({ synced: results, checked: toUpdate.length });
}
