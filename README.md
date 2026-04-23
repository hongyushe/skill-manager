# Skill-Manager — AI 的无人值班室

让 AI 在你下班后继续干活：定时执行任务、调用工具、推送结果。

你排好班（cron/webhook），配好工具箱（python/web search/MCP），定好交班方式（Lobster 推送）。然后你下班，它 7x24 值守。

![Dashboard](docs/screenshots/dashboard-full.png)

## 为什么需要它？

对话式 AI（ChatGPT、Claude）有三个致命问题：

1. **要人盯着** — 你不发消息它就不动，不能自己醒来干活
2. **上下文污染** — 你让它查了新闻，再让它写代码，它会串
3. **不能定时** — 没有 cron、没有 webhook，一切都是手动的

Skill-Manager 解决这三个问题：每个任务独立 context、支持 cron/webhook 触发、结果自动推送。

## 核心能力

### 自然语言建任务
用一句话描述你要什么，AI 自动解析成结构化任务：
> "每天早上 9:30 帮我搜索特朗普最新动态，整理成简报推送给我"

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
git clone https://github.com/your-username/skill-manager.git
cd skill-manager

# 2. 安装依赖
npm install

# 3. 配置 API
cp skill-manager.example.json skill-manager.json
# 编辑 skill-manager.json，填入你的 API key 和 model

# 4. 启动
npm run dev
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

## 技术栈

Next.js 16 + React 19 + Tailwind CSS 4 + @mariozechner/pi-coding-agent + @modelcontextprotocol/sdk

## License

MIT
