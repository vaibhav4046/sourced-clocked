// Server-side PDF text extraction (pdf-parse v2, ESM API).
import { PDFParse } from "pdf-parse";

export function base64ToBuffer(b64: string): Buffer {
  const comma = b64.indexOf(",");
  return Buffer.from(comma >= 0 ? b64.slice(comma + 1) : b64, "base64");
}

export async function extractPdfText(b64: string): Promise<string> {
  const buf = base64ToBuffer(b64);
  if (buf.length > 2_500_000) throw new Error("PDF is too large (2.5 MB max).");
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const res = await parser.getText();
    return (res.text ?? "").replace(/\s+/g, " ").trim();
  } finally {
    await parser.destroy();
  }
}
