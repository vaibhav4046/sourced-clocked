"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import InputStage from "@/components/InputStage";
import ResultsDashboard from "@/components/ResultsDashboard";
import type { CheckResult, SourceDoc } from "@/lib/types";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
} as const;

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [docs, setDocs] = useState<SourceDoc[]>([{ id: "doc0", title: "", text: "" }]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [mode, setMode] = useState<"live" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const appRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/mode").then((r) => r.json()).then((d) => setMode(d.mode)).catch(() => setMode("demo"));
  }, []);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer, documents: docs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "The check failed.");
      } else {
        setResult(data);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="glow min-h-screen">
      <nav className="sticky top-0 z-20 border-b hairline bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">Sourced</span>
          <div className="flex items-center gap-3">
            <span className="rounded-full border hairline px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              Clocked Build Challenge
            </span>
            <a
              href="#app"
              className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:brightness-110"
            >
              Try it
            </a>
          </div>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[82vh] max-w-6xl flex-col items-center justify-center px-5 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-[11px] font-medium uppercase tracking-[0.35em] text-brand"
        >
          Verify &middot; Rank &middot; Compare
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-zinc-50 sm:text-7xl"
        >
          Is that answer true?
          <br />
          <span className="text-zinc-500">Ask your sources.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400"
        >
          Paste any answer - from ChatGPT, a colleague, a website - and the documents it should
          come from. Sourced checks every claim against your sources, ranks the passages that
          matter, and shows where your sources disagree with each other.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          onClick={() => appRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="mt-10 rounded-full bg-brand px-8 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          Check an answer
        </motion.button>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              k: "01",
              t: "Verify",
              d: "Every claim in the answer is checked against your documents and marked supported, contradicted, or unverifiable - with the exact passage behind the call.",
            },
            {
              k: "02",
              t: "Rank",
              d: "Your sources are ranked for the question: which passage answers it, which document is worth reading further, which to skip.",
            },
            {
              k: "03",
              t: "Compare",
              d: "Your sources are checked against each other - duplicates, overlap, and the places where they flatly disagree.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.k}
              {...fade}
              transition={{ ...fade.transition, delay: i * 0.1 }}
              className="rounded-2xl border hairline bg-panel p-6"
            >
              <div className="mb-4 text-xs font-medium tracking-[0.3em] text-zinc-600">{c.k}</div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-100">{c.t}</h3>
              <p className="text-sm leading-relaxed text-zinc-400">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="app" ref={appRef} className="mx-auto max-w-6xl px-5 pb-16">
        <motion.div {...fade} className="rounded-2xl border hairline bg-panel/60 p-6 sm:p-10">
          <h2 className="mb-1 text-xl font-semibold text-zinc-100">Check an answer</h2>
          <p className="mb-8 text-sm text-zinc-500">
            Three questions decide the verdict: what was asked, what was answered, and what your
            sources actually say.
          </p>
          <InputStage
            mode={mode}
            question={question}
            answer={answer}
            docs={docs}
            loading={loading}
            onQuestion={setQuestion}
            onAnswer={setAnswer}
            onDocs={setDocs}
            onRun={run}
          />
          {error && (
            <div className="mt-4 rounded-lg border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
              {error}
            </div>
          )}
        </motion.div>
      </section>

      <div ref={resultsRef}>{result && <ResultsDashboard result={result} />}</div>

      <footer className="border-t hairline">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-zinc-600 sm:flex-row">
          <span>Sourced - built for the Clocked Build Challenge.</span>
          <span>Verify / Rerank / Compare, on your own documents.</span>
        </div>
      </footer>
    </main>
  );
}
