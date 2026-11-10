import { test } from "node:test";
import assert from "node:assert/strict";
import { demoCheck } from "../lib/demo-engine.ts";

const docs = [
  {
    id: "doc0",
    title: "Refund policy",
    text: "Customers may return unused items within 30 days of delivery. Used items cannot be returned. Refunds are paid to the original payment method within 5 working days.",
  },
  {
    id: "doc1",
    title: "Help centre",
    text: "You can return any unused product within 30 days after it arrives. Gift cards are never refundable.",
  },
];

test("supported paraphrase is marked supported with evidence", () => {
  const r = demoCheck(
    "How long do I have to return an unused item?",
    "Unused items can be returned within 30 days after delivery.",
    docs
  );
  assert.equal(r.mode, "demo");
  assert.equal(r.claims.length, 1);
  assert.equal(r.claims[0].verdict, "supported");
  assert.ok(r.claims[0].evidence.length >= 1);
  assert.ok(r.overall.supported === 1);
});

test("contradicting number is flagged", () => {
  const r = demoCheck(
    "How long do I have to return an unused item?",
    "Unused items can be returned within 90 days of delivery.",
    docs
  );
  assert.equal(r.claims[0].verdict, "contradicted");
});

test("claim absent from sources is unverifiable", () => {
  const r = demoCheck(
    "What is the return window?",
    "The company was founded in 1998 in Helsinki.",
    docs
  );
  assert.equal(r.claims[0].verdict, "unverifiable");
});

test("rerank marks relevant doc as use", () => {
  const r = demoCheck(
    "Can I return a used item?",
    "Used items cannot be returned.",
    docs
  );
  const top = r.passages[0];
  assert.equal(top.action, "use");
  assert.ok(top.relevance > 0);
});

test("compare flags overlapping paraphrases across sources", () => {
  const r = demoCheck("q", "Unused items can be returned within 30 days.", docs);
  const pair = r.conflicts.find((c) => c.relation === "overlap");
  assert.ok(pair, "expected an overlap pair between the two policies");
});

test("compare catches near-verbatim duplicates", () => {
  const dupeDocs = [
    { id: "a", title: "A", text: "Unused items can be returned within 30 days of delivery." },
    { id: "b", title: "B", text: "Unused items can be returned within 30 days of delivery!" },
  ];
  const r = demoCheck("q", "Anything.", dupeDocs);
  assert.ok(r.conflicts.some((c) => c.relation === "duplicate"));
});

test("compare catches a conflict", () => {
  const conflictDocs = [
    { id: "a", title: "A", text: "Visitors must sign in at the front desk at all times." },
    { id: "b", title: "B", text: "Visitors must not sign in at the front desk at any time." },
  ];
  const r = demoCheck("Do visitors sign in?", "Visitors must sign in.", conflictDocs);
  assert.ok(r.conflicts.some((c) => c.relation === "conflict"));
});

test("no-overlap question ranks every source skip", () => {
  const r = demoCheck(
    "What is the capital of Norway?",
    "Oslo is the capital of Norway.",
    docs
  );
  assert.ok(r.passages.every((p) => p.action === "skip"));
});

test("a single source never produces conflict pairs", () => {
  const r = demoCheck("q", "Unused items can be returned within 30 days.", [docs[0]]);
  assert.equal(r.conflicts.length, 0);
});

test("weak-but-relevant document lands on expand, not use", () => {
  const weakDocs = [
    { id: "a", title: "A", text: "Our railway runs regional and high-speed services across the country, with luggage allowances for all passengers." },
    { id: "b", title: "B", text: "Folding bikes travel free as hand luggage when folded and in a cover or bag." },
  ];
  const r = demoCheck("Can I take my folding bike?", "Yes, folded and covered bikes travel free.", weakDocs);
  const a = r.passages.find((p) => p.docId === "a");
  const b = r.passages.find((p) => p.docId === "b");
  assert.equal(b.action, "use");
  assert.ok(a.action === "expand" || a.action === "skip");
});
