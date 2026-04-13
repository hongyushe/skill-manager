import { CustomData, TriggerEntry, ExecDetailEntry } from "./types";

export function parseCustom(content: string): CustomData {
  const triggers: TriggerEntry[] = [];
  const execDetails: ExecDetailEntry[] = [];

  if (!content.trim()) return { triggers, execDetails };

  const triggerSection = content.split("## Execution Details")[0];
  const execSection = content.includes("## Execution Details")
    ? content.split("## Execution Details")[1]
    : "";

  // Parse trigger entries
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

  // Parse exec detail entries
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

  return { triggers, execDetails };
}

export function serializeCustom(data: CustomData): string {
  const lines: string[] = [];

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

  return lines.join("\n");
}
