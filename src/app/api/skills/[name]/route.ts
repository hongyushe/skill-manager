import { NextRequest, NextResponse } from "next/server";
import { readSkill, writeCustom, deleteCustomEntry } from "@/lib/storage";
import { CustomData } from "@/lib/types";

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
    const { entryType, entryId } = await req.json();
    await deleteCustomEntry(name, entryType, entryId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
