# Sourced

**Is that answer true? Ask your sources.**

Sourced checks any answer - from an AI chat, a colleague, a website - against the documents it
should have come from. Paste the question, the answer, and your source documents. Sourced returns:

- **Claim-by-claim verdicts** - every claim marked supported, contradicted, or unverifiable,
  with the exact source passage behind the call.
- **Evidence, ranked** - which passage answers the question, which document is worth reading
  further, and which to skip.
- **Source conflicts** - where your own documents duplicate, overlap, or flatly disagree.

Built for the [Clocked Build Challenge](https://clocked.rezolve.ai/challenge).

## How Clocked is used

Sourced is built around the three Verify-group endpoints, and each one changes what the app shows:

| Clocked endpoint | Role in Sourced |
| --- | --- |
| **Verify** (`/grounding`) | The core: the answer is checked claim by claim against the supplied documents. Verdicts and evidence spans drive the score ring, the claim cards, and the annotated answer. |
| **Rerank** (`/rerank`) | Decides which sources matter for the question: `use`, `expand`, or `skip`, with relevance and document scores shown as ranked evidence. |
| **Compare** (`/compare`) | Finds duplicates, overlap, and conflicts across the supplied documents, rendered as the "where your sources disagree" panel. |

A check is one fan-out of these three calls from the server route; the key never reaches the
browser. Failed or exhausted-credit responses surface as honest UI states, not silent mocks.

## Run it

```sh
npm install
CLOCKED_API_KEY=clk_... npm run dev   # live mode
npm run dev                           # demo mode: local heuristic stand-in, clearly labelled
npm test                              # engine + validation tests
npm run build && npm start            # production
```

Open http://localhost:3000. "Load the rail-travel sample" exercises every verdict type.

## Notes

- Demo mode exists so the product is reviewable without spending credits; the UI labels it
  everywhere it appears. Judged runs happen in live mode.
- Rate limit: 20 checks/hour/IP in the demo deployment.
- Sources stay in the request path only; nothing is logged or stored.
