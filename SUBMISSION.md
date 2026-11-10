# Submission materials (PRIVATE DRAFT - nothing submitted; submission is gated)

## Project name
Sourced

## Overview (entry form)
Is that answer true? Ask your sources. Sourced checks any answer - from an AI chat, a colleague,
a website - against the documents it should have come from. Paste the question, the answer, and
your source documents (text or PDF). Sourced returns claim-by-claim verdicts with the exact
passages behind each call, ranks the evidence for the question, and shows where your sources
disagree with each other.

Who it is for: anyone who pastes AI answers into work that matters - students checking against
course materials, support teams checking macros against policy, analysts checking briefs against
source documents.

The problem: chat answers read as confident whether or not a source backs them. Checking them by
hand means re-reading every document. Sourced turns "trust me" into a verdict with citations.

## How Clocked is used (entry form)
All three Verify-group endpoints shape what the application does:

- **Verify (/grounding)** is the core: the answer is checked claim by claim against the supplied
  documents. Each claim's verdict and evidence spans drive the score, the claim cards, and the
  annotated answer view. Removing it removes the product.
- **Rerank (/rerank)** decides which sources matter: each document is ranked use / read-more /
  skip with relevance and document scores, so the user sees where the answer should have come
  from - including when the right document exists but the answer is elsewhere in it.
- **Compare (/compare)** checks the sources against each other: duplicates, overlap, and
  conflicts are surfaced as a "where your sources disagree" panel, because a verified answer is
  only as good as the documents behind it.

## Handling uncertain results, missing information, failed requests
- Claims with no supporting passage are marked unverifiable - never silently dropped.
- Failed API calls surface as explicit UI states (rate limit, exhausted credits, rejected key,
  generic failure); the app never fabricates a verdict.
- Without a key, the app runs in a clearly labelled demo mode on a local heuristic stand-in;
  demo results are marked illustrative everywhere they appear. A live failure never falls back
  to heuristic output.
- Credits used per check are displayed in live mode.

## Demo plan
Live app link (deployment pending release approval) plus the rail-travel sample built into the
UI: one click loads a question, a three-source corpus, and an answer containing a supported
claim, a contradicted claim (wrong number), and an unverifiable claim - every verdict type in
one run.

## Award categories
Best Overall App; Best Use of Verify, Compare, or Rerank.
(People's Choice skipped - requires a LinkedIn post the entrant cannot currently make.)

## Team
[held - entrant name/email/GitHub confirmed at submission time]
