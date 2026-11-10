import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ mode: process.env.CLOCKED_API_KEY ? "live" : "demo" });
}
