"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClaimResult } from "@/lib/types";

const VERDICT = {
  supported: { label: "Supported", cls: "text-brand border-brand/30 bg-brand/10", bar: "#6ee7b7" },
  contradicted: { label: "Contradicted", cls: "text-bad border-bad/30 bg-bad/10", bar: "#f87171" },
  unverifiable: { label: "Unverifiable", cls: "text-warn border-warn/30 bg-warn/10", bar: "#fbbf24" },
} as const;

export default function ClaimCard({ claim, index, mode }: { claim: ClaimResult; index: number; mode: "live" | "demo" }) {
  const [open, setOpen] = useState(false);
  const v = VERDICT[claim.verdict];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl border hairline bg-panel scroll-mt-24"
      id={`claim-${index}`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${v.cls}`}>
          {v.label}
        </span>
        <span className="flex-1 text-sm leading-relaxed text-zinc-200">{claim.claim}</span>
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
          {Math.round(claim.probability * 100)}%{mode === "demo" && <span className="ml-1 text-[9px] normal-case tracking-normal text-zinc-600">text match</span>}
        </span>
      </button>
      <div className="mx-4 h-px bg-line" />
      <div className="px-4 pb-3 pt-2">
        <div className="h-1 w-full overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full"
            style={{ background: v.bar }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(claim.probability * 100)}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-4">
              {claim.evidence.length === 0 && (
                <p className="text-xs text-zinc-500">No verbatim passage returned for this claim.</p>
              )}
              {claim.evidence.map((e, i) => (
                <figure key={i} className="rounded-lg border hairline bg-ink p-3">
                  <figcaption className="mb-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    {e.docTitle}
                  </figcaption>
                  <blockquote className="text-sm leading-relaxed text-zinc-300">
                    &ldquo;<span className="claim-mark">{e.quote}</span>&rdquo;
                  </blockquote>
                </figure>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
