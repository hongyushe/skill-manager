import { NextRequest, NextResponse } from "next/server";
import { connectMcp } from "@/lib/mcp-client";

export async function POST(req: NextRequest) {
  try {
    const { url, api_key } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const { client, transport } = await connectMcp(url, api_key || "");

    try {
      const result = await client.listTools();

      const tools = (result.tools || []).map((tool) => ({
        name: tool.name,
        description: tool.description || "",
        inputSchema: tool.inputSchema || {},
      }));

      return NextResponse.json({ tools });
    } finally {
      await transport.terminateSession().catch(() => {});
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to connect: ${String(err)}` },
      { status: 500 }
    );
  }
}
