import { NextRequest, NextResponse } from "next/server";
import {
  readSkill,
  writeCustom,
  writeSummary,
  deleteCustomEntry,
  upsertTask,
  deleteTask,
} from "@/lib/storage";
import { CustomData, TaskEntry } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  try {
    const skill = await readSkill(name);
    return NextResponse.json(skill);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 404 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  try {
    const body = await req.json();

    // Handle task operations
    if (body.action === "add_task" || body.action === "update_task") {
      const task = body.task as TaskEntry;
      await upsertTask(name, task);

      // Auto-register cron if applicable
      if (task.triggerType === "cron" && task.status === "active" && task.triggerConfig) {
        try {
          const port = process.env.PORT || "3000";
          const cronCmd = `${task.triggerConfig} curl -s -X POST http://localhost:${port}/api/execute/${name}?trigger=cron\\&task_id=${task.id} # skill-manager:${name}:${task.id}`;
          const { execFile } = await import("child_process");
          const { promisify } = await import("util");
          const execFileAsync = promisify(execFile);
          const { stdout } = await execFileAsync("crontab", ["-l"]);
          if (!stdout.includes(`skill-manager:${name}:${task.id}`)) {
            await execFileAsync("sh", ["-c", `(crontab -l 2>/dev/null; echo "${cronCmd}") | crontab -`]);
          }
        } catch {
          // cron registration failed, non-fatal
        }
      }

      return NextResponse.json({ ok: true });
    }

    // Handle summary update
    if (body.action === "update_summary") {
      await writeSummary(name, body.summary);
      return NextResponse.json({ ok: true });
    }

    // Handle legacy custom update
    const { custom, editDetail } = body as {
      custom: CustomData;
      editDetail: string;
    };
    await writeCustom(name, custom, editDetail);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  try {
    const body = await req.json();

    if (body.action === "delete_task") {
      await deleteTask(name, body.task_id);
      return NextResponse.json({ ok: true });
    }

    const { entryType, entryId } = body;
    await deleteCustomEntry(name, entryType, entryId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
