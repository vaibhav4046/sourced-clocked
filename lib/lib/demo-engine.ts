// Demo engine: a deterministic local stand-in that mimics the Clocked API's
// response semantics (verdicts, source positions, probabilities) so the whole
// product is exercisable with no API key. It runs real local heuristics over
// the actual input - nothing is canned. Live mode (lib/clocked-live.ts)
// replaces it wholesale once CLOCKED_API_KEY exists.
import {
  ClaimResult,
  CheckResult,
  ConflictPair,
  EvidencePassage,
  SourceDoc,
} from "./types";
import {
  hasNegation,
  numbers,
  overlapScore,
  splitSentences,
  tokenSet,
} from "./textutil";

function bestMatch(claim: string, docs: SourceDoc[]) {
  const claimTokens = tokenSet(claim);
  let best: {
    doc: SourceDoc;
    span: { text: string; start: number; end: number };
    score: number;
  } | null = null;
  for (const doc of docs) {
    for (const span of splitSentences(doc.text)) {
      const score = overlapScore(claimTokens, tokenSet(span.text));
      if (!best || score > best.score) best = { doc, span, score };
    }
  }
  return best;
}

function contradicts(claim: string, evidence: string): boolean {
  const cn = numbers(claim);
  const en = numbers(evidence);
  if (cn.length > 0 && en.length > 0 && cn.join("|") !== en.join("|")) return true;
  if (hasNegation(claim) !== hasNegation(evidence)) return true;
  return false;
}

export function demoCheck(
  question: string,
  answer: string,
  docs: SourceDoc[]
): CheckResult {
  const warnings: string[] = [
    "Demo mode: verdicts come from a local heuristic stand-in, not the Clocked API. Connect a Clocked key for judged results.",
  ];

  // --- Verify (grounding) analogue -------------------------------------
  const claims: ClaimResult[] = splitSentences(answer).map((span) => {
    const match = bestMatch(span.text, docs);
    if (!match || match.score < 0.25) {
      return {
        claim: span.text,
        verdict: "unverifiable" as const,
        probability: match ? 1 - match.score : 0.9,
        evidence: [],
      };
    }
    const isContradiction = match.score >= 0.35 && contradicts(span.text, match.span.text);
    const supported = match.score >= 0.5 && !isContradiction;
    return {
      claim: span.text,
      verdict: isContradiction ? ("contradicted" as const) : supported ? ("supported" as const) : ("unverifiable" as const),
      probability: Math.round(match.score * 100) / 100,
      evidence: [
        {
          docId: match.doc.id,
          docTitle: match.doc.title,
          quote: match.span.text,
          start: match.span.start,
          end: match.span.end,
        },
      ],
    };
  });

  // --- Rerank analogue ---------------------------------------------------
  const qTokens = tokenSet(question);
  const passages: EvidencePassage[] = docs.map((doc) => {
    const chunks = splitSentences(doc.text);
    let bestScore = 0;
    let bestChunk = chunks[0]?.text ?? doc.text.slice(0, 240);
    for (const c of chunks) {
      const s = overlapScore(qTokens, tokenSet(c.text));
      if (s > bestScore) {
        bestScore = s;
        bestChunk = c.text;
      }
    }
    const docSpread = overlapScore(qTokens, tokenSet(doc.text));
    const documentScore = Math.max(bestScore, docSpread * 0.9);
    const action = bestScore >= 0.3 ? "use" : documentScore >= 0.25 ? "expand" : "skip";
    return {
      docId: doc.id,
      docTitle: doc.title,
      action: action as EvidencePassage["action"],
      reason: action === "skip" ? "unrelated" : undefined,
      relevance: Math.round(bestScore * 100) / 100,
      documentScore: Math.round(documentScore * 100) / 100,
      excerpt: bestChunk.length > 220 ? bestChunk.slice(0, 217) + "..." : bestChunk,
    };
  });
  passages.sort((a, b) => b.relevance - a.relevance);

  // --- Compare analogue --------------------------------------------------
  const conflicts: ConflictPair[] = [];
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const a = docs[i];
      const b = docs[j];
      let relation: ConflictPair["relation"] | null = null;
      let summary = "";
      let passageA = "";
      let passageB = "";
      let dupes = 0;
      let overlaps = 0;
      const aSents = splitSentences(a.text);
      const bSents = splitSentences(b.text);
      for (const sa of aSents) {
        const ta = tokenSet(sa.text);
        for (const sb of bSents) {
          const s = overlapScore(ta, tokenSet(sb.text));
          if (s > 0.8) {
            dupes++;
            if (!passageA) {
              passageA = sa.text;
              passageB = sb.text;
            }
          } else if (s > 0.45) {
            overlaps++;
            if (contradicts(sa.text, sb.text)) {
              relation = "conflict";
              summary = "These sources make opposing statements about the same fact.";
              passageA = sa.text;
              passageB = sb.text;
            } else if (!passageA) {
              passageA = sa.text;
              passageB = sb.text;
            }
          }
        }
      }
      if (!relation) {
        if (dupes > 0) {
          relation = "duplicate";
          summary = `${dupes} passage${dupes > 1 ? "s" : ""} appear in both sources nearly verbatim.`;
        } else if (overlaps > 0) {
          relation = "overlap";
          summary = `${overlaps} passage${overlaps > 1 ? "s" : ""} cover the same ground with different wording.`;
        }
      }
      if (relation) {
        conflicts.push({
          docA: { id: a.id, title: a.title },
          docB: { id: b.id, title: b.title },
          relation,
          summary,
          passageA: passageA.slice(0, 240),
          passageB: passageB.slice(0, 240),
        });
      }
    }
  }

  const supported = claims.filter((c) => c.verdict === "supported").length;
  const contradicted = claims.filter((c) => c.verdict === "contradicted").length;
  const unverifiable = claims.filter((c) => c.verdict === "unverifiable").length;
  const total = claims.length;
  const score = total === 0 ? 0 : Math.round(((supported + 0.5 * unverifiable) / total) * 100);

  return {
    mode: "demo",
    question,
    answer,
    overall: { score, supported, contradicted, unverifiable, total },
    claims,
    passages,
    conflicts,
    warnings,
  };
}
