import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { parseSkill } from "./parser";
import { parseCustom, serializeCustom } from "./custom-parser";
import {
  CustomData,
  HistoryData,
  SkillDetail,
  SkillOverview,
  ExecutionLog,
  EditLog,
  TaskEntry,
} from "./types";

function getSkillsDir(): string {
  return process.env.SKILLS_DIR || path.join(process.env.HOME || "/", ".claude", "skills");
}

function skillPath(name: string): string {
  return path.join(getSkillsDir(), name);
}

function skillManagerDir(name: string): string {
  return path.join(getSkillsDir(), "skill-manager", name);
}

function skillMdPath(name: string): string {
  return path.join(skillPath(name), "SKILL.md");
}

function customMdPath(name: string): string {
  return path.join(skillManagerDir(name), "custom.md");
}

function summaryMdPath(name: string): string {
  return path.join(skillManagerDir(name), "summary.md");
}

function historyJsonPath(name: string): string {
  return path.join(skillManagerDir(name), "history.json");
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

function hashFilePath(name: string): string {
  return path.join(skillManagerDir(name), ".skill-hash");
}

async function computeSkillHash(name: string): Promise<string> {
  const content = await fs.readFile(skillMdPath(name), "utf-8");
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function readStoredHash(name: string): Promise<string | null> {
  try {
    return await fs.readFile(hashFilePath(name), "utf-8");
  } catch {
    return null;
  }
}

async function writeStoredHash(name: string, hash: string): Promise<void> {
  await ensureDir(skillManagerDir(name));
  await fs.writeFile(hashFilePath(name), hash, "utf-8");
}

/** Check if a skill needs summary regeneration (new or SKILL.md changed) */
export async function needsSummaryUpdate(name: string): Promise<boolean> {
  const currentHash = await computeSkillHash(name).catch(() => null);
  if (!currentHash) return false;
  const storedHash = await readStoredHash(name);
  if (storedHash !== currentHash) return true;
  // Also check if summary exists at all
  const summary = await readSummary(name);
  return !summary;
}

/** Update stored hash after summary generation */
export async function markSummarySynced(name: string): Promise<void> {
  const hash = await computeSkillHash(name);
  await writeStoredHash(name, hash);
}

/** Return list of skills that need summary update */
export async function getSkillsNeedingSync(): Promise<string[]> {
  const names = await listSkills();
  const needsUpdate: string[] = [];
  for (const name of names) {
    if (await needsSummaryUpdate(name)) {
      needsUpdate.push(name);
    }
  }
  return needsUpdate;
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

  let custom: CustomData = { triggers: [], execDetails: [], tasks: [], tools: [] };
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

  let summary: string | null = null;
  try {
    summary = await fs.readFile(summaryMdPath(name), "utf-8");
  } catch {
    // no summary.md yet
  }

  return { name, parsed, custom, history, hasCustom, hasHistory, summary };
}

export async function readSummary(name: string): Promise<string | null> {
  try {
    return await fs.readFile(summaryMdPath(name), "utf-8");
  } catch {
    return null;
  }
}

export async function writeSummary(name: string, text: string): Promise<void> {
  await ensureDir(skillManagerDir(name));
  await fs.writeFile(summaryMdPath(name), text, "utf-8");
}

export async function writeCustom(
  name: string,
  custom: CustomData,
  editDetail: string
): Promise<void> {
  // Read previous custom.md for edit log
  let before = "";
  try {
    before = await fs.readFile(customMdPath(name), "utf-8");
  } catch {
    // first time
  }

  const content = serializeCustom(custom);
  await ensureDir(skillManagerDir(name));
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
  await ensureDir(skillManagerDir(name));
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

export async function upsertTask(
  name: string,
  task: TaskEntry
): Promise<void> {
  const { custom } = await readSkill(name);
  const idx = custom.tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    custom.tasks[idx] = task;
  } else {
    custom.tasks.push(task);
  }
  await writeCustom(name, custom, `${idx >= 0 ? "Updated" : "Added"} task ${task.name}`);
}

export async function deleteTask(
  name: string,
  taskId: string
): Promise<void> {
  const { custom } = await readSkill(name);
  custom.tasks = custom.tasks.filter((t) => t.id !== taskId);
  await writeCustom(name, custom, `Deleted task ${taskId}`);
}

export async function listSkillsOverview(): Promise<SkillOverview[]> {
  const names = await listSkills();
  const overviews: SkillOverview[] = [];

  for (const name of names) {
    const summary = await readSummary(name);

    let tasks: TaskEntry[] = [];
    try {
      const customRaw = await fs.readFile(customMdPath(name), "utf-8");
      const custom = parseCustom(customRaw);
      tasks = custom.tasks;
    } catch {
      // no custom.md
    }

    let lastExecution: ExecutionLog | null = null;
    try {
      const historyRaw = await fs.readFile(historyJsonPath(name), "utf-8");
      const history: HistoryData = JSON.parse(historyRaw);
      lastExecution = history.execution_logs[0] || null;
    } catch {
      // no history
    }

    overviews.push({ name, summary, tasks, lastExecution });
  }

  return overviews;
}

export function getSettingsPath(): string {
  return path.join(process.cwd(), ".env.local");
}
