# Skill-Manager 白皮书 / Whitepaper

---

## Skill-Manager：本地部署的 AI 值班员

Skill-Manager 是一个本地部署的 AI 自动化平台。你排好班（cron / webhook），配好工具箱（bash / python / web search / MCP），定好交班方式（推送通知）。然后你下班，它 7x24 值守。

对话式 AI 有三个致命缺陷：要人盯着（不发消息它就不动）、上下文污染（两次任务的上下文会串）、不能定时（没有 cron、没有 webhook）。Skill-Manager 从架构层面解决这三个问题——每个任务独立上下文窗口，互不干扰；四种触发模式（Cron / Webhook / Manual / Chain，最深 5 层链式串联）；自然语言一句话建任务，LLM 自动解析为结构化配置。

Agent 内置 bash（含 python3）、文件读写、网页搜索，通过 MCP 协议可动态注册任意外部工具。执行结果通过 Lobster CLI 推送到微信、钉钉、Slack 等任意渠道。支持任何 OpenAI 兼容 API 和 Ollama 本地模型，数据全部存在本地文件系统，零数据外泄风险。

**设计哲学：** 大量工作不需要深度思考，只需要专注执行。Kahneman 在《思考，快与慢》中将人类认知分为 System 1（自动、快速、低耗能）和 System 2（深思熟虑、慢、高耗能）。日常工作中绝大多数任务是 System 1 —— 搜新闻、整理数据、推送报告 —— 它们不需要推理，需要的是准时和专注。Adam Smith 在《国富论》里用大头针工厂证明：10 个工人各司其职日产 48,000 根针，1 个人什么都做一天做不出 1 根。专业化的 Skill 远胜于万能的 Agent。Herbert Simon 的「满意即可」原则告诉我们：对这些任务追求最优解是浪费，"够好"就够了。所以 Skill-Manager 的设计是：Skill 直接执行确定性的任务，只在真正需要深度思考时才动用 Agent 推理能力。

**技术栈：** Next.js 16 + React 19 + Tailwind CSS 4 + @mariozechner/pi-coding-agent + @modelcontextprotocol/sdk

---

## Skill-Manager: Your AI Shift Worker, Self-Hosted

Skill-Manager is a self-hosted AI automation platform. You set shifts (cron/webhook), equip the toolbox (bash/python/web search/MCP), and configure notifications. Then you clock out — it stays on 24/7.

Conversational AI has three fatal flaws: it needs you watching (no message = no action), context pollution (different tasks bleed into each other), and no scheduling (no cron, no webhook). Skill-Manager solves all three at the architecture level — each task runs in an isolated context window; four trigger modes (Cron/Webhook/Manual/Chain, up to 5 levels deep); and natural language task creation where the LLM auto-parses your sentence into structured config.

The built-in agent has bash (with python3), file I/O, and web search, plus dynamic external tool registration via MCP. Results push to WeChat, DingTalk, Slack, or any channel via Lobster CLI. Supports any OpenAI-compatible API and Ollama local models. All data stored locally on your filesystem — zero data exposure.

**Design Philosophy:** Most work doesn't require deep thinking — it requires focused execution. In *Thinking, Fast and Slow*, Kahneman distinguishes System 1 (automatic, fast, low-effort) from System 2 (deliberate, slow, high-effort). The vast majority of daily tasks — search news, organize data, push reports — are System 1. They don't need reasoning; they need punctuality and focus. In *The Wealth of Nations*, Adam Smith's pin factory demonstrated that 10 specialized workers produced 48,000 pins per day, while one generalist could barely make one. Specialized Skills beat a general-purpose Agent. Herbert Simon's satisficing principle tells us that seeking optimal solutions for these tasks is wasteful — "good enough" is enough. So Skill-Manager's design: Skills execute deterministic tasks directly; Agent reasoning is engaged only when genuine deep thinking is required.

**Tech Stack:** Next.js 16 + React 19 + Tailwind CSS 4 + @mariozechner/pi-coding-agent + @modelcontextprotocol/sdk

---

## vs. OpenClaw

OpenClaw 是一个跨平台个人 AI 助手——在 WhatsApp、Telegram、Slack、Discord、微信等 20+ 即时通讯工具上提供统一的 AI 对话入口。它的核心是「对话」：你在聊天窗口里说话，AI 回复。它有语音唤醒、实时画布、ClawHub 技能市场，以及 macOS / iOS / Android 客户端。

Skill-Manager 的定位完全不同。我们不需要对话窗口，不需要你开口——它自己按时醒来干活。每个任务独立运行，不会因为上一次对话污染下一次的推理。OpenClaw 解决的是「怎么让 AI 在更多地方陪你聊天」，Skill-Manager 解决的是「怎么让 AI 在你不在的时候替你值班」。一个是随身助理，一个是自动值班员。如果你需要的是「到点自动搜索竞品动态并推送报告」，用 OpenClaw 你得手动问，用 Skill-Manager 它自己执行。

**核心差异：** OpenClaw = 多平台聊天助手。Skill-Manager = 无人值守自动化。前者要你开口，后者自己醒来。

---

OpenClaw is a cross-platform personal AI assistant — a unified chat interface across 20+ messaging platforms (WhatsApp, Telegram, Slack, Discord, WeChat, etc.). Its core is conversation: you type, AI replies. It offers voice wake, live canvas, ClawHub skills marketplace, and companion apps for macOS/iOS/Android.

Skill-Manager has a fundamentally different focus. There is no chat window. No need for you to speak — it wakes up on schedule and gets to work. Each task runs in isolation; your last conversation never pollutes the next one. OpenClaw solves "how to chat with AI across more platforms." Skill-Manager solves "how to make AI work while you're away." One is a pocket assistant; the other is an autonomous shift worker. If you need "search competitor updates at 9 AM and push the report," OpenClaw requires you to ask. Skill-Manager just does it.

**Core difference:** OpenClaw = multi-platform chat assistant. Skill-Manager = unattended automation. One waits for you to speak. The other wakes up on its own.

---

## vs. Hermes Agent

Hermes Agent（NousResearch）是一个自我进化的 AI Agent。它的核心能力是「从经验中学习」——自动创建和改进技能，通过 Honcho 方言式用户建模理解你的偏好，支持 FTS5 会话检索和子 Agent 并行化，兼容 200+ 模型，可以在 5 美元 VPS 上运行。它是一个研究导向的项目，目标是让 Agent 越用越懂你。

Hermes 解决的是「怎么让 AI 更聪明」，Skill-Manager 解决的是「怎么让 AI 更准时」。Hermes 的学习循环需要持续对话来积累经验，本质上还是一个聊天驱动的系统。Skill-Manager 不追求 AI 的自我进化——我们追求的是可靠、可预测、按时执行。你不需要一个越来越懂你的 AI，你需要一个每次都按配置准时交付的 AI。

**核心差异：** Hermes = 自我进化的研究型 Agent。Skill-Manager = 确定性的任务执行引擎。前者越用越聪明，后者到点就干活。

---

Hermes Agent (NousResearch) is a self-improving AI agent. Its core capability is "learning from experience" — automatically creating and refining skills, building user models through Honcho's dialectic approach, with FTS5 session search, subagent parallelization, and support for 200+ models. It runs on a $5 VPS or a GPU cluster. It is a research-oriented project with the goal of making the agent understand you better over time.

Hermes solves "how to make AI smarter." Skill-Manager solves "how to make AI show up on time." Hermes's learning loop requires ongoing conversation to accumulate experience — it is fundamentally chat-driven. Skill-Manager does not pursue AI self-evolution — we pursue reliable, predictable, on-schedule execution. You don't need an AI that understands you better each day. You need one that delivers exactly what you configured, exactly when you scheduled it.

**Core difference:** Hermes = self-improving research agent. Skill-Manager = deterministic task execution engine. One gets smarter over time. The other shows up on time, every time.

---

```bash
git clone https://github.com/your-username/skill-manager.git
cd skill-manager && npm install
cp skill-manager.example.json skill-manager.json
npm run dev
```

打开 `http://localhost:10001`，给 AI 排班，然后下班。
Open `http://localhost:10001`, schedule your AI, then clock out.
