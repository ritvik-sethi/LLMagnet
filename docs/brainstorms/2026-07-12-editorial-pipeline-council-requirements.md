---
date: 2026-07-12
topic: editorial-pipeline-council
---

# Editorial Pipeline + Reader-vs-Machine Council — Requirements

## Summary

Turn the six standalone SEO tools into one guided editorial pipeline where a reporter's single persistent draft flows through every tool, and each tool renders its output as a two-voice debate — **The Reader** (human clarity, story, trust) vs. **The Machine** (what LLMs parse and cite). Underlying GPT-4 prompts are rewritten leaner so running both voices everywhere stays fast and affordable. Framed for a newsroom covering Indian startups, tuned to earn LLM citations, not just Google rankings.

---

## Problem Frame

Today the six tools are functional but disconnected. Redux holds six isolated per-feature slices with no shared "article the reporter is working on"; handoffs are ad-hoc, one-directional, and hacky — Query Optimizer, Trends, and Semantic Score push whole articles into Rewrite through URL query params (`router.push('/rewrite-for-llm?content=...')`), Competitor Gap does a content-less jump, and Content Score is wired to nothing. In practice a reporter copy-pastes one draft into six separate tabs and manually stitches the advice together.

That disconnection is also the missed opportunity. The product's whole thesis is engineering discoverability for LLM-driven search — but nothing in the current app dramatizes the core tension every newsroom now faces: writing for a human reader vs. writing for the machines that cite you. Connecting the tools into one pipeline and staging that tension as a two-voice council turns a tool collection into a single, demonstrable story.

---

## Key Decisions

- **Glue over depth.** Effort goes into connecting the six tools into one workflow, not deepening each tool individually or baking in India-specific domain data. The pipeline is the differentiator.
- **Guided linear pipeline over free-roam hub.** A visible stage progression gives a clean before→after arc, which is the strongest asset for a live/recorded hackathon demo, over the flexibility of running tools in any order.
- **Council runs in every tool, not as a single dedicated stage.** Every tool's output is a two-voice debate. This is richer and keeps the theme visible throughout, accepting the cost of doubled model calls and dual-output UI in all six tools.
- **The two voices are The Reader vs. The Machine.** The pairing directly dramatizes the human-search vs. LLM-discovery thesis, rather than a generic bull/bear or optimizer/editor split.
- **Both voices live by default.** Every tool shows both voices on every run; a lighter on-demand/cached second voice is a fallback only if demo latency or cost forces it (deferred to planning).
- **Prompts get leaner, not just better.** Because the council doubles call volume, prompt efficiency is a first-class requirement, not incidental polish.

---

## Actors

- A1. **Reporter / editor** — the human user, working one article at a time; the newsroom persona covering Indian startups.
- A2. **The Reader** — council agent arguing for the human audience: clarity, narrative, trust, readability.
- A3. **The Machine** — council agent arguing for LLM consumption: structure, entities, extractable facts, citability.

---

## Key Flows

- F1. Optimize an existing draft (primary demo flow)
  - **Trigger:** Reporter pastes a finished or in-progress article into the pipeline.
  - **Actors:** A1, A2, A3
  - **Steps:** Draft enters the shared store → reporter walks the stages (Score → Target queries → Rewrite) → each tool shows Reader and Machine takes → reporter applies changes, which write back to the shared draft → re-score at the end shows the citability score climb.
  - **Covered by:** R1, R2, R3, R5, R6, R7

- F2. Discovery-first (secondary flow)
  - **Trigger:** Reporter starts with no draft, from a Trend or a competitor gap.
  - **Actors:** A1, A2, A3
  - **Steps:** Reporter picks a topic/angle from Trends or Competitor Gap → drafts against it → joins the same pipeline as F1 from the scoring stage onward.
  - **Covered by:** R2, R4

---

## Requirements

### Shared draft & pipeline spine

- R1. One persistent working draft is the shared object all six tools read from and write to, replacing the URL-param handoff.
- R2. A pipeline/progress UI walks the reporter through stages in order: Discover (Trends / Competitor Gap) → Score (Content + Semantic) → Target (Query Optimizer) → Rewrite → re-score.
- R3. A single citability score is visible across the pipeline and updates as the draft improves; after Rewrite the reporter re-scores and the number visibly moves.
- R4. Primary entry is pasting an existing draft; a lighter discovery-first entry (start from a Trend or gap, then draft) is also supported.
- R5. Each tool writes its applied changes back to the shared draft so later stages operate on the latest content, not the original paste.

### Two-voice council (Reader vs. Machine)

- R6. Every one of the six tools renders its output as two distinct voices: The Reader and The Machine.
- R7. Each voice gives its own take; where they disagree, the tool surfaces the tension and a single reconciled action the reporter can act on.
- R8. The two voices are visually distinct and labeled consistently across all six tools.

### Prompt efficiency

- R9. The six GPT-4 prompts are rewritten to be leaner (fewer tokens per call) while preserving or improving output quality, to offset the council's doubled call volume.
- R10. A tool's two voice calls run without making the tool feel slow (e.g., the two calls run concurrently).

### Newsroom framing

- R11. Copy, examples, and defaults are framed for a reporter at a newsroom covering Indian startups (article-shaped content, funding/company stories), without hard-coding India-specific entity data.

---

## Acceptance Examples

- AE1. Voices disagree
  - **Covers R7.**
  - **Given** a draft where a change would boost citability but hurt readability,
  - **When** a tool runs the council,
  - **Then** The Reader and The Machine show opposing takes and the tool presents one reconciled action, not two unresolved lists.

- AE2. Score moves after rewrite
  - **Covers R3, R5.**
  - **Given** a scored draft the reporter then rewrites,
  - **When** they re-score,
  - **Then** the citability score reflects the rewritten content and visibly changes from the pre-rewrite value.

- AE3. Later stage sees latest content
  - **Covers R1, R5.**
  - **Given** the reporter applied a Rewrite suggestion,
  - **When** they move to any later or repeated stage,
  - **Then** that stage operates on the updated draft, not the originally pasted text.

---

## Success Criteria

- A reporter can paste one draft and walk it through all six tools end-to-end, in one sitting, with zero copy-paste between tools.
- Both voices are visible in every tool, consistently labeled.
- The citability score demonstrably climbs across a single article's pass through the pipeline.
- Per-call prompt token count is reduced versus the current prompts, and a two-voice tool response feels responsive (voices run concurrently).

---

## Scope Boundaries

Deferred for later:

- Deep India domain data — company/sector recognition, comparing against other Indian business coverage.
- Full inline "Grammarly-style" single-editor surface (the ambient-tools approach).
- Auth, multi-user, and backend persistence of drafts beyond what the demo needs.
- New features beyond the existing six.

---

## Dependencies / Assumptions

- Existing OpenAI API routes under `app/api/` (currently `gpt-4-turbo-preview`) back all six tools; the council and prompt work build on these, not a new provider.
- Assumes the shared draft can persist client-side (existing Redux store, optionally localStorage) for the demo; no backend storage is required.
- Hackathon constraint (late submission, limited chances) caps scope to glue + council + prompt trimming, reusing the six existing pages and API routes rather than rebuilding them.

---

## Outstanding Questions

Resolve before planning:

- None blocking. Both-voices-live-by-default is decided (see Key Decisions); its latency/cost fallback is a planning concern below.

Deferred to planning:

- Whether the two voices share one prompt that returns two perspectives or run as two separate prompts/calls.
- The persistence mechanism for the shared draft (Redux slice vs. localStorage vs. both).
- How the single citability score is computed and aggregated across the tools.
- The council latency/cost fallback if both-voices-live proves too slow or expensive live (on-demand or cached second voice).
