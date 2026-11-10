// Live adapter: real Clocked API calls for the three Verify-group endpoints.
// Response mapping is deliberately defensive - the exact claim/pair field
// shapes get locked down after the first recorded live run.
import { Clocked } from "clocked-sdk";
import {
  ClaimResult,
  CheckResult,
  ConflictPair,
  EvidencePassage,
  SourceDoc,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function mapVerdict(raw: any): ClaimResult["verdict"] {
  const v = String(raw?.verdict ?? raw?.label ?? "").toLowerCase();
  if (v.includes("contrad") || v.includes("refut")) return "contradicted";
  if (v.includes("support") || v.includes("grounded") || v.includes("entail")) return "supported";
  if (typeof raw?.grounded === "boolean") return raw.grounded ? "supported" : "unverifiable";
  if (v.includes("conflict")) return "contradicted";
  return "unverifiable";
}

export function mapClaims(data: any, docs: SourceDoc[]): ClaimResult[] {
  const rawClaims: any[] = Array.isArray(data?.claims) ? data.claims : [];
  return rawClaims.map((c) => {
    const evRaw: any[] = Array.isArray(c?.evidence) ? c.evidence : c?.evidence ? [c.evidence] : [];
    const evidence = evRaw.map((e: any) => {
      const docIdx = typeof e?.document === "number" ? e.document : typeof e?.document_index === "number" ? e.document_index : undefined;
      const doc = docIdx !== undefined ? docs[docIdx] : docs.find((d) => d.id === String(e?.document ?? ""));
      return {
        docId: doc?.id ?? String(e?.document ?? ""),
        docTitle: doc?.title ?? (docIdx !== undefined ? `Source ${docIdx + 1}` : "Source"),
        quote: String(e?.quote ?? e?.text ?? e?.span ?? ""),
        start: typeof e?.start === "number" ? e.start : undefined,
        end: typeof e?.end === "number" ? e.end : undefined,
      };
    }).filter((e) => e.quote.length > 0);
    return {
      claim: String(c?.claim ?? c?.text ?? ""),
      verdict: mapVerdict(c),
      probability: typeof c?.supported === "number" ? c.supported : typeof c?.probability === "number" ? c.probability : typeof c?.confidence === "number" ? c.confidence : 0,
      evidence,
    };
  });
}

export function mapPassages(data: any, docs: SourceDoc[]): EvidencePassage[] {
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  return results.map((r) => {
    const doc = typeof r?.index === "number" ? docs[r.index] : docs.find((d) => d.id === r?.id);
    const text = doc?.text ?? "";
    return {
      docId: doc?.id ?? String(r?.id ?? r?.index ?? ""),
      docTitle: doc?.title ?? `Source ${(r?.index ?? 0) + 1}`,
      action: (r?.action ?? "skip") as EvidencePassage["action"],
      reason: r?.reason,
      relevance: typeof r?.relevance_score === "number" ? r.relevance_score : 0,
      documentScore: typeof r?.document_score === "number" ? r.document_score : 0,
      excerpt: text.length > 220 ? text.slice(0, 217) + "..." : text,
    };
  });
}

export function mapConflicts(data: any, docs: SourceDoc[]): ConflictPair[] {
  const pairs: any[] = Array.isArray(data?.pairs) ? data.pairs : [];
  const out: ConflictPair[] = [];
  const byRef = (v: any): SourceDoc | undefined =>
    typeof v === "number" ? docs[v] : docs.find((d) => d.id === String(v ?? ""));
  for (const p of pairs) {
    const rel = String(p?.verdict ?? p?.relation ?? "").toLowerCase();
    if (!rel || rel === "unrelated" || rel === "distinct" || rel === "clean") continue;
    const a = byRef(p?.a ?? p?.first);
    const b = byRef(p?.b ?? p?.second);
    if (!a || !b) continue;
    const detail = [p?.conflicts, p?.duplicates, p?.overlaps]
      .flatMap((list: any) => (Array.isArray(list) ? list : []))
      .find((d: any) => d && typeof d === "object") as any;
    out.push({
      docA: { id: a.id, title: a.title },
      docB: { id: b.id, title: b.title },
      relation: rel.includes("conflict") ? "conflict" : rel.includes("same") || rel.includes("dup") ? "duplicate" : "overlap",
      summary: String(p?.summary ?? p?.explanation ?? detail?.summary ?? detail?.explanation ?? ""),
      passageA: String(p?.passage_a ?? p?.a_text ?? detail?.passage_a ?? detail?.a_text ?? detail?.quote_a ?? ""),
      passageB: String(p?.passage_b ?? p?.b_text ?? detail?.passage_b ?? detail?.b_text ?? detail?.quote_b ?? ""),
    });
  }
  return out;
}

export async function liveCheck(
  question: string,
  answer: string,
  docs: SourceDoc[]
): Promise<CheckResult> {
  const clocked = new Clocked();
  const [rerankRes, groundingRes, compareRes] = await Promise.all([
    clocked.rerank({
      query: question,
      documents: docs.map((d) => ({ id: d.id, title: d.title, text: d.text })),
    }),
    clocked.grounding({
      documents: docs.map((d) => ({ id: d.id, text: d.text })),
      question,
      answer,
      evidence: "all",
    }),
    docs.length > 1
      ? clocked.compare({ documents: docs.map((d) => ({ id: d.id, text: d.text })) })
      : Promise.resolve(null),
  ]);
  // grounding gets id-tagged documents, the question for relevance, and evidence
  // passages for every claim (locked down against the live API 10 Nov 2026).

  const claims = mapClaims(groundingRes.data, docs);
  const passages = mapPassages(rerankRes.data, docs);
  const conflicts = compareRes ? mapConflicts(compareRes.data, docs) : [];

  const supported = claims.filter((c) => c.verdict === "supported").length;
  const contradicted = claims.filter((c) => c.verdict === "contradicted").length;
  const unverifiable = claims.filter((c) => c.verdict === "unverifiable").length;
  const total = claims.length;
  const score = total === 0 ? 0 : Math.round(((supported + 0.5 * unverifiable) / total) * 100);

  const perCall: Record<string, number | null> = {
    rerank: rerankRes.credits ?? null,
    grounding: groundingRes.credits ?? null,
    compare: compareRes ? compareRes.credits ?? null : null,
  };
  const creditValues = Object.values(perCall).filter((v): v is number => typeof v === "number");

  return {
    mode: "live",
    question,
    answer,
    overall: { score, supported, contradicted, unverifiable, total },
    claims,
    passages,
    conflicts,
    credits: creditValues.length
      ? { total: creditValues.reduce((a, b) => a + b, 0), perCall }
      : undefined,
    warnings: [],
  };
}
