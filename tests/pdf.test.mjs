import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractPdfText } from "../lib/pdf.ts";

test("extracts text from a real PDF", async () => {
  const b64 = readFileSync("/tmp/sample.pdf").toString("base64");
  const text = await extractPdfText(b64);
  assert.ok(text.includes("Refunds are paid within 5 working days"), `got: ${text}`);
});
