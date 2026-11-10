import { test } from "node:test";
import assert from "node:assert/strict";
import { mapClaims, mapPassages, mapConflicts, mapVerdict } from "../lib/clocked-live.ts";

const docs = [
  { id: "doc0", title: "Policy A", text: "Customers may return unused items within 30 days of delivery." },
  { id: "doc1", title: "Policy B", text: "Gift cards are never refundable." },
];

test("mapVerdict understands common shapes", () => {
  assert.equal(mapVerdict({ verdict: "supported" }), "supported");
  assert.equal(mapVerdict({ verdict: "CONTRADICTED" }), "contradicted");
  assert.equal(mapVerdict({ grounded: true }), "supported");
  assert.equal(mapVerdict({ grounded: false }), "unverifiable");
  assert.equal(mapVerdict({}), "unverifiable");
});

test("mapClaims maps verdicts, probabilities and doc-indexed evidence", () => {
  const data = {
    claims: [
      {
        claim: "Unused items can be returned within 30 days.",
        verdict: "supported",
        probability: 0.97,
        evidence: [{ document: 0, quote: "return unused items within 30 days", start: 16, end: 52 }],
      },
      { claim: "Gift cards can be refunded.", grounded: false },
    ],
  };
  const out = mapClaims(data, docs);
  assert.equal(out.length, 2);
  assert.equal(out[0].verdict, "supported");
  assert.equal(out[0].evidence[0].docId, "doc0");
  assert.equal(out[0].evidence[0].docTitle, "Policy A");
  assert.equal(out[1].verdict, "unverifiable");
});

test("mapClaims survives a missing claims array", () => {
  assert.deepEqual(mapClaims({}, docs), []);
});

test("mapPassages joins results back to documents by index", () => {
  const data = {
    results: [
      { index: 1, id: "doc1", action: "skip", reason: "unrelated", relevance_score: 0.05, document_score: 0.2 },
      { index: 0, id: "doc0", action: "use", relevance_score: 0.9, document_score: 0.9 },
    ],
  };
  const out = mapPassages(data, docs);
  assert.equal(out[0].docTitle, "Policy B");
  assert.equal(out[0].action, "skip");
  assert.equal(out[1].docTitle, "Policy A");
  assert.equal(out[1].relevance, 0.9);
});

test("mapConflicts keeps conflicts/duplicates/overlaps and drops unrelated", () => {
  const data = {
    pairs: [
      { verdict: "conflict", a: 0, b: 1, summary: "Disagree on refunds", passage_a: "x", passage_b: "y" },
      { verdict: "unrelated", a: 0, b: 1 },
    ],
  };
  const out = mapConflicts(data, docs);
  assert.equal(out.length, 1);
  assert.equal(out[0].relation, "conflict");
  assert.equal(out[0].docA.title, "Policy A");
});
