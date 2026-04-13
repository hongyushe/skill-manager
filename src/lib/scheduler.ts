import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const MARKER_PREFIX = "# skill-manager:";

export function generateCronCommand(
  cronExpression: string,
  skillName: string,
  port: string = "3000"
): string {
  return `${cronExpression} curl -s -X POST http://localhost:${port}/api/execute/${skillName}?trigger=cron`;
}

export async function registerCron(
  cronExpression: string,
  skillName: string,
  port: string = "3000"
): Promise<string> {
  const command = generateCronCommand(cronExpression, skillName, port);
  const entry = `${command} ${MARKER_PREFIX}${skillName}`;

  try {
    // Read current crontab
    const { stdout } = await execAsync("crontab -l 2>/dev/null || true");
    const lines = stdout.split("\n").filter((l) => !l.includes(`${MARKER_PREFIX}${skillName}`));
    lines.push(entry);
    const newCrontab = lines.join("\n");

    // Write back
    const { stdout: echoStdout } = await execAsync(`echo ${JSON.stringify(newCrontab)} | crontab -`);
    return entry;
  } catch (e) {
    throw new Error(`Failed to register cron: ${String(e)}`);
  }
}

export async function removeCron(skillName: string): Promise<void> {
  try {
    const { stdout } = await execAsync("crontab -l 2>/dev/null || true");
    const lines = stdout
      .split("\n")
      .filter((l) => !l.includes(`${MARKER_PREFIX}${skillName}`));
    const newCrontab = lines.join("\n");
    await execAsync(`echo ${JSON.stringify(newCrontab)} | crontab -`);
  } catch (e) {
    throw new Error(`Failed to remove cron: ${String(e)}`);
  }
}

export async function listRegisteredCrons(): Promise<string[]> {
  try {
    const { stdout } = await execAsync("crontab -l 2>/dev/null || true");
    return stdout
      .split("\n")
      .filter((l) => l.includes(MARKER_PREFIX));
  } catch {
    return [];
  }
}
