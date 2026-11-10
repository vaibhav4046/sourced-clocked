import { NextRequest, NextResponse } from "next/server";
import { runCheck, validateInput } from "@/lib/check";

export const runtime = "nodejs";
export const maxDuration = 120;

// Naive per-IP throttle: 20 checks/hour. In-memory per instance; fine for a demo.
const hits = new Map<string, { count: number; reset: number }>();
const LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000;

function throttled(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  rec.count++;
  return rec.count > LIMIT;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (throttled(ip)) {
    return NextResponse.json({ error: "Rate limit reached. Try again later." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = await validateInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    const result = await runCheck(parsed.input);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; error?: string; message?: string };
    if (e?.status === 402) {
      return NextResponse.json(
        { error: "The Clocked credit allowance is exhausted. The build stops here - no paid usage was enabled." },
        { status: 402 }
      );
    }
    if (e?.status === 401) {
      return NextResponse.json({ error: "The Clocked API key was rejected." }, { status: 502 });
    }
    console.error("check failed", e?.message ?? err);
    return NextResponse.json(
      { error: "The check could not be completed. Try again." },
      { status: 502 }
    );
  }
}
