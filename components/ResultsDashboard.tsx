"use client";
import { motion } from "framer-motion";
import type { CheckResult } from "@/lib/types";
import ScoreRing from "./ScoreRing";
import ClaimCard from "./ClaimCard";
import AnnotatedAnswer from "./AnnotatedAnswer";

const ACTION_STYLE: Record<string, { label: string; cls: string }> = {
  use: { label: "Use", cls: "text-brand border-brand/30 bg-brand/10" },
  expand: { label: "Read more", cls: "text-warn border-warn/30 bg-warn/10" },
  skip: { label: "Skip", cls: "text-zinc-400 border-zinc-600/40 bg-zinc-800/40" },
};

const REL_STYLE: Record<string, { label: string; cls: string }> = {
  conflict: { label: "Conflict", cls: "text-bad border-bad/30 bg-bad/10" },
  duplicate: { label: "Duplicate", cls: "text-warn border-warn/30 bg-warn/10" },
  overlap: { label: "Overlap", cls: "text-zinc-300 border-zinc-500/40 bg-zinc-700/30" },
};

export default function ResultsDashboard({ result }: { result: CheckResult }) {
  const { overall } = result;
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-5xl space-y-10 px-5 pb-24"
    >
      {result.warnings.map((w, i) => (
        <div key={i} className="rounded-xl border-2 border-warn/50 bg-warn/15 px-5 py-4 text-sm font-medium text-warn">
          {w}
        </div>
      ))}

      <div className="flex flex-col items-center gap-8 rounded-2xl border hairline bg-panel p-8 sm:flex-row sm:justify-between">
        <ScoreRing score={overall.score} mode={result.mode} />
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-semibold text-brand tabular-nums">{overall.supported}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">supported</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-bad tabular-nums">{overall.contradicted}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">contradicted</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-warn tabular-nums">{overall.unverifiable}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">unverifiable</div>
          </div>
        </div>
        {result.credits && (
          <div className="text-center">
            <div className="text-2xl font-semibold tabular-nums text-zinc-300">{result.credits.total}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">credits used</div>
          </div>
        )}
      </div>

      <AnnotatedAnswer answer={result.answer} claims={result.claims} />

      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
          Claim by claim
        </h3>
        <div className="space-y-3">
          {result.claims.map((c, i) => (
            <ClaimCard key={i} claim={c} index={i} mode={result.mode} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
          Evidence, ranked
        </h3>
        <div className="space-y-2">
          {result.passages.map((p, i) => {
            const a = ACTION_STYLE[p.action] ?? ACTION_STYLE.skip;
            return (
              <motion.div
                key={p.docId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="flex flex-col gap-2 rounded-xl border hairline bg-panel p-4"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${a.cls}`}>
                    {a.label}
                  </span>
                  <span className="text-sm font-medium text-zinc-200">{p.docTitle}</span>
                  <span className="ml-auto text-xs tabular-nums text-zinc-500">
                    {Math.round(p.relevance * 100)}%
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-line">
                  <motion.div
                    className="h-full rounded-full bg-brand/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(p.relevance * 100)}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">{p.excerpt}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {result.conflicts.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-zinc-500">
            Where your sources disagree
          </h3>
          <div className="space-y-3">
            {result.conflicts.map((c, i) => {
              const r = REL_STYLE[c.relation];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border hairline bg-panel p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${r.cls}`}>
                      {r.label}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {c.docA.title} &harr; {c.docB.title}
                    </span>
                  </div>
                  {c.summary && <p className="mb-3 text-sm text-zinc-300">{c.summary}</p>}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border hairline bg-ink p-3 text-xs leading-relaxed text-zinc-400">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-zinc-600">{c.docA.title}</div>
                      {c.passageA}
                    </div>
                    <div className="rounded-lg border hairline bg-ink p-3 text-xs leading-relaxed text-zinc-400">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-zinc-600">{c.docB.title}</div>
                      {c.passageB}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}
