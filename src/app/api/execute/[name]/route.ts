import { NextRequest, NextResponse } from "next/server";
import { readSkill, appendExecutionLog } from "@/lib/storage";
import { assemblePrompt, executeSkill } from "@/lib/executor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const trigger = req.nextUrl.searchParams.get("trigger") || "manual";
  const chainDepth = parseInt(req.nextUrl.searchParams.get("chain_depth") || "0");

  if (chainDepth > 5) {
    return NextResponse.json({ error: "Max chain depth exceeded" }, { status: 400 });
  }

  try {
    const skill = await readSkill(name);
    const prompt = assemblePrompt(skill.parsed.rawContent, skill.custom);
    const startTime = Date.now();

    const { output, usage } = await executeSkill(prompt);
    const durationMs = Date.now() - startTime;

    const log = {
      id: `exec-${Date.now()}`,
      triggered_by: trigger,
      timestamp: new Date().toISOString(),
      model: process.env.OPENAI_MODEL || "gpt-4o",
      status: "success" as const,
      input_prompt: prompt,
      output,
      duration_ms: durationMs,
      token_usage: { prompt: usage.prompt_tokens, completion: usage.completion_tokens },
    };

    await appendExecutionLog(name, log);

    // Check for chain
    const chainTrigger = skill.custom.triggers.find(
      (t) => t.type === "chain" && t.status === "active"
    );
    if (chainTrigger?.chainTarget) {
      // Fire and forget chain execution
      const port = process.env.PORT || "3000";
      fetch(
        `http://localhost:${port}/api/execute/${chainTrigger.chainTarget}?trigger=chain&chain_depth=${chainDepth + 1}`,
        { method: "POST" }
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true, output, duration_ms: durationMs, usage });
  } catch (e) {
    // Log failure
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
      });
    } catch {}

    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
