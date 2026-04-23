import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { listSkills } from "@/lib/storage";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

interface VisibilityEntry {
  visible: boolean;
  automation_enabled: boolean;
}

async function readVisibility(): Promise<Record<string, VisibilityEntry>> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const settings = JSON.parse(raw);
    return settings.skill_visibility || {};
  } catch {
    return {};
  }
}

async function writeVisibility(data: Record<string, VisibilityEntry>): Promise<void> {
  let settings: Record<string, unknown> = {};
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    settings = JSON.parse(raw);
  } catch {}
  settings.skill_visibility = data;
  await fs.writeFile(CONFIG_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

export async function GET() {
  const skills = await listSkills();
  const visibility = await readVisibility();

  const result: Record<string, VisibilityEntry> = {};
  for (const name of skills) {
    result[name] = visibility[name] || { visible: true, automation_enabled: true };
  }

  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const { skillName, visible, automation_enabled } = await req.json();
  if (!skillName) {
    return NextResponse.json({ error: "skillName required" }, { status: 400 });
  }

  const visibility = await readVisibility();
  const current = visibility[skillName] || { visible: true, automation_enabled: true };

  if (typeof visible === "boolean") current.visible = visible;
  if (typeof automation_enabled === "boolean") current.automation_enabled = automation_enabled;

  visibility[skillName] = current;
  await writeVisibility(visibility);

  return NextResponse.json({ ok: true });
}
