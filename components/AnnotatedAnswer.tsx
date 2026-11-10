"use client";
import { motion } from "framer-motion";
import type { ClaimResult } from "@/lib/types";

const UNDERLINE: Record<ClaimResult["verdict"], string> = {
  supported: "border-b-2 border-brand/70 bg-brand/10",
  contradicted: "border-b-2 border-bad/70 bg-bad/10",
  unverifiable: "border-b-2 border-warn/70 bg-warn/10",
};

interface Segment {
  text: string;
  claimIndex?: number;
  verdict?: ClaimResult["verdict"];
}

function buildSegments(answer: string, claims: ClaimResult[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  claims.forEach((c, i) => {
    const at = c.claim ? answer.indexOf(c.claim, cursor) : -1;
    if (at === -1) return;
    if (at > cursor) segments.push({ text: answer.slice(cursor, at) });
    segments.push({ text: c.claim, claimIndex: i, verdict: c.verdict });
    cursor = at + c.claim.length;
  });
  if (cursor < answer.length) segments.push({ text: answer.slice(cursor) });
  return segments;
}

export default function AnnotatedAnswer({
  answer,
  claims,
}: {
  answer: string;
  claims: ClaimResult[];
}) {
  const segments = buildSegments(answer, claims);
  const annotated = segments.some((s) => s.claimIndex !== undefined);
  if (!annotated) return null;
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
        Your answer, annotated
      </h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="rounded-xl border hairline bg-panel p-5 text-sm leading-8 text-zinc-200"
      >
        {segments.map((s, i) =>
          s.claimIndex !== undefined && s.verdict ? (
            <button
              key={i}
              onClick={() =>
                document.getElementById(`claim-${s.claimIndex}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              }
              className={`rounded px-0.5 text-left transition hover:brightness-125 ${UNDERLINE[s.verdict]}`}
            >
              {s.text}
            </button>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </motion.p>
      <div className="mt-2 flex gap-4 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
        <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-4 rounded bg-brand/70" /> supported</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-4 rounded bg-bad/70" /> contradicted</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-4 rounded bg-warn/70" /> unverifiable</span>
      </div>
    </div>
  );
}
