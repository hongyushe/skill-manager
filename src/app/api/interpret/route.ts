import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const { type, text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const client = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
  });
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const systemPrompt =
    type === "trigger"
      ? `You are a scheduler assistant. The user describes WHEN a task should run in natural language.
Convert it into a structured trigger configuration.

Return ONLY valid JSON (no markdown fences) with these fields:
- "cron": a standard 5-field cron expression (if time-based), or null
- "type": one of "cron", "webhook", "manual", "chain"
- "endpoint": a suggested webhook endpoint path like "/api/hooks/some-name" (if webhook), or null
- "chain_target": the name of a downstream skill (if chain), or null
- "explanation": a brief human-readable explanation of the schedule/trigger

Examples:
User: "每天早上9点跑一次" -> {"cron":"0 9 * * *","type":"cron","endpoint":null,"chain_target":null,"explanation":"每天 9:00 执行"}
User: "有新PR时触发" -> {"cron":null,"type":"webhook","endpoint":"/api/hooks/pr-trigger","chain_target":null,"explanation":"通过 webhook 触发，当有新 PR 时"}
User: "跑完后接着跑 code-review skill" -> {"cron":null,"type":"chain","endpoint":null,"chain_target":"requesting-code-review","explanation":"执行完后自动触发 requesting-code-review skill"}`
      : `You are a prompt engineering assistant. The user describes additional execution instructions for a skill in natural language.
Convert it into a well-structured, clear prompt section.

Return ONLY valid JSON (no markdown fences) with these fields:
- "prompt": a well-structured prompt text that captures the user's intent clearly
- "explanation": a brief human-readable summary

Example:
User: "检查代码时重点关注安全问题" -> {"prompt":"在执行代码审查时，重点关注以下安全维度：\\n1. SQL 注入风险\\n2. XSS 漏洞\\n3. 敏感数据泄露\\n4. 认证和授权问题\\n5. 不安全的依赖","explanation":"添加安全审查维度的执行指令"}`;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
