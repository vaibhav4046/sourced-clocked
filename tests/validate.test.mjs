import { test } from "node:test";
import assert from "node:assert/strict";
import { validateInput } from "../lib/check.ts";

test("rejects missing question", async () => {
  const r = await validateInput({ answer: "a", documents: [{ text: "t" }] });
  assert.equal(r.ok, false);
});

test("rejects empty documents", async () => {
  const r = await validateInput({ question: "q", answer: "a", documents: [] });
  assert.equal(r.ok, false);
});

test("rejects oversized question", async () => {
  const r = await validateInput({ question: "x".repeat(4001), answer: "a", documents: [{ text: "t" }] });
  assert.equal(r.ok, false);
});

test("accepts a valid payload and assigns ids/titles", async () => {
  const r = await validateInput({ question: "q", answer: "a", documents: [{ text: "hello world" }] });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.input.documents[0].id, "doc0");
    assert.equal(r.input.documents[0].title, "Source 1");
  }
});
