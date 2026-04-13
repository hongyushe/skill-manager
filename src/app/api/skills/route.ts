import { NextResponse } from "next/server";
import { listSkills } from "@/lib/storage";

export async function GET() {
  try {
    const skills = await listSkills();
    return NextResponse.json({ skills });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
