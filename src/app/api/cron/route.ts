import { NextRequest, NextResponse } from "next/server";
import {
  generateCronCommand,
  registerCron,
  removeCron,
  listRegisteredCrons,
} from "@/lib/scheduler";

export async function POST(req: NextRequest) {
  const { cron, skillName, action } = await req.json();
  const port = process.env.PORT || "3000";

  try {
    if (action === "register") {
      const entry = await registerCron(cron, skillName, port);
      return NextResponse.json({ ok: true, entry });
    }

    if (action === "remove") {
      await removeCron(skillName);
      return NextResponse.json({ ok: true });
    }

    if (action === "generate") {
      const command = generateCronCommand(cron, skillName, port);
      return NextResponse.json({ ok: true, command });
    }

    if (action === "list") {
      const crons = await listRegisteredCrons();
      return NextResponse.json({ crons });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
