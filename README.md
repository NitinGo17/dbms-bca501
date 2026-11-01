# BCA-501 Introduction to DBMS — retrieval practice

A single-page, offline-capable study tool for **C.C.S. University, Meerut — B.C.A. Semester V,
BCA-501 Introduction to DBMS**, covering Units I, II, III, IV and VI.

It is built to the *Reel-Style Learning Platform SRS and SDD*: a syllabus-bounded,
retrieval-first product in which roughly thirty per cent of a student's time goes into
consuming content and seventy per cent into producing answers.

Live at **https://nitingo17.github.io/dbms-bca501/**

---

## What is in it

| | |
|---|---|
| Units mapped | I Introduction · II E-R Modelling · III File Organisation · IV Relational Model and SQL · VI Normalisation, Transactions and Security |
| Unit V | Deliberately absent from the syllabus map, so no practice set can reach it |
| Chunks | 26, each a five-part beat script |
| Prediction gates | 26 — one per chunk, exactly one correct option, each option explained |
| Rubric-backed items | 78 — at least three per chunk, every criterion carrying a misconception tag |
| Verified exam papers | 3 — Dec 2023, Dec 2024, Dec 2025, transcribed from the papers themselves (39 questions, 75 marks, 180 minutes each) |

## The rules it enforces

1. **Problem first.** Every chunk runs problem → why the obvious fix fails → prediction gate →
   mechanism → cost. The gate sits *before* the mechanism and cannot be passed by scrolling.
2. **Effort-gated progression.** Chunk *n+1* stays locked until chunk *n*'s exit check is passed.
   A failure replays the single beat that carried the missed idea, not the whole chunk.
3. **Bounded retrieval.** A unit's retrieval set draws only from that unit, with at least 30%
   interleaved from units already studied.
4. **Spacing that means something.** Misses re-queue at roughly 1, 3 and 10 days. Nothing is
   mastered, and no mistake entry resolves, on a pass given less than seven days after the miss.
5. **Confidence before grade.** Confidence is captured after submission and before the mark
   scheme is revealed. Over-confidence in a unit raises its review frequency.
6. **A visible ranking.** Mistake priority is recurrence × exam weight × recency, and all three
   factors are displayed so the order can be argued with.
7. **Exam mode is a lockdown.** Verified paper, real clock, marks-per-minute budget, no hints and
   no feedback until submission, then a diagnostic report of marks by unit and time per question.

## Running it

No build step, no dependencies, no server-side anything.

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

ES modules require an HTTP origin; opening `index.html` from the filesystem will not work.

## Architecture

```
index.html                      shell, landmarks, metadata, JSON-LD
assets/css/app.css              design system as tokens, then components
assets/js/app.js                router, views, event wiring — no teaching copy
assets/js/engine.js             pure functions: grading, spacing, mistakes, calibration, exam report
assets/js/content.js            the content store's public surface + publish gate
assets/js/store.js              versioned localStorage persistence, export
assets/js/figures.js            renderer for the six documented figure primitives
assets/js/data/units.js         the syllabus map — the single source of scope
assets/js/data/concepts-*.js    beat scripts, gates and rubric items
assets/js/data/papers.js        the three verified papers and their mark schemes
tools/test-engine.mjs           engine and content tests
```

The client holds no teaching content of its own: a corrected mark scheme or a reworded beat is a
data change, never a code change.

### Data model

```
concept   id, unit, title, syllabusTag, hook, beats[], gate, items[]
beat      kind (problem|failure|mechanism|cost), text, figure?
figure    one of compare | flow | table | tree | layers | code
gate      id, prompt, options[{text, correct, why}]
item      id, kind (exit|practice), marks, prompt, rubric[{label, marks, tag, beat}], model
paper     id, year, source, totalMarks, durationMinutes, sections[questions[rubric]]

state (browser)   attempts[], gates[], concepts{}, mistakes[], exams[], settings{}
```

Scheduling state attaches to **concepts**, not items, so understanding a concept does not mean
re-answering five phrasings of it.

## Verification

```bash
node tools/test-engine.mjs      # 79 checks — engine rules and content integrity
node tools/test-dom.mjs        # 76 checks — the interactive paths, driven through linkedom
node tools/test-a11y.mjs       # 109 checks — per-view structure, labelling, token contrast
npx html-validate index.html    # the document validates
```

All four pass. The suites assert the acceptance criteria rather than describing them: the gate
withholds the mechanism, a fail leaves the chunk in check-pending, a pass unlocks the next one,
a same-day retry resolves nothing, an eight-day pass resolves, a verdict is withheld below the
sample threshold, a question over its time budget is flagged, and the exam report is a diagnostic
rather than a score.

Performance, measured not asserted: **394 KB raw / 94 KB gzip** for the whole application,
**zero third-party requests**, no web fonts, no images, no analytics. Budget: LCP under 1.5 s on a
mid-range phone over 4G, CLS 0, INP under 100 ms.

## Where it departs from the specification

Each of these is a decision, not an omission, and each is stated in the app's own *How this works*
page rather than only here.

- **Grading is self-marked.** FR-4 specifies a model call constrained to the item's rubric. There is
  no model key in this build, so the rubric is shown and the student marks against it. The required
  order is preserved — answer, then confidence, then the scheme, then the model answer — and every
  graded item offers a dispute action. The interface says plainly that the judgement is the
  student's.
- **No voice answers.** FR-4's transcript-before-grading rule needs a speech path and a transcript
  editor. Typed answers only, so that rule is not exercised.
- **Single user, local only.** All state is in this browser's storage. No account, no server, no
  transmission of anything typed. Clearing site data deletes the history, so the mistake log
  exports to CSV.
- **Time per question is approximate.** It is attributed from typing activity, so thinking done
  before the first keystroke is not counted. The report labels it as an approximation.
- **One transcription caveat.** Dec 2024 Q6's ER diagram has cardinality marks that are not legible
  in the copy held. The question states both cases and requires the answer to say which applies —
  which is also what its mark scheme asks for.

## Content and sources

Scope from the C.C.S. University B.C.A. Semester V syllabus for BCA-501. Exam mode uses the
question papers of Dec 2023, Dec 2024 and Dec 2025 held in the syllabus collection, transcribed
verbatim. **Every mark scheme here is written for this platform against the wording of each
question. None is an official university scheme, and no grade on this site is attributable to an
examiner.**

Unit weights are derived from how often each unit was examined across those three papers; the
count is shown beside each weight so the arithmetic can be checked.
