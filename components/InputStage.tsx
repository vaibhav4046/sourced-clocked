"use client";
import { motion } from "framer-motion";
import type { SourceDoc } from "@/lib/types";

export const SAMPLE = {
  question: "Can I take my folding bike on the train?",
  answer:
    "A folding bike travels free as hand luggage on high-speed services when it is folded and in a cover. You must book it as registered luggage 48 hours before departure. The railway also offers free wi-fi in every carriage.",
  documents: [
    {
      id: "doc0",
      title: "Bicycles on high-speed services",
      text: "On high-speed services, a folding bike travels free as hand luggage when it is folded and in a cover or bag. Put it in the luggage rack at the end of the car; no reservation is needed. A full-size bike must be boxed and booked as registered luggage at least 24 hours before departure.",
    },
    {
      id: "doc1",
      title: "Bicycles on regional trains",
      text: "On regional trains, bikes travel unfolded in the bike area of the first or last car. A bike ticket is required on weekdays before 9 a.m., and spaces are first come, first served.",
    },
    {
      id: "doc2",
      title: "Luggage allowance",
      text: "Each passenger may bring two pieces of hand luggage and one larger item, each up to 30 kg. Hand luggage must fit in the overhead rack or under the seat. Bicycles, strollers, and sports equipment have their own rules, listed under Special items.",
    },
  ],
};

interface Props {
  mode: "live" | "demo" | null;
  question: string;
  answer: string;
  docs: SourceDoc[];
  loading: boolean;
  onQuestion: (v: string) => void;
  onAnswer: (v: string) => void;
  onDocs: (d: SourceDoc[]) => void;
  onRun: () => void;
}

export default function InputStage(p: Props) {
  const setDoc = (i: number, patch: Partial<SourceDoc>) => {
    const next = p.docs.slice();
    next[i] = { ...next[i], ...patch };
    p.onDocs(next);
  };
  const loadPdf = (i: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = String(reader.result);
      setDoc(i, {
        pdfBase64: b64,
        pdfName: file.name,
        title: p.docs[i].title || file.name.replace(/\.pdf$/i, ""),
      });
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-500">
          The question
        </label>
        <input
          value={p.question}
          onChange={(e) => p.onQuestion(e.target.value)}
          placeholder="What was asked?"
          className="w-full rounded-xl border hairline bg-panel px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition"
        />
      </div>
      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-500">
          The answer to check
        </label>
        <textarea
          value={p.answer}
          onChange={(e) => p.onAnswer(e.target.value)}
          placeholder="Paste the answer an AI, a colleague, or a website gave you."
          rows={4}
          className="w-full resize-y rounded-xl border hairline bg-panel px-4 py-3 text-sm leading-relaxed text-zinc-100 placeholder-zinc-600 transition"
        />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-500">
            Your sources
          </label>
          <span className="text-[10px] text-zinc-600">{p.docs.length}/8</span>
        </div>
        <div className="space-y-3">
          {p.docs.map((d, i) => (
            <motion.div
              key={i}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border hairline bg-panel p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <input
                  value={d.title}
                  onChange={(e) => setDoc(i, { title: e.target.value })}
                  placeholder={`Source ${i + 1} title`}
                  className="flex-1 rounded-lg border hairline bg-ink px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 transition"
                />
                {p.docs.length > 1 && (
                  <button
                    onClick={() => p.onDocs(p.docs.filter((_, j) => j !== i))}
                    className="rounded-lg border hairline px-2.5 py-1.5 text-xs text-zinc-500 transition hover:border-bad/40 hover:text-bad"
                    aria-label="Remove source"
                  >
                    Remove
                  </button>
                )}
              </div>
              {d.pdfName && (
                <div className="mb-2 flex items-center justify-between rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs text-brand">
                  <span>PDF attached: {d.pdfName}</span>
                  <button
                    onClick={() => setDoc(i, { pdfBase64: undefined, pdfName: undefined })}
                    className="text-zinc-500 transition hover:text-bad"
                  >
                    Remove
                  </button>
                </div>
              )}
              <textarea
                value={d.text}
                onChange={(e) => setDoc(i, { text: e.target.value })}
                placeholder={
                  d.pdfName
                    ? "Optional: paste text to override the PDF's extracted text."
                    : "Paste the document text - a policy, a chapter, a spec, an email."
                }
                rows={3}
                className="w-full resize-y rounded-lg border hairline bg-ink px-3 py-2 text-xs leading-relaxed text-zinc-300 placeholder-zinc-600 transition"
              />
              <label className="mt-2 inline-block cursor-pointer rounded-lg border hairline px-2.5 py-1 text-[11px] text-zinc-500 transition hover:border-brand/40 hover:text-brand">
                {d.pdfName ? "Replace PDF" : "Attach PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) loadPdf(i, f);
                    e.target.value = "";
                  }}
                />
              </label>
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {p.docs.length < 8 && (
            <button
              onClick={() =>
                p.onDocs([...p.docs, { id: `doc${p.docs.length}`, title: "", text: "" }])
              }
              className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-400 transition hover:border-brand/40 hover:text-brand"
            >
              + Add a source
            </button>
          )}
          <button
            onClick={() => {
              p.onQuestion(SAMPLE.question);
              p.onAnswer(SAMPLE.answer);
              p.onDocs(SAMPLE.documents.map((d) => ({ ...d })));
            }}
            className="rounded-lg border hairline px-3 py-2 text-xs text-zinc-400 transition hover:border-brand/40 hover:text-brand"
          >
            Load the rail-travel sample
          </button>
        </div>
      </div>
      {p.mode === "demo" && (
        <div className="rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-xs leading-relaxed text-warn">
          <strong>Demo mode.</strong> No Clocked API key is connected, so this check runs on a local
          heuristic stand-in. Verdicts and scores are illustrative, not judged results.
        </div>
      )}
      {p.mode === "live" && (
        <div className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-xs leading-relaxed text-brand">
          Live mode: checks run against the Clocked API on your sources.
        </div>
      )}
      <motion.button
        onClick={p.onRun}
        disabled={p.loading}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {p.loading ? "Checking every claim..." : "Check this answer"}
      </motion.button>
    </div>
  );
}
