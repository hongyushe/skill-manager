import { CustomData, TriggerEntry, ExecDetailEntry, TaskEntry } from "./types";

export function parseCustom(content: string): CustomData {
  const triggers: TriggerEntry[] = [];
  const execDetails: ExecDetailEntry[] = [];
  const tasks: TaskEntry[] = [];
  const tools: string[] = [];

  if (!content.trim()) return { triggers, execDetails, tasks, tools };

  // Split into sections
  const parts = content.split(/^## /m);
  const taskSection = parts.find((p) => p.startsWith("Tasks")) || "";
  const toolsSection = parts.find((p) => p.startsWith("Tools")) || "";
  const triggerSection = parts
    .filter((p) => !p.startsWith("Tasks") && !p.startsWith("Execution Details") && !p.startsWith("Tools"))
    .join("## ");
  const execSection = parts.find((p) => p.startsWith("Execution Details")) || "";

  // Parse tools section (e.g. "## Tools\n- web_search\n- read_file")
  if (toolsSection) {
    const lines = toolsSection.split("\n");
    for (const line of lines) {
      const match = line.match(/^- (.+)$/);
      if (match) tools.push(match[1].trim());
    }
  }

  // Parse task entries (new format)
  if (taskSection) {
    const taskBlocks = taskSection.split(/^### (TASK-\d+)/m).slice(1);
    for (let i = 0; i < taskBlocks.length; i += 2) {
      const id = taskBlocks[i].trim();
      const block = taskBlocks[i + 1];
      if (!block) continue;

      const name = block.match(/^- name:\s*(.+)$/m)?.[1]?.trim() || "";
      const triggerType = block.match(/^- trigger_type:\s*(.+)$/m)?.[1]?.trim() as TaskEntry["triggerType"] || "manual";
      const triggerConfig = block.match(/^- trigger_config:\s*(.+)$/m)?.[1]?.trim() || "";
      const status = block.match(/^- status:\s*(.+)$/m)?.[1]?.trim() as TaskEntry["status"] || "active";
      const instructionMatch = block.match(/^- instruction:\s*\|?\n([\s\S]*?)(?=^###|^-\s|\s*$)/m);
      const instruction = instructionMatch ? instructionMatch[1].replace(/^ {4}/gm, "").trim() : "";

      tasks.push({ id, name, triggerType, triggerConfig, instruction, status });
    }
  }

  // Parse old trigger entries (backward compat)
  const triggerBlocks = triggerSection.split(/^### (TRG-\d+)/m).slice(1);
  for (let i = 0; i < triggerBlocks.length; i += 2) {
    const id = triggerBlocks[i].trim();
    const block = triggerBlocks[i + 1];
    if (!block) continue;

    const intent = block.match(/^- intent:\s*(.+)$/m)?.[1]?.trim() || "";
    const type = block.match(/^- type:\s*(.+)$/m)?.[1]?.trim() as TriggerEntry["type"] || "manual";
    const cron = block.match(/^- cron:\s*(.+)$/m)?.[1]?.trim();
    const endpoint = block.match(/^- endpoint:\s*(.+)$/m)?.[1]?.trim();
    const chainTarget = block.match(/^- chain_target:\s*(.+)$/m)?.[1]?.trim();
    const status = block.match(/^- status:\s*(.+)$/m)?.[1]?.trim() as TriggerEntry["status"] || "active";

    triggers.push({
      id,
      intent,
      type,
      ...(cron && { cron }),
      ...(endpoint && { endpoint }),
      ...(chainTarget && { chainTarget }),
      status,
    });
  }

  // Parse old exec detail entries (backward compat)
  const execBlocks = execSection.split(/^### (EXEC-\d+)/m).slice(1);
  for (let i = 0; i < execBlocks.length; i += 2) {
    const id = execBlocks[i].trim();
    const block = execBlocks[i + 1];
    if (!block) continue;

    const intent = block.match(/^- intent:\s*(.+)$/m)?.[1]?.trim() || "";
    const promptMatch = block.match(/^- prompt:\s*\|?\n([\s\S]*?)(?=^###|\s*$)/m);
    const prompt = promptMatch ? promptMatch[1].trim() : "";

    execDetails.push({ id, intent, prompt });
  }

  return { triggers, execDetails, tasks, tools };
}

export function serializeCustom(data: CustomData): string {
  const lines: string[] = [];

  // Serialize tools
  if (data.tools.length > 0) {
    lines.push("## Tools");
    for (const t of data.tools) {
      lines.push(`- ${t}`);
    }
    lines.push("");
  }

  // Serialize tasks (new format)
  if (data.tasks.length > 0) {
    lines.push("## Tasks");
    for (const t of data.tasks) {
      lines.push(`### ${t.id}`);
      lines.push(`- name: ${t.name}`);
      lines.push(`- trigger_type: ${t.triggerType}`);
      lines.push(`- trigger_config: ${t.triggerConfig}`);
      lines.push(`- instruction: |`);
      for (const line of t.instruction.split("\n")) {
        lines.push(`    ${line}`);
      }
      lines.push(`- status: ${t.status}`);
      lines.push("");
    }
  }

  // Serialize old triggers (backward compat)
  if (data.triggers.length > 0) {
    lines.push("## Triggers");
    for (const t of data.triggers) {
      lines.push(`### ${t.id}`);
      lines.push(`- intent: ${t.intent}`);
      lines.push(`- type: ${t.type}`);
      if (t.cron) lines.push(`- cron: ${t.cron}`);
      if (t.endpoint) lines.push(`- endpoint: ${t.endpoint}`);
      if (t.chainTarget) lines.push(`- chain_target: ${t.chainTarget}`);
      lines.push(`- status: ${t.status}`);
      lines.push("");
    }
  }

  // Serialize old exec details (backward compat)
  if (data.execDetails.length > 0) {
    lines.push("## Execution Details");
    for (const e of data.execDetails) {
      lines.push(`### ${e.id}`);
      lines.push(`- intent: ${e.intent}`);
      lines.push(`- prompt: |`);
      for (const line of e.prompt.split("\n")) {
        lines.push(`    ${line}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}
