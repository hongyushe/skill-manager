import { NextRequest, NextResponse } from "next/server";
import { listSkills, readSkill } from "@/lib/storage";
import { assemblePrompt, executeSkill } from "@/lib/executor";
import { appendExecutionLog } from "@/lib/storage";

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

    // Execute the skill
    const skill = await readSkill(targetSkill);
    const prompt = assemblePrompt(skill.parsed.rawContent, skill.custom);
    const payload = await req.text();
    const fullPrompt = payload ? `${prompt}\n\nWebhook payload:\n${payload}` : prompt;

    const startTime = Date.now();
    const { output, usage } = await executeSkill(fullPrompt);
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

    return NextResponse.json({ ok: true, skill: targetSkill, output });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
