import { demoCheck } from "./demo-engine";
import { extractPdfText } from "./pdf";
import { liveCheck } from "./clocked-live";
import { CheckResult, SourceDoc } from "./types";

export interface CheckInput {
  question: string;
  answer: string;
  documents: SourceDoc[];
}

const LIMITS = {
  question: 4000,
  answer: 40000,
  docs: 8,
  docText: 20000,
  docTitle: 500,
  totalText: 400000,
};

export async function validateInput(body: unknown): Promise<{ ok: true; input: CheckInput } | { ok: false; error: string }> {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Body must be a JSON object." };
  const b = body as Record<string, unknown>;
  const question = typeof b.question === "string" ? b.question.trim() : "";
  const answer = typeof b.answer === "string" ? b.answer.trim() : "";
  if (!question) return { ok: false, error: "A question is required." };
  if (question.length > LIMITS.question) return { ok: false, error: `Question must be under ${LIMITS.question} characters.` };
  if (!answer) return { ok: false, error: "An answer to check is required." };
  if (answer.length > LIMITS.answer) return { ok: false, error: `Answer must be under ${LIMITS.answer} characters.` };
  if (!Array.isArray(b.documents) || b.documents.length === 0)
    return { ok: false, error: "Add at least one source document." };
  if (b.documents.length > LIMITS.docs) return { ok: false, error: `At most ${LIMITS.docs} source documents.` };
  let total = 0;
  const documents: SourceDoc[] = [];
  for (let i = 0; i < b.documents.length; i++) {
    const d = b.documents[i] as Record<string, unknown>;
    let text = typeof d?.text === "string" ? d.text.trim() : "";
    const pdfBase64 = typeof d?.pdfBase64 === "string" && d.pdfBase64.length > 0 ? d.pdfBase64 : undefined;
    const pdfName = typeof d?.pdfName === "string" ? d.pdfName.slice(0, 200) : undefined;
    let title = typeof d?.title === "string" && d.title.trim() ? d.title.trim().slice(0, LIMITS.docTitle) : "";
    if (!text && pdfBase64) {
      try {
        text = await extractPdfText(pdfBase64);
      } catch (e) {
        return { ok: false, error: `Source ${i + 1}: ${(e as Error).message || "could not read that PDF."}` };
      }
    }
    if (!title) title = pdfName ? pdfName.replace(/\.pdf$/i, "") : `Source ${i + 1}`;
    if (!text) return { ok: false, error: `Source ${i + 1} is empty - paste text or upload a readable PDF.` };
    if (text.length > LIMITS.docText) return { ok: false, error: `Source ${i + 1} must be under ${LIMITS.docText} characters.` };
    total += text.length;
    documents.push({ id: `doc${i}`, title, text, pdfBase64, pdfName });
  }
  if (total > LIMITS.totalText) return { ok: false, error: "Sources together are too large." };
  return { ok: true, input: { question, answer, documents } };
}

export async function runCheck(input: CheckInput): Promise<CheckResult> {
  if (process.env.CLOCKED_API_KEY) {
    return liveCheck(input.question, input.answer, input.documents);
  }
  return demoCheck(input.question, input.answer, input.documents);
}
