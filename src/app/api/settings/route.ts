import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

interface Settings {
  base_url: string;
  api_key: string;
  model: string;
  skills_dir: string;
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
    };
  }
}

export async function GET() {
  const settings = await readSettings();
  // Mask API key
  return NextResponse.json({
    ...settings,
    api_key: settings.api_key
      ? settings.api_key.slice(0, 4) + "..." + settings.api_key.slice(-4)
      : "",
    _has_key: !!settings.api_key,
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
  };

  await fs.writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return NextResponse.json({ ok: true });
}
