import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "skill-manager.json");

interface LobsterConfig {
  lobster_enabled: boolean;
  lobster_path: string;
  lobster_pipeline: string;
}

async function getLobsterConfig(): Promise<LobsterConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const settings = JSON.parse(raw);
    return {
      lobster_enabled: settings.lobster_enabled ?? false,
      lobster_path: settings.lobster_path || "lobster",
      lobster_pipeline: settings.lobster_pipeline || "",
    };
  } catch {
    return { lobster_enabled: false, lobster_path: "lobster", lobster_pipeline: "" };
  }
}

export async function notifyViaLobster(
  skillName: string,
  result: string
): Promise<{ sent: boolean; error?: string }> {
  const config = await getLobsterConfig();

  if (!config.lobster_enabled) {
    return { sent: false };
  }

  if (!config.lobster_pipeline) {
    return { sent: false, error: "No Lobster pipeline configured" };
  }

  const pipeline = config.lobster_pipeline.replace(/\{\{result\}\}/g, result);

  try {
    const output = await runLobster(config.lobster_path, pipeline);
    console.log(`[lobster] Notification sent for "${skillName}": ${output.slice(0, 200)}`);
    return { sent: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[lobster] Failed to notify for "${skillName}": ${msg}`);
    return { sent: false, error: msg };
  }
}

function runLobster(cliPath: string, pipeline: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      cliPath,
      ["run", "--pipeline", pipeline],
      { timeout: 30000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout.trim());
      }
    );
  });
}
