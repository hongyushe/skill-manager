# Skill-Manager — AI 的无人值班室

Skill-Manager 是一个本地部署的 AI 自动化平台。你排好班（cron / webhook），配好工具箱（bash / python / web search / MCP），定好交班方式（推送通知）。然后你下班，它 7x24 值守。

对话式 AI 的核心问题是**上下文污染** — 你让它查了新闻，再让它写代码，两次任务的上下文会串。一个通用 Agent 承担所有角色，什么都能做，但什么都做不精。Skill-Manager 的解法是**上下文隔离 + Skill 专业化** — 每个任务独立上下文窗口，互不干扰；每个 Skill 只做一件事，做到可靠。在 Skill 的基础上，通过自然语言描述需求，LLM 自动配置触发方式和执行细节。

大量工作不需要深度思考，只需要专注执行。Kahneman 在《思考，快与慢》中将认知分为 System 1（自动、快速、低耗能）和 System 2（深思熟虑、慢、高耗能）。日常工作中绝大多数任务是 System 1 —— 搜新闻、整理数据、推送报告 —— 它们不需要推理，需要的是准时和专注。所以 Skill-Manager 的设计是：Skill 直接执行确定性的任务，只在真正需要深度思考时才动用 Agent 推理能力。

![Dashboard](docs/screenshots/dashboard-full.png)

**[English Version](README-en.md)** | **[白皮书 / Whitepaper](docs/whitepaper.md)** | **[使用指南 / Guide](docs/guide.html)**

---

## 功能概览

| 能力 | 说明 |
|------|------|
| **Skill 可视化** | 自动解析 SKILL.md，SHA-256 哈希追踪，自动同步摘要 |
| **多种触发方式** | Cron（自动注册 crontab）、Webhook、Manual、Chain（最深 5 层） |
| **自然语言配置任务** | 在已有 Skill 基础上，中文/英文描述 → LLM 自动解析为结构化配置 |
| **MCP 工具集成** | 通用 MCP 客户端，连接任意 MCP 服务 |
| **执行追踪** | 完整历史、推理轮次、工具调用链、Token 用量 |
| **Lobster 通知** | 结果自动推送到微信、钉钉、Slack 等 |
| **本地部署** | 支持任何 OpenAI 兼容 API + Ollama，数据全部存本地 |

![Tools Page](docs/screenshots/tools-page.png)

---

## 安装与启动

```bash
# 1. 克隆项目
git clone https://github.com/hongyushe/skill-manager.git
cd skill-manager

# 2. 安装依赖
npm install

# 3. 配置 API
cp skill-manager.example.json skill-manager.json
# 编辑 skill-manager.json，填入你的 API key 和 model

# 4. 启动（自动创建 Python venv、构建、后台运行）
./start.sh
# 打开 http://localhost:10001

# 停止
./stop.sh
```

---

## 配置

打开 `http://localhost:10001/settings` 或编辑 `skill-manager.json`：

![Settings](docs/screenshots/settings.png)

### LLM 配置

| 配置项 | 说明 |
|--------|------|
| `base_url` | OpenAI 兼容 API 的 Base URL（Z.AI、OpenRouter 等） |
| `api_key` | LLM API Key（页面显示时自动脱敏） |
| `model` | 模型名称（如 `glm-4-flash`、`gpt-4o`） |
| `skills_dir` | Skill 目录路径（默认 `~/.claude/skills`） |

### Z.AI Web Search

| 配置项 | 说明 |
|--------|------|
| `zai_api_key` | Z.AI API Key，用于 MCP Web Search 工具 |

### Lobster CLI 通知（可选）

| 配置项 | 说明 |
|--------|------|
| `lobster_enabled` | 通知开关（默认 `false`） |
| `lobster_path` | Lobster CLI 可执行文件路径 |
| `lobster_pipeline` | Pipeline 模板，支持 `{{result}}` 占位符 |

API Key 在 Settings 页面显示时自动脱敏（前 4 位 + `...` + 后 4 位），保存时检测占位符，自动保留原值。

---

## 仪表盘

![Dashboard](docs/screenshots/dashboard.png)

- **Active Tasks** — 汇总所有 Skill 中状态为 `active` 的任务，显示触发类型图标、任务名称、所属 Skill
- **Skills** — 有任务的 Skill 卡片网格，显示名称、任务数量和摘要
- **未配置任务** — 列出没有配置任务的 Skill

Dashboard 加载时自动检测所有 SKILL.md 的 **SHA-256 哈希**。如果内容变化或发现新 Skill，自动重新生成摘要。

---

## Skill 详情页

![Skill Detail](docs/screenshots/skill-detail.png)

### 摘要（Summary）
三种状态：无摘要 → 显示 "Generate Summary" 按钮；有摘要 → 只读显示 + Edit；编辑中 → 文本框 + Save/Cancel。摘要由 LLM 基于 SKILL.md 内容生成，200-500 字纯文本。

### 任务（Tasks）
每个任务卡片包含：触发类型图标、名称、调度表达式、指令预览、**Run** 和删除按钮。

### 最新结果（Latest Result）
- 元信息：时间戳、状态、任务名称、耗时
- 可折叠过程行：`过程 (N轮推理 · M次工具调用)`，点击展开显示每次工具调用详情
- 最终输出结果

### 执行历史（History Timeline）
默认显示最近 10 条，可展开查看全部。每条记录：时间、任务名/触发来源、状态（颜色区分）、输出摘要。

---

## 自然语言配置任务

在已有 Skill 的基础上，点击 **"+ Add Task"**，用一句话描述需求：

![Add Task](docs/screenshots/add-task-modal.png)

> 每天早上9点搜索特朗普最新言论，用中文汇总

点击 **"Analyze"**，LLM 自动解析为结构化配置。可手动修改后点击 **"Confirm & Save"** 保存。

---

## 触发方式

| 类型 | 说明 | 配置方式 |
|------|------|----------|
| **Cron** | 定时执行，标准 Cron 表达式 | `trigger_config: "0 9 * * *"` |
| **Webhook** | HTTP POST 回调，外部系统触发 | 配置 endpoint `/api/hooks/my-hook` |
| **Manual** | Web 界面手动点击 | 默认方式，无需配置 |
| **Chain** | 链式触发，执行完自动触发下一个 Skill | 配置 `chainTarget` |

### Cron 触发（自动注册）
添加/更新 Cron 类型的 Task 时，系统**自动注册到系统 crontab**，无需手动配置：
```
0 9 * * * curl -s -X POST http://localhost:10001/api/execute/news-monitor?trigger=cron&task_id=TASK-001 # skill-manager:news-monitor:TASK-001
```
删除 Task 时自动清理对应的 crontab 条目。

### Webhook 触发
```bash
curl -X POST http://localhost:10001/api/hooks/my-hook \
  -H "Content-Type: application/json" \
  -d '{"event": "trigger", "data": "额外上下文"}'
```

### Chain 链式触发
当前 Skill 执行完成后自动触发下一个 Skill。最大 5 层链式嵌套深度，异步 fire-and-forget，链中某个 Skill 失败不影响其他 Skill。

---

## 工具系统与 MCP

### 在 Skill 中声明工具
```markdown
## Tools
- web_search
```

| 工具名 | 说明 | 依赖 |
|--------|------|------|
| `web_search` | 通过 Z.AI MCP 搜索 Web | `zai_api_key` |

工具在执行时由 LLM Agent 自动判断何时调用，无需手动触发。通过 MCP 协议可动态注册任意外部工具。

---

## 自定义 Skill 配置

配置存储在 `~/.claude/skills/skill-manager/<name>/custom.md`：

```markdown
## Tools
- web_search

## Tasks
### TASK-001
- name: 每日新闻简报
- trigger_type: cron
- trigger_config: 0 9 * * *
- instruction: |
    搜索今日要闻，整理成简报...
- status: active
```

### 数据目录结构
```
~/.claude/skills/
  news-monitor/
    SKILL.md                              # Skill 定义（Claude Code 读取此文件）
  skill-manager/
    news-monitor/
      custom.md                           # 自定义配置（任务、触发器、工具）
      summary.md                          # LLM 自动生成的摘要
      history.json                        # 执行历史 + 编辑日志
      .skill-hash                         # SKILL.md 的 SHA-256 哈希（变更检测）
```

---

## API 参考

### Skill 操作
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/skills` | 列出所有 Skill 名称 |
| GET | `/api/skills/[name]` | 获取 Skill 完整详情 |
| PUT | `/api/skills/[name]` | 更新 Skill（添加/更新任务、摘要） |
| DELETE | `/api/skills/[name]` | 删除任务或触发器 |

### 执行
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/execute/[name]?trigger=manual&task_id=TASK-001` | 执行指定任务 |
| POST | `/api/execute/[name]?trigger=manual` | 执行整个 Skill |
| POST | `/api/hooks/[hookId]` | Webhook 触发 |

### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PUT | `/api/settings` | 获取/更新配置（API Key 脱敏） |
| GET/POST | `/api/summary` | 批量同步/生成 Skill 摘要 |
| POST | `/api/interpret` | 自然语言解析为任务配置 |
| POST | `/api/cron` | 管理 Crontab（register/remove/list） |

---

## 技术栈

- **前端** Next.js App Router + React 19 + Tailwind CSS 4
- **执行引擎** @mariozechner/pi-coding-agent（多轮 Agent Loop + Tool Calling）
- **MCP** @modelcontextprotocol/sdk（通用 MCP 客户端）
- **调度** 系统 crontab（标记注释管理）

### 执行流程
```
用户/定时器/Webhook → API Route (/api/execute/[name])
  → 读取 Skill 配置 (custom.md)
  → 解析工具声明 (## Tools) → resolveTools() → ToolDefinition[]
  → assemblePrompt() 组装完整 Prompt
  → pi-coding-agent Agent Loop
      → LLM 决策 → 调用工具 → 获取结果 → 继续推理（多轮自动）
  → 记录执行日志 (history.json)
  → Lobster 通知（如已启用）
  → 检查 Chain 触发 → 递归执行下一个 Skill
  → 返回结果 + 过程数据
```

## License

MIT
