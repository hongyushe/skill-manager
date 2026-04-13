import fs from "fs/promises";
import path from "path";
import { parseSkill } from "./parser";
import { parseCustom, serializeCustom } from "./custom-parser";
import {
  CustomData,
  HistoryData,
  SkillDetail,
  ExecutionLog,
  EditLog,
} from "./types";

function getSkillsDir(): string {
  return process.env.SKILLS_DIR || path.join(process.env.HOME || "/", ".claude", "skills");
}

function skillPath(name: string): string {
  return path.join(getSkillsDir(), name);
}

function skillMdPath(name: string): string {
  return path.join(skillPath(name), "SKILL.md");
}

function customMdPath(name: string): string {
  return path.join(skillPath(name), "custom.md");
}

function historyJsonPath(name: string): string {
  return path.join(skillPath(name), "history.json");
}

const EMPTY_HISTORY: HistoryData = { execution_logs: [], edit_logs: [] };

export async function listSkills(): Promise<string[]> {
  const dir = getSkillsDir();
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const skills: string[] = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const hasSkillMd = await fs
          .access(skillMdPath(entry.name))
          .then(() => true)
          .catch(() => false);
        if (hasSkillMd) {
          skills.push(entry.name);
        }
      }
    }
    return skills.sort();
  } catch {
    return [];
  }
}

export async function readSkill(name: string): Promise<SkillDetail> {
  const raw = await fs.readFile(skillMdPath(name), "utf-8");
  const parsed = parseSkill(raw);

  let custom: CustomData = { triggers: [], execDetails: [] };
  let hasCustom = false;
  try {
    const customRaw = await fs.readFile(customMdPath(name), "utf-8");
    custom = parseCustom(customRaw);
    hasCustom = true;
  } catch {
    // no custom.md yet
  }

  let history: HistoryData = EMPTY_HISTORY;
  let hasHistory = false;
  try {
    const historyRaw = await fs.readFile(historyJsonPath(name), "utf-8");
    history = JSON.parse(historyRaw);
    hasHistory = true;
  } catch {
    // no history.json yet
  }

  return { name, parsed, custom, history, hasCustom, hasHistory };
}

export async function writeCustom(
  name: string,
  custom: CustomData,
  editDetail: string
): Promise<void> {
  const skillDir = skillPath(name);

  // Read previous custom.md for edit log
  let before = "";
  try {
    before = await fs.readFile(customMdPath(name), "utf-8");
  } catch {
    // first time
  }

  const content = serializeCustom(custom);
  await fs.writeFile(customMdPath(name), content, "utf-8");

  // Append edit log
  await appendEditLog(name, {
    id: `edit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: "update_custom",
    detail: editDetail,
    before,
    after: content,
  });
}

export async function appendExecutionLog(
  name: string,
  log: ExecutionLog
): Promise<void> {
  const history = await readHistory(name);
  history.execution_logs.unshift(log);
  await fs.writeFile(
    historyJsonPath(name),
    JSON.stringify(history, null, 2),
    "utf-8"
  );
}

async function appendEditLog(name: string, log: EditLog): Promise<void> {
  const history = await readHistory(name);
  history.edit_logs.unshift(log);
  await fs.writeFile(
    historyJsonPath(name),
    JSON.stringify(history, null, 2),
    "utf-8"
  );
}

async function readHistory(name: string): Promise<HistoryData> {
  try {
    const raw = await fs.readFile(historyJsonPath(name), "utf-8");
    return JSON.parse(raw);
  } catch {
    return { execution_logs: [], edit_logs: [] };
  }
}

export async function deleteCustomEntry(
  name: string,
  entryType: "trigger" | "exec",
  entryId: string
): Promise<void> {
  const { custom } = await readSkill(name);
  if (entryType === "trigger") {
    custom.triggers = custom.triggers.filter((t) => t.id !== entryId);
  } else {
    custom.execDetails = custom.execDetails.filter((e) => e.id !== entryId);
  }
  await writeCustom(name, custom, `Deleted ${entryType} entry ${entryId}`);
}

export function getSettingsPath(): string {
  return path.join(process.cwd(), ".env.local");
}
