# Skill-Manager — AI 的无人值班室

Skill-Manager 是一个本地部署的 AI 自动化平台。你排好班（cron / webhook），配好工具箱（bash / python / web search / MCP），定好交班方式（推送通知）。然后你下班，它 7x24 值守。

对话式 AI 的核心问题是**上下文污染** — 你让它查了新闻，再让它写代码，两次任务的上下文会串。一个通用 Agent 承担所有角色，什么都能做，但什么都做不精。

Skill-Manager 的解法是**上下文隔离 + Skill 专业化** — 每个任务独立上下文窗口，互不干扰；每个 Skill 只做一件事，做到可靠。在 Skill 的基础上，通过自然语言描述需求，LLM 自动配置触发方式和执行细节。

大量工作不需要深度思考，只需要专注执行。Kahneman 在《思考，快与慢》中将认知分为 System 1（自动、快速、低耗能）和 System 2（深思熟虑、慢、高耗能）。日常工作中绝大多数任务是 System 1 —— 搜新闻、整理数据、推送报告 —— 它们不需要推理，需要的是准时和专注。所以 Skill-Manager 的设计是：Skill 直接执行确定性的任务，只在真正需要深度思考时才动用 Agent 推理能力。

![Dashboard](docs/screenshots/dashboard-full.png)

## 核心能力

### 自然语言配置任务
在已有 Skill 的基础上，用一句话描述你的需求，AI 自动配置触发方式和执行细节：
> "每天早上 9:30 帮我搜索特朗普最新动态，整理成简报推送给我"

![Add Task](docs/screenshots/add-task-modal.png)

### 四种触发模式
| 模式 | 说明 |
|------|------|
| **Cron** | 定时执行（系统 crontab 注册） |
| **Webhook** | HTTP POST 触发（外部事件驱动） |
| **Manual** | 手动执行（Web UI 一键触发） |
| **Chain** | 链式触发（A 完成后自动执行 B，最深 5 层） |

### Agent 工具箱
- **SDK 工具** — bash、python3、read、write、edit、grep、find、ls
- **Web Search** — Z.AI 网页搜索
- **MCP 工具** — 动态发现并注册任意 MCP 服务器的工具

![Tools Page](docs/screenshots/tools-page.png)

### 执行过程可视化
每次执行都能看到推理轮次、工具调用链、完整输出。

![Skill Detail](docs/screenshots/skill-detail.png)

### 推送通知
通过 Lobster CLI 把执行结果推送到微信、钉钉、Slack 等任意渠道。

### 本地部署，数据不出内网
- 支持任何 OpenAI 兼容 API（Z.AI、DeepSeek、Ollama 本地模型等）
- 数据全部存在本地文件系统
- 零数据外泄风险

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/hongyushe/skill-manager.git
cd skill-manager

# 2. 安装依赖
npm install

# 3. 配置 API
cp skill-manager.example.json skill-manager.json
# 编辑 skill-manager.json，填入你的 API key 和 model

# 4. 启动
./start.sh
# 打开 http://localhost:10001
```

## 使用场景

| 场景 | 输入 | 输出 |
|------|------|------|
| 新闻/舆情监控 | 定时搜索关键词 | 结构化简报推送 |
| 股市数据追踪 | 定时查询行情 | 异动提醒 |
| 会议录音整理 | 录音转写文本 | 待办清单 + 纪要 |
| IM 消息日报 | 群消息导出 | 关键信息摘要 |
| 竞品动态监控 | 定时检查官网/社媒 | 变化对比报告 |
| 系统健康检查 | 定时执行检查脚本 | 异常告警 |

## 文档

- [白皮书](docs/whitepaper.md) — 项目定位、设计哲学、与 OpenClaw / Hermes Agent 对比
- [使用指南](docs/guide.html) — 完整图文教程（含截图）

## 技术栈

Next.js 16 + React 19 + Tailwind CSS 4 + @mariozechner/pi-coding-agent + @modelcontextprotocol/sdk

## License

MIT
