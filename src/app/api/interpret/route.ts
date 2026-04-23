import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // Read settings from config file
  let baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  let apiKey = process.env.OPENAI_API_KEY;
  let model = process.env.OPENAI_MODEL || "gpt-4o";

  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const settings = JSON.parse(raw);
    if (settings.base_url) baseURL = settings.base_url;
    if (settings.api_key) apiKey = settings.api_key;
    if (settings.model) model = settings.model;
  } catch {
    // use env vars
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "请先在 Settings 页面配置 LLM API Key" },
      { status: 400 }
    );
  }

  const client = new OpenAI({ baseURL, apiKey });

  const systemPrompt = `You are a task scheduler assistant. The user describes a task they want to set up in natural language.

Parse their description into a structured task configuration. Return ONLY valid JSON (no markdown fences) with these fields:

- "name": a short, memorable task name (2-6 chars, Chinese is fine, e.g. "Trump速报", "AI日报")
- "triggerType": one of "cron", "webhook", "manual"
- "triggerConfig": a standard 5-field cron expression (if cron), or a webhook path (if webhook), or empty string (if manual)
- "instruction": a clear, detailed instruction for what the task should do when executed. This will be sent to an AI model as a prompt. Write it in the same language as the user's input. Be specific about what to search for, how to summarize, and what format to output.
- "explanation": a brief human-readable summary of what this task does and when it runs

Rules for cron expressions:
- Use standard 5-field format: minute hour day-of-month month day-of-week
- "每天早上9:30" → "30 9 * * *"
- "每小时" → "0 * * * *"
- "工作日下午5点" → "0 17 * * 1-5"
- If the user doesn't mention timing, use "manual"

Examples:
User: "每天早上9:30帮我搜trump的最新发言，有新的就通知我"
→ {"name":"Trump速报","triggerType":"cron","triggerConfig":"30 9 * * *","instruction":"搜索特朗普最新公开言论（包括Truth Social、新闻、演讲、行政命令），对比上次检查结果去重。如果发现新的声明，用简洁的中文汇总每条新内容的关键信息、来源和重要引述。如果无新内容，回复'无新内容'。","explanation":"每天 9:30 搜索 Trump 最新发言，有新内容就通知"}

User: "每天下午5点半帮我搜AI领域最新动态"
→ {"name":"AI日报","triggerType":"cron","triggerConfig":"30 17 * * *","instruction":"搜索AI领域最新动态，包括新模型发布、技术突破、重大融资、政策变化等。对比上次检查去重，用简洁中文汇总每条重要新闻的要点、来源和影响。","explanation":"每天 17:30 搜索 AI 领域最新动态"}

User: "手动检查一下最近的融资新闻"
→ {"name":"融资速递","triggerType":"manual","triggerConfig":"","instruction":"搜索最近一周的融资新闻，重点关注科技和AI领域。汇总每笔融资的公司名、金额、轮次、投资方和业务方向。","explanation":"手动触发的融资新闻检索"}`;

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
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
