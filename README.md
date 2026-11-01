# The Exam Cell — a survival sim over BCA-501

You are the new database administrator at a university examination cell. Twenty-six
tickets are open across five floors. Each one is a real fault in the college's
records, and each one is a chunk of the syllabus. Fail a shift and the manager
comes down the aisle.

Live at **https://nitingo17.github.io/dbms-bca501/**

Built to the *Reel-Style Learning Platform SRS and SDD* — a syllabus-bounded,
retrieval-first product — and wrapped in a workplace sim so that the retrieval
has stakes.

---

## The loop

| | |
|---|---|
| Floors | 1 Exam Cell · 2 Records Office · 3 Server Room · 4 Query Desk · 5 The Vault |
| Shifts | 26, one per chunk of the syllabus (Unit V is not on the map) |
| Tickets | 26, each with a reporter, a deadline, a stake and a toolset |
| Gates | 26 — the manager asks before the fix is revealed |
| Rubric items | 78 — at least three per ticket, every criterion tagged |
| Audit days | 3 — the verified papers of Dec 2023, 2024 and 2025 |

**Standing (HP)** starts at 100. Failing a shift costs 9 HP on shift 1 and 34 HP on
shift 26 — the run gets more brutal as it goes. Clearing a shift restores a little;
a delayed pass restores more. At zero the manager walks down the aisle, the
first-person failure sequence plays, and the run ends.

**Death is not deletion.** Starting a new shift resets standing and the floor map.
Attempts, open incidents and readiness are kept, because a game death should not
destroy revision history.

**XP only for accuracy.** Nothing for time in the app and nothing for streaks — the
specification bans rewarding both, and a game that pays you for sitting still
teaches the wrong thing. A delayed pass doubles the XP.

**Audit day** is the real test: a verified paper, 75 marks, three hours, no
feedback until you submit, and the shortfall comes out of your HP. The report is a
diagnostic — marks by floor, time against the marks-per-minute budget, every
question left blank.

## The rules it still enforces

1. **Fault first.** Every ticket runs fault → why the obvious fix fails → the
   manager's question → the fix → what the fix costs.
2. **Effort-gated.** A ticket opens only when the previous one on that floor is
   cleared. A failed verification replays the single beat that carried the missed
   idea, not the whole ticket.
3. **Bounded retrieval.** A floor's retrieval set draws only from that floor, with
   at least 30% interleaved from floors already worked.
4. **Spacing that means something.** Misses re-queue at roughly 1, 3 and 10 days.
   Nothing is mastered, and no incident closes, on a pass less than seven days old.
5. **Confidence before the mark.** Captured after submission, before the scheme is
   shown. Over-confidence on a floor raises its review frequency.
6. **A visible ranking.** Incident priority is recurrence × exam weight × recency,
   all three displayed.

## Running it

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

No build step. ES modules need an HTTP origin; opening `index.html` from the
filesystem will not work.

## Architecture

```
index.html                     HUD, shell, scene host, metadata, JSON-LD
assets/css/app.css             dark design system as tokens, then components
assets/js/app.js               router, views, HUD, failure sequence, event wiring
assets/js/run.js               the run economy: damage, healing, XP, ranks, death
assets/js/engine.js            grading, spacing, incidents, calibration, exam report
assets/js/content.js           content store surface + publish gate
assets/js/store.js             versioned localStorage persistence
assets/js/figures.js           six figure primitives
assets/js/data/units.js        the syllabus map — the single source of scope
assets/js/data/cases.js        the 26 tickets, reporters, deadlines, boss lines
assets/js/data/office.js       the simulated colleagues and the office wire
assets/js/audio.js             synthesised sound — footsteps, heartbeat, flatline
assets/js/data/concepts-*.js   beat scripts, gates, rubric items
assets/js/data/papers.js       the three verified papers and mark schemes
tools/test-*.mjs               the three suites
```

Data model: `concept → beats[] → gate → items[] → rubric[]`, and separately
`case → ticket/reporter/deadline/stake/toolset/boss[]`. State in the browser is
`{attempts, gates, concepts, mistakes, exams, run}`.

## Verification

```bash
node tools/test-engine.mjs   # 79 — engine rules and content integrity
node tools/test-run.mjs      # 52 — damage, healing, XP, ranks, audit, death
node tools/test-dom.mjs      # 96 — the shift loop, HUD, threat card, corridor, card
node tools/test-a11y.mjs     # 112 — structure, labelling, token contrast
npx html-validate index.html # the document validates
```

All five pass. They assert the rules rather than describing them: the gate
withholds the fix, a failed verification costs exactly the shift's damage, zero
standing terminates the run, a new shift keeps the death count, a delayed pass
doubles XP, and the audit report is a diagnostic rather than a score.

Weight: **432 KB raw / 111 KB gzip**, zero third-party requests, no web fonts, no
images — the failure sequence and every figure is CSS and inline SVG.

## Where it departs from the specification

- **Grading is self-marked.** FR-4 specifies a model call constrained to the item's
  rubric. There is no model key in this build, so the rubric is shown and you mark
  against it. The required order is preserved — answer, confidence, scheme, model
  answer — and every graded item offers a dispute.
- **No voice answers.** Typed only, so the transcript-before-grading rule is not
  exercised.
- **Single user, local only.** Everything is in this browser. Export the incident
  log before clearing site data.
- **Time per question is approximate**, attributed from typing activity.
- **One transcription caveat.** Dec 2024 Q6's diagram has cardinality marks that
  are not legible in the copy held; the question states both cases and requires
  the answer to say which applies.

## Content and sources

Scope from the C.C.S. University B.C.A. Semester V syllabus for BCA-501. Audit days
use the question papers of Dec 2023, 2024 and 2025, transcribed from the papers
themselves. **Every mark scheme is written for this platform against the wording of
each question; none is an official university scheme, and no grade is attributable
to an examiner.** Unit weights derive from how often each unit was examined across
those three papers, and the count is shown beside each weight.
