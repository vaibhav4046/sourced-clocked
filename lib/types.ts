export interface SourceDoc {
  id: string;
  title: string;
  text: string;
  pdfBase64?: string;
  pdfName?: string;
}

export type ClaimVerdict = "supported" | "contradicted" | "unverifiable";

export interface ClaimResult {
  claim: string;
  verdict: ClaimVerdict;
  probability: number;
  evidence: { docId: string; docTitle: string; quote: string; start?: number; end?: number }[];
}

export interface EvidencePassage {
  docId: string;
  docTitle: string;
  action: "use" | "expand" | "skip";
  reason?: string;
  relevance: number;
  documentScore: number;
  excerpt: string;
}

export interface ConflictPair {
  docA: { id: string; title: string };
  docB: { id: string; title: string };
  relation: "duplicate" | "overlap" | "conflict";
  summary: string;
  passageA: string;
  passageB: string;
}

export interface CheckResult {
  mode: "live" | "demo";
  question: string;
  answer: string;
  overall: { score: number; supported: number; contradicted: number; unverifiable: number; total: number };
  claims: ClaimResult[];
  passages: EvidencePassage[];
  conflicts: ConflictPair[];
  credits?: { total: number; perCall: Record<string, number | null> };
  markedPdfs?: { docId: string; title: string; base64: string }[];
  warnings: string[];
}
