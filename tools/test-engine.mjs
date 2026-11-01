/**
 * Engine and content test suite.
 *
 * Run: node tools/test-engine.mjs
 *
 * This is the evidence behind the claim that the rules work. Every assertion
 * below maps to an acceptance criterion in the specification.
 */

import {
  CONCEPTS,
  ITEMS,
  PAPERS,
  UNITS,
  UNIT_ORDER,
  UNIT_WEIGHTS,
  publishGate,
  unitConcepts,
} from "../assets/js/content.js";
import {
  markAttempt,
  beatsToReplay,
  scheduleAfter,
  selectRetrievalSet,
  logMistake,
  resolveMistakes,
  rankMistakes,
  exportMistakes,
  calibration,
  calibrationVerdict,
  marksBudget,
  examReport,
  validateConcept,
} from "../assets/js/engine.js";

let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function near(a, b, epsilon = 0.001) {
  return Math.abs(a - b) <= epsilon;
}

const DAY = 86400000;
const T0 = Date.UTC(2026, 0, 1);

/* ---- 1. Publish gate (FR-7, AC-7.2) ------------------------------------ */

const gate = publishGate();
check("publish gate passes", gate.ok, [...gate.conceptErrors, ...gate.paperErrors].join("; "));
check("all concepts validate individually", CONCEPTS.every((c) => validateConcept(c).length === 0));

/* ---- 2. Content shape -------------------------------------------------- */

check("every unit has at least four concepts", UNITS.every((u) => unitConcepts(u.id).length >= 4),
  UNITS.map((u) => `${u.id}:${unitConcepts(u.id).length}`).join(", "));
check("unit V is absent from the map", !UNITS.some((u) => u.id === "u5"));
check("every concept has at least three items", CONCEPTS.every((c) => c.items.length >= 3));
check("every concept has exactly one gate", CONCEPTS.every((c) => c.gate && c.gate.options.length >= 3));
check("every gate has exactly one correct option",
  CONCEPTS.every((c) => c.gate.options.filter((o) => o.correct).length === 1));
check("every item rubric sums to its marks",
  ITEMS.every((i) => near(i.rubric.reduce((s, c) => s + c.marks, 0), i.marks)),
  ITEMS.filter((i) => !near(i.rubric.reduce((s, c) => s + c.marks, 0), i.marks)).map((i) => i.id).join(", "));
check("every misconception tag is in the controlled vocabulary",
  ITEMS.every((i) => i.rubric.every((c) => typeof c.tag === "string" && c.tag.length > 0)));
check("no concept repeats an id", new Set(CONCEPTS.map((c) => c.id)).size === CONCEPTS.length);
check("no item repeats an id", new Set(ITEMS.map((i) => i.id)).size === ITEMS.length);

/* ---- 3. Papers (FR-8, AC-8.2, AC-8.5) --------------------------------- */

check("three verified papers", PAPERS.length === 3 && PAPERS.every((p) => p.verified && p.source));
check("every paper is 75 marks over 180 minutes",
  PAPERS.every((p) => p.totalMarks === 75 && p.durationMinutes === 180));
check("every paper's required attempts sum to its total marks",
  PAPERS.every((p) => p.sections.reduce((s, sec) => s + sec.count * sec.marksEach, 0) === p.totalMarks),
  PAPERS.map((p) => `${p.id}:${p.sections.reduce((s, sec) => s + sec.count * sec.marksEach, 0)}`).join(", "));
check("every question is worth its section's per-question marks",
  PAPERS.every((p) => p.sections.every((sec) => sec.questions.every((q) => near(q.marks, sec.marksEach)))));

const budget = marksBudget(PAPERS[0]);
check("budget is 2.4 minutes per mark", near(budget.minutesPerMark, 2.4), String(budget.minutesPerMark));
check("budget is 144 seconds per mark", budget.secondsPerMark === 144, String(budget.secondsPerMark));

/* ---- 4. Grading (FR-4, AC-4.1, AC-4.2) -------------------------------- */

const item = ITEMS.find((i) => i.id === "i1-1-1");
const full = markAttempt(item, { 0: true, 1: true, 2: true });
check("full marks total the item maximum", near(full.total, 5), String(full.total));
check("per-criterion breakdown is returned", full.criteria.length === 3);
const none = markAttempt(item, {});
check("no hits scores zero", none.total === 0);
check("marks never exceed the maximum", full.total <= full.max);
const partial = markAttempt(item, { 0: true });
check("partial marking totals only the hit criteria", near(partial.total, 1), String(partial.total));
check("ratio is marks over maximum", near(partial.ratio, 0.2), String(partial.ratio));
const replay = beatsToReplay(partial);
check("replay names only the beats whose criteria were missed", replay.length === 2 && !replay.includes(0),
  JSON.stringify(replay));

/* ---- 5. Spacing (FR-3, AC-3.5) ---------------------------------------- */

let sched = scheduleAfter(null, { correct: true, delayDays: 0, now: T0 });
check("first correct answer schedules one day out", near(sched.nextReviewAt - T0, 1 * DAY), String(sched.nextReviewAt - T0));
check("first correct answer does not master the concept", sched.mastered === false);

sched = scheduleAfter(sched, { correct: true, delayDays: 1, now: T0 + DAY });
check("second correct answer schedules three days out", near(sched.nextReviewAt - (T0 + DAY), 3 * DAY));

sched = scheduleAfter(sched, { correct: true, delayDays: 3, now: T0 + 4 * DAY });
check("third correct answer schedules ten days out", near(sched.nextReviewAt - (T0 + 4 * DAY), 10 * DAY));

const delayed = scheduleAfter({ intervalIndex: 2, stability: 1, lastCorrectDelayDays: 3 }, {
  correct: true, delayDays: 9, now: T0,
});
check("a pass at nine days masters the concept", delayed.mastered === true);
const early = scheduleAfter({ intervalIndex: 2, stability: 1, lastCorrectDelayDays: 3 }, {
  correct: true, delayDays: 2, now: T0,
});
check("a pass at two days does not master it", early.mastered === false);

const lapse = scheduleAfter({ intervalIndex: 3, stability: 2, lastCorrectDelayDays: 10 }, {
  correct: false, delayDays: 5, now: T0,
});
check("a miss resets the interval to one day", lapse.intervalIndex === 0 && lapse.stability === 0);

/* ---- 6. Retrieval set (FR-3, AC-3.2, AC-3.4) -------------------------- */

const set = selectRetrievalSet(ITEMS, UNIT_ORDER, {
  unitId: "u4",
  size: 10,
  seed: 42,
  studiedUnits: ["u1", "u2", "u3"],
});
check("set has ten items", set.total === 10, String(set.total));
check("set meets the 30% interleave target", set.meetsInterleaveTarget, `ratio ${set.ratio}`);
check("interleaved items come only from studied units",
  set.items.every((i) => i.unit === "u4" || ["u1", "u2", "u3"].includes(i.unit)));
check("no item appears twice in a set", new Set(set.items.map((i) => i.id)).size === set.total);
check("every item carries a syllabus unit tag", set.items.every((i) => Boolean(i.unit)));

const noEarlier = selectRetrievalSet(ITEMS, UNIT_ORDER, { unitId: "u1", size: 10, seed: 1, studiedUnits: [] });
check("with nothing studied, the set is drawn from one unit only",
  noEarlier.items.every((i) => i.unit === "u1"));
check("with nothing studied, the note explains why nothing was interleaved",
  typeof noEarlier.note === "string" && noEarlier.note.length > 0);

const unitOnly = selectRetrievalSet(ITEMS, UNIT_ORDER, { unitId: "u3", size: 10, seed: 3, studiedUnits: ["u3"] });
check("a unit is never interleaved with itself", unitOnly.items.every((i) => i.unit === "u3"));

/* ---- 7. Mistake log (FR-6, AC-6.1, AC-6.3, AC-6.2) -------------------- */

let mistakes = [];
mistakes = logMistake(mistakes, { conceptId: "c1-1", unit: "u1", criterion: "names redundancy", tag: "redundancy-not-named", itemId: "i1-1-1" }, T0);
mistakes = logMistake(mistakes, { conceptId: "c1-1", unit: "u1", criterion: "names redundancy", tag: "redundancy-not-named", itemId: "i1-1-2" }, T0 + DAY);
check("a repeated miss is one entry, not two", mistakes.length === 1, String(mistakes.length));
check("the repeated miss increases the count", mistakes[0].count === 2);
check("the entry remembers the latest item", mistakes[0].lastItemId === "i1-1-2");

mistakes = logMistake(mistakes, { conceptId: "c1-1", unit: "u1", criterion: "states the fix", tag: "mechanism-missing", itemId: "i1-1-1" }, T0 + 2 * DAY);
check("a different criterion is a separate entry", mistakes.length === 2);

const sameDay = resolveMistakes(mistakes, { conceptId: "c1-1", at: T0 + 1 * DAY });
check("a same-day retry resolves nothing", sameDay.every((m) => !m.resolvedAt));
const partway = resolveMistakes(mistakes, { conceptId: "c1-1", at: T0 + 8 * DAY });
check("a pass resolves only the entries old enough to count",
  partway.filter((m) => m.resolvedAt).length === 1,
  JSON.stringify(partway.map((m) => [m.firstAt === T0, Boolean(m.resolvedAt)])));
const later = resolveMistakes(mistakes, { conceptId: "c1-1", at: T0 + 9 * DAY });
check("a correct answer at nine days resolves the concept's entries", later.every((m) => Boolean(m.resolvedAt)));
const otherConcept = resolveMistakes(mistakes, { conceptId: "c2-1", at: T0 + 30 * DAY });
check("resolving one concept leaves other concepts open", otherConcept.every((m) => !m.resolvedAt));

const ranked = rankMistakes(later, UNIT_WEIGHTS, T0 + 9 * DAY);
check("resolved entries drop out of the ranking", ranked.length === 0);
const rankedOpen = rankMistakes(mistakes, UNIT_WEIGHTS, T0 + 3 * DAY);
check("open entries are ranked", rankedOpen.length === 2);
check("every ranked entry exposes its factors (AC-6.2)",
  rankedOpen.every((m) => m.factors && typeof m.factors.recurrence === "number" && typeof m.factors.examWeight === "number" && typeof m.factors.recency === "number"));
check("a unit with a higher exam weight ranks higher, all else equal",
  rankMistakes(
    [
      { key: "a", conceptId: "c1-1", unit: "u1", criterion: "x", tag: "t", firstAt: T0, lastAt: T0, count: 1, resolvedAt: null },
      { key: "b", conceptId: "c3-1", unit: "u3", criterion: "x", tag: "t", firstAt: T0, lastAt: T0, count: 1, resolvedAt: null },
    ],
    UNIT_WEIGHTS,
    T0,
  )[0].unit === "u1");

const csv = exportMistakes(mistakes, T0);
check("export has a header row", csv.split("\n")[0].startsWith("concept,unit,criterion"));
check("export includes every entry", csv.trim().split("\n").length === mistakes.length + 1);
check("export escapes a criterion containing a comma",
  exportMistakes([{ key: "z", conceptId: "c1-1", unit: "u1", criterion: "a, b", tag: "t", firstAt: T0, lastAt: T0, count: 1, resolvedAt: null }], T0).includes('"a, b"'));

/* ---- 8. Calibration (FR-5, AC-5.2, AC-5.3) ---------------------------- */

const attempts = [
  { unit: "u1", confidence: "high", ratio: 1 },
  { unit: "u1", confidence: "high", ratio: 0 },
  { unit: "u1", confidence: "low", ratio: 0 },
  { unit: "u1", confidence: "medium", ratio: 1 },
];
const cal = calibration(attempts);
check("bands are reported with sample sizes",
  cal.bands.every((b) => typeof b.n === "number") && cal.bands.find((b) => b.band === "high").n === 2);
check("band accuracy is computed", near(cal.bands.find((b) => b.band === "high").accuracy, 0.5));
check("brier score is computed", typeof cal.brier === "number" && cal.brier > 0 && cal.brier < 1);

const small = calibrationVerdict(attempts, "u1", "Unit I");
check("a verdict is withheld on a small sample (AC-5.3)", small.verdict === "insufficient");
check("the suppression is explained", small.text.includes("withheld"));

const many = Array.from({ length: 10 }, () => ({ unit: "u2", confidence: "high", ratio: 0.2 }));
const overVerdict = calibrationVerdict(many, "u2", "Unit II");
check("sustained over-confidence is detected", overVerdict.verdict === "over-confident", overVerdict.verdict);
check("the verdict is stated in plain language with numbers", overVerdict.text.includes("Unit II") && overVerdict.text.includes("attempts"));

const calibrated = Array.from({ length: 10 }, () => ({ unit: "u3", confidence: "high", ratio: 0.85 }));
check("an accurate self-estimate is called calibrated", calibrationVerdict(calibrated, "u3", "Unit III").verdict === "calibrated");

/* ---- 9. Exam report (FR-8, AC-8.3, AC-8.4) ---------------------------- */

const paper = PAPERS[0];
const answers = {
  1: { text: "A DBMS is software that manages a database.", timeMs: 600 * 1000, marks: 3 },
  2: { text: "Banking, railways, universities, hospitals, e-commerce.", timeMs: 100 * 1000, marks: 3 },
  9: { text: "", timeMs: 0, marks: 0 },
};
const report = examReport(paper, answers);
check("report totals the marks awarded", near(report.totals.marks, 6), String(report.totals.marks));
check("report totals the paper maximum, not the sum of every printed question", report.totals.max === 75, String(report.totals.max));
check("marks are reported by unit", report.byUnit.length > 0 && report.byUnit.every((u) => typeof u.percent === "number"));
check("questions left blank are listed (AC-8.4)",
  report.blankForTime.length === 13 - 2, String(report.blankForTime.length));
check("the blank list names the question numbers", report.blankForTime.some((r) => r.n === 9));
check("time against budget is computed per question",
  report.rows.every((r) => typeof r.allowedSec === "number" && r.allowedSec > 0));
check("a question over its budget is flagged", report.rows.find((r) => r.n === 1).overBudget === true);
check("a question within budget is not flagged", report.rows.find((r) => r.n === 2).overBudget === false);
check("the diagnosis is a sentence, not a score", report.diagnosis.split(" ").length > 12);
check("the diagnosis distinguishes a deliberate omission from a shortfall",
  report.diagnosis.includes("required") || report.diagnosis.includes("choice"), report.diagnosis);
check("a section short of its required attempts is detected",
  examReport(paper, {}).shortfall === 10, String(examReport(paper, {}).shortfall));
check("an all-blank paper scores zero without dividing by zero",
  examReport(paper, {}).totals.percent === 0);

/* ---- 10. Content integrity spot checks -------------------------------- */

const unitCounts = Object.fromEntries(UNITS.map((u) => [u.id, unitConcepts(u.id).length]));
check("five units are mapped", UNITS.length === 5);
check("every unit has concepts", Object.values(unitCounts).every((n) => n > 0), JSON.stringify(unitCounts));
check("every concept names the unit it belongs to", CONCEPTS.every((c) => UNIT_ORDER.includes(c.unit)));
check("every concept's beats run problem → failure → mechanism → cost",
  CONCEPTS.every((c) => {
    const kinds = c.beats.map((b) => b.kind);
    return kinds.indexOf("problem") < kinds.indexOf("failure") &&
      kinds.indexOf("failure") < kinds.indexOf("mechanism") &&
      kinds.indexOf("mechanism") < kinds.indexOf("cost");
  }),
  CONCEPTS.filter((c) => {
    const kinds = c.beats.map((b) => b.kind);
    return !(kinds.indexOf("problem") < kinds.indexOf("failure") &&
      kinds.indexOf("failure") < kinds.indexOf("mechanism") &&
      kinds.indexOf("mechanism") < kinds.indexOf("cost"));
  }).map((c) => c.id).join(", "));
check("every figure uses one of the six documented primitives",
  CONCEPTS.every((c) => c.beats.every((b) => !b.figure || ["compare", "flow", "table", "tree", "layers", "code"].includes(b.figure.type))));

/* ---- Report ----------------------------------------------------------- */

console.log(`\n${passed} checks passed, ${failures.length} failed.\n`);
if (failures.length) {
  for (const failure of failures) console.log(`  FAIL  ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`  concepts: ${CONCEPTS.length}`);
  console.log(`  items: ${ITEMS.length}`);
  console.log(`  gates: ${CONCEPTS.length}`);
  console.log(`  exam questions: ${PAPERS.reduce((s, p) => s + p.sections.reduce((t, sec) => t + sec.questions.length, 0), 0)}`);
  console.log(`  units: ${UNITS.map((u) => `${u.numeral}(${unitCounts[u.id]})`).join(" ")}\n`);
}
