/**
 * The learning engine.
 *
 * Pure functions only: no DOM, no storage, no clock of its own — the caller
 * passes `now`. That is what makes every rule in the specification testable,
 * and the test suite in tools/test-engine.mjs exercises them directly.
 */

import { SCHEDULE } from "./data/units.js";

/* -------------------------------------------------------------------------
   Grading (FR-4, adapted: the student self-marks against a shown rubric)
   ------------------------------------------------------------------------- */

/**
 * Totals a self-marked attempt. Returns the per-criterion map, the total and
 * the maximum — never a bare score (AC-4.1), and never a total above the
 * maximum (AC-4.2).
 */
export function markAttempt(item, hits) {
  const criteria = item.rubric.map((c, i) => ({
    label: c.label,
    marks: c.marks,
    tag: c.tag,
    beat: c.beat,
    hit: Boolean(hits[i]),
  }));
  const total = criteria.reduce((sum, c) => sum + (c.hit ? c.marks : 0), 0);
  const max = item.rubric.reduce((sum, c) => sum + c.marks, 0);
  return {
    criteria,
    total: round2(Math.min(total, max)),
    max: round2(max),
    ratio: max === 0 ? 0 : round2(Math.min(total, max) / max),
  };
}

/** The beats to replay after a failed exit check (FR-2: one beat, not the chunk). */
export function beatsToReplay(marked) {
  const missed = marked.criteria.filter((c) => !c.hit).map((c) => c.beat);
  return [...new Set(missed.filter((b) => Number.isInteger(b)))].sort((a, b) => a - b);
}

/* -------------------------------------------------------------------------
   Spacing (FR-3)
   ------------------------------------------------------------------------- */

/**
 * Schedules a concept after an attempt. Scheduling attaches to the concept,
 * not to the item, so one understanding is not re-tested through five phrasings.
 */
export function scheduleAfter(previous, { correct, delayDays, now }) {
  const prev = previous || {
    intervalIndex: -1,
    stability: 0,
    lastCorrectDelayDays: 0,
  };
  const intervalIndex = correct
    ? Math.min(prev.intervalIndex + 1, SCHEDULE.intervalsDays.length - 1)
    : 0;
  const intervalDays = SCHEDULE.intervalsDays[intervalIndex];
  const delayedPass =
    correct && Number.isFinite(delayDays) && delayDays >= SCHEDULE.delayedPassDays;

  return {
    intervalIndex,
    intervalDays,
    stability: correct ? (delayedPass ? prev.stability + 1 : prev.stability) : 0,
    lastCorrectDelayDays: correct
      ? Math.max(prev.lastCorrectDelayDays || 0, delayDays || 0)
      : 0,
    nextReviewAt: now + intervalDays * 86400000,
    lastReviewedAt: now,
    /** AC-3.5: nothing is mastered without a pass at a delay of seven days or more. */
    mastered: correct ? delayedPass || prev.mastered === true && prev.stability > 0 : false,
  };
}

/** Concepts due now, most overdue first. */
export function dueConcepts(concepts, now) {
  return Object.entries(concepts)
    .filter(([, s]) => s && s.nextReviewAt && s.nextReviewAt <= now)
    .map(([id, s]) => ({ id, dueAt: s.nextReviewAt, overdueMs: now - s.nextReviewAt }))
    .sort((a, b) => b.overdueMs - a.overdueMs);
}

/* -------------------------------------------------------------------------
   Retrieval set selection (FR-3, AC-3.2)
   ------------------------------------------------------------------------- */

/** Deterministic PRNG so a set can be reproduced in a test. */
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return function next() {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function shuffle(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds a chapter retrieval set: items from the requested unit, with at least
 * 30% interleaved from previously studied units where any exist.
 */
export function selectRetrievalSet(allItems, unitOrder, { unitId, size = 10, seed = 7, studiedUnits = [] }) {
  const rand = seededRandom(seed);
  const inUnit = allItems.filter((it) => it.unit === unitId);
  const earlier = allItems.filter(
    (it) => studiedUnits.includes(it.unit) && it.unit !== unitId,
  );

  const interleavedTarget = Math.min(
    Math.floor(size * SCHEDULE.interleaveRatio),
    earlier.length,
  );
  const ownTarget = Math.min(size - interleavedTarget, inUnit.length);

  const chosenOwn = shuffle(inUnit, rand).slice(0, ownTarget);
  const chosenEarlier = shuffle(earlier, rand).slice(0, interleavedTarget);
  const merged = shuffle([...chosenOwn, ...chosenEarlier], rand);

  const interleavedCount = merged.filter((it) => it.unit !== unitId).length;
  return {
    items: merged,
    interleavedCount,
    total: merged.length,
    ratio: merged.length === 0 ? 0 : round2(interleavedCount / merged.length),
    /** AC-3.2 is a claim about the set; the caller renders a warning if false. */
    meetsInterleaveTarget:
      merged.length === 0 ? true : interleavedCount / merged.length >= SCHEDULE.interleaveRatio,
    note:
      earlier.length === 0
        ? "No earlier unit has been studied yet, so nothing could be interleaved. This set is drawn from one unit only."
        : null,
  };
}

/* -------------------------------------------------------------------------
   Mistake log (FR-6)
   ------------------------------------------------------------------------- */

export function mistakeKey(conceptId, criterion, tag) {
  return `${conceptId}::${criterion}::${tag}`;
}

/**
 * Records a missed criterion. Deduplicated on concept + criterion + tag, so a
 * recurring error is one entry that gains weight rather than many entries.
 */
export function logMistake(mistakes, entry, now) {
  const key = mistakeKey(entry.conceptId, entry.criterion, entry.tag);
  const existing = mistakes.find((m) => m.key === key);
  if (existing) {
    return mistakes.map((m) =>
      m.key === key
        ? { ...m, count: m.count + 1, lastAt: now, lastItemId: entry.itemId }
        : m,
    );
  }
  return [
    ...mistakes,
    {
      key,
      conceptId: entry.conceptId,
      unit: entry.unit,
      criterion: entry.criterion,
      tag: entry.tag,
      firstAt: now,
      lastAt: now,
      count: 1,
      firstItemId: entry.itemId,
      lastItemId: entry.itemId,
      resolvedAt: null,
    },
  ];
}

/**
 * Resolves entries for a concept after a correct answer — but only where the
 * answer came at least seven days after the mistake was recorded (AC-6.3).
 * A same-day retry measures short-term memory, not learning.
 */
export function resolveMistakes(mistakes, { conceptId, at }) {
  return mistakes.map((m) => {
    if (m.conceptId !== conceptId || m.resolvedAt) return m;
    const gapDays = (at - m.firstAt) / 86400000;
    if (gapDays < SCHEDULE.delayedPassDays) return m;
    return { ...m, resolvedAt: at };
  });
}

/**
 * Ranks open mistakes. Every factor is returned so the interface can show the
 * student why an entry sits where it does (AC-6.2) — no opaque ranking.
 */
export function rankMistakes(mistakes, unitWeights, now) {
  return mistakes
    .filter((m) => !m.resolvedAt)
    .map((m) => {
      const recurrence = 1 + Math.min(m.count - 1, 4) * 0.5;
      const examWeight = unitWeights[m.unit] ?? 0.5;
      const daysSince = Math.max(0, (now - m.lastAt) / 86400000);
      const recency = 1 + Math.max(0, (14 - daysSince) / 14);
      return {
        ...m,
        factors: {
          recurrence: round2(recurrence),
          examWeight: round2(examWeight),
          recency: round2(recency),
        },
        score: round2(recurrence * examWeight * recency),
        daysSince: Math.round(daysSince),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/** AC-6.4 — export the full log, including resolved history. */
export function exportMistakes(mistakes, now) {
  const header = "concept,unit,criterion,misconception_tag,occurrences,first_seen,last_seen,resolved";
  const rows = mistakes.map((m) =>
    [
      m.conceptId,
      m.unit,
      csvCell(m.criterion),
      m.tag,
      m.count,
      isoDate(m.firstAt),
      isoDate(m.lastAt),
      m.resolvedAt ? isoDate(m.resolvedAt) : "",
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function isoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------
   Calibration (FR-5)
   ------------------------------------------------------------------------- */

export const CONFIDENCE = {
  low: { label: "Low", probability: 0.2 },
  medium: { label: "Medium", probability: 0.5 },
  high: { label: "High", probability: 0.8 },
};

const CORRECT_AT = 0.5;

/**
 * Accuracy per confidence band, with the sample size beside it (AC-5.2), plus
 * a Brier score over the attempt history.
 */
export function calibration(attempts) {
  const bands = ["low", "medium", "high"].map((band) => {
    const inBand = attempts.filter((a) => a.confidence === band);
    const correct = inBand.filter((a) => a.ratio >= CORRECT_AT).length;
    return {
      band,
      label: CONFIDENCE[band].label,
      n: inBand.length,
      correct,
      accuracy: inBand.length === 0 ? null : round2(correct / inBand.length),
    };
  });

  const scored = attempts.filter((a) => a.confidence in CONFIDENCE);
  const brier =
    scored.length === 0
      ? null
      : round3(
          scored.reduce((sum, a) => {
            const p = CONFIDENCE[a.confidence].probability;
            return sum + (p - a.ratio) ** 2;
          }, 0) / scored.length,
        );

  const statedMean =
    scored.length === 0
      ? null
      : round2(scored.reduce((s, a) => s + CONFIDENCE[a.confidence].probability, 0) / scored.length);
  const actualMean =
    scored.length === 0 ? null : round2(scored.reduce((s, a) => s + a.ratio, 0) / scored.length);

  return {
    bands,
    brier,
    n: scored.length,
    statedMean,
    actualMean,
    gap: statedMean === null ? null : round2(statedMean - actualMean),
  };
}

/**
 * A unit-level verdict in plain language, suppressed when the sample is too
 * small (AC-5.3) and never expressed in personality terms.
 */
export function calibrationVerdict(attempts, unitId, unitLabel) {
  const inUnit = attempts.filter((a) => a.unit === unitId);
  const n = inUnit.length;
  if (n < SCHEDULE.minCalibrationSample) {
    return {
      verdict: "insufficient",
      n,
      text: `Not enough attempts in ${unitLabel} to say anything yet — ${n} of the ${SCHEDULE.minCalibrationSample} needed. The estimate is withheld rather than guessed.`,
    };
  }
  const cal = calibration(inUnit);
  const gap = cal.gap ?? 0;
  if (gap > SCHEDULE.overconfidenceGap) {
    return {
      verdict: "over-confident",
      n,
      gap,
      text: `You rate yourself higher than you score in ${unitLabel}: ${Math.round((cal.statedMean ?? 0) * 100)}% claimed against ${Math.round((cal.actualMean ?? 0) * 100)}% earned over ${n} attempts. Review frequency for this unit is raised.`,
    };
  }
  if (gap < -SCHEDULE.overconfidenceGap) {
    return {
      verdict: "under-confident",
      n,
      gap,
      text: `You score better than you expect in ${unitLabel}: ${Math.round((cal.actualMean ?? 0) * 100)}% earned against ${Math.round((cal.statedMean ?? 0) * 100)}% claimed over ${n} attempts. That is not a problem to fix, but it is worth knowing before you decide what to skip.`,
    };
  }
  return {
    verdict: "calibrated",
    n,
    gap,
    text: `Your estimate matches your results in ${unitLabel} to within ${Math.round(Math.abs(gap) * 100)} percentage points over ${n} attempts.`,
  };
}

/* -------------------------------------------------------------------------
   Exam mode (FR-8)
   ------------------------------------------------------------------------- */

/** The marks-per-minute budget for a paper, in minutes per mark. */
export function marksBudget(paper) {
  return {
    minutesPerMark: round2(paper.durationMinutes / paper.totalMarks),
    secondsPerMark: Math.round((paper.durationMinutes * 60) / paper.totalMarks),
  };
}

/**
 * Post-exam report: marks by unit, time per question against the budget, and
 * every question left blank for want of time (AC-8.3, AC-8.4).
 */
export function examReport(paper, answers) {
  const budget = marksBudget(paper);
  const byUnit = {};
  const rows = [];
  const sections = [];

  for (const section of paper.sections) {
    let sectionAttempted = 0;
    for (const q of section.questions) {
      const a = answers[q.n] || {};
      const attempted = typeof a.text === "string" && a.text.trim().length > 0;
      const marks = a.marks ?? 0;
      const timeSec = a.timeMs ? Math.round(a.timeMs / 1000) : 0;
      const allowedSec = Math.round(q.marks * budget.secondsPerMark);

      // Per-unit figures cover attempted questions only, so a unit's percentage
      // is accuracy where the student actually engaged, not a penalty for the
      // choice structure of the paper.
      if (attempted) {
        byUnit[q.unit] = byUnit[q.unit] || { marks: 0, max: 0, answered: 0, questions: 0 };
        byUnit[q.unit].marks += marks;
        byUnit[q.unit].max += q.marks;
        byUnit[q.unit].answered += 1;
        sectionAttempted += 1;
      }
      byUnit[q.unit] = byUnit[q.unit] || { marks: 0, max: 0, answered: 0, questions: 0 };
      byUnit[q.unit].questions += 1;

      rows.push({
        n: q.n,
        section: section.name,
        unit: q.unit,
        marks,
        max: q.marks,
        attempted,
        timeSec,
        allowedSec,
        overBudget: attempted && timeSec > allowedSec,
      });
    }
    sections.push({
      name: section.name,
      required: section.count,
      attempted: sectionAttempted,
      shortfall: Math.max(0, section.count - sectionAttempted),
      hasChoice: section.attempt !== "all",
    });
  }

  const awarded = rows.reduce((s, r) => s + r.marks, 0);
  const attemptedMarks = rows.filter((r) => r.attempted).reduce((s, r) => s + r.max, 0);
  const timeSec = rows.reduce((s, r) => s + r.timeSec, 0);
  const attempted = rows.filter((r) => r.attempted).length;

  // The paper is worth 75. A student may answer more than the required number,
  // so the ceiling is the paper's own total, not the sum of every printed
  // question (which is larger by construction in a choice paper).
  const max = paper.totalMarks;

  const blankForTime = rows.filter((r) => !r.attempted);
  const shortfall = sections.reduce((s, sec) => s + sec.shortfall, 0);

  return {
    rows,
    sections,
    byUnit: Object.entries(byUnit)
      .map(([unit, v]) => ({
        unit,
        ...v,
        percent: v.max === 0 ? 0 : Math.round((v.marks / v.max) * 100),
      }))
      .filter((u) => u.answered > 0),
    totals: {
      marks: round2(Math.min(awarded, max)),
      awarded: round2(awarded),
      max,
      attemptedMarks: round2(attemptedMarks),
      attempted,
      questions: rows.length,
      timeSec,
      percent: max === 0 ? 0 : Math.round((Math.min(awarded, max) / max) * 100),
    },
    budget,
    blankForTime,
    shortfall,
    /** The diagnostic sentence the paper asks for: not just a score. */
    diagnosis: buildDiagnosis(rows, sections, blankForTime, shortfall, awarded, max, budget),
  };
}

function buildDiagnosis(rows, sections, blankForTime, shortfall, awarded, max, budget) {
  if (rows.length === 0) return "No questions were marked.";
  const over = rows.filter((r) => r.overBudget);
  const attempted = rows.filter((r) => r.attempted).length;
  const parts = [];

  parts.push(`${attempted} of ${rows.length} questions attempted, scoring ${round2(awarded)} of ${max}.`);

  if (blankForTime.length === 0) {
    parts.push("Every question was attempted, so nothing was lost to time.");
  } else if (shortfall > 0) {
    const shortSections = sections.filter((s) => s.shortfall > 0).map((s) => s.name);
    parts.push(
      `${shortfall} question${shortfall === 1 ? "" : "s"} left blank in ${shortSections.join(" and ")} where the paper required an attempt — those are marks lost to time or to omission, not to choice.`,
    );
  } else {
    parts.push(
      `${blankForTime.length} question${blankForTime.length === 1 ? "" : "s"} left blank, but every section still met its required number — the paper offers a choice, so those omissions cost nothing directly.`,
    );
  }

  if (over.length > 0) {
    const worst = [...over].sort((a, b) => b.timeSec - b.allowedSec - (a.timeSec - a.allowedSec))[0];
    parts.push(
      `${over.length} question${over.length === 1 ? "" : "s"} ran over the ${budget.minutesPerMark} min/mark budget; Q${worst.n} took ${Math.round(worst.timeSec / 60)} min against ${Math.round(worst.allowedSec / 60)} allowed.`,
    );
  } else {
    parts.push(`No attempted question exceeded the ${budget.minutesPerMark} min/mark budget.`);
  }
  return parts.join(" ");
}

/* -------------------------------------------------------------------------
   Publish gate (FR-7, AC-7.2) — content cannot ship without these
   ------------------------------------------------------------------------- */

export function validateConcept(concept) {
  const errors = [];
  if (!concept.id) errors.push("missing id");
  if (!concept.syllabusTag) errors.push("no syllabus tag");
  if (!Array.isArray(concept.beats) || concept.beats.length < 4) {
    errors.push("fewer than four beats");
  } else {
    const kinds = concept.beats.map((b) => b.kind);
    const problemAt = kinds.indexOf("problem");
    const mechanismAt = kinds.indexOf("mechanism");
    if (problemAt === -1) errors.push("no problem beat");
    if (mechanismAt === -1) errors.push("no mechanism beat");
    if (problemAt !== -1 && mechanismAt !== -1 && mechanismAt < problemAt) {
      errors.push("mechanism precedes the problem that motivates it");
    }
    if (kinds.indexOf("failure") === -1) errors.push("no failure beat");
    if (kinds.indexOf("cost") === -1) errors.push("no cost beat");
  }
  if (!concept.gate || !Array.isArray(concept.gate.options)) {
    errors.push("no prediction gate");
  } else {
    const correct = concept.gate.options.filter((o) => o.correct).length;
    if (correct !== 1) errors.push(`gate has ${correct} correct options, needs exactly 1`);
    if (concept.gate.options.length < 3) errors.push("gate needs at least three options");
    if (concept.gate.options.some((o) => !o.why)) errors.push("a gate option has no explanation");
  }
  if (!Array.isArray(concept.items) || concept.items.length < 3) {
    errors.push("fewer than three rubric-backed items");
  } else {
    for (const item of concept.items) {
      if (!Array.isArray(item.rubric) || item.rubric.length === 0) {
        errors.push(`${item.id}: no rubric`);
        continue;
      }
      const sum = item.rubric.reduce((s, c) => s + c.marks, 0);
      if (Math.abs(sum - item.marks) > 0.001) {
        errors.push(`${item.id}: rubric sums to ${sum}, item is worth ${item.marks}`);
      }
      if (!item.model) errors.push(`${item.id}: no model answer`);
      if (item.rubric.some((c) => !c.tag)) errors.push(`${item.id}: criterion without a misconception tag`);
    }
  }
  if (!concept.hook) errors.push("no hook");
  return errors;
}

export function validatePapers(papers) {
  const errors = [];
  for (const paper of papers) {
    if (!paper.source) errors.push(`${paper.id}: no verified source`);
    if (!paper.totalMarks || !paper.durationMinutes) errors.push(`${paper.id}: missing marks or duration`);
    let contribution = 0;
    for (const section of paper.sections) {
      contribution += section.count * section.marksEach;
      if (section.questions.length < section.count) {
        errors.push(`${paper.id} ${section.name}: ${section.questions.length} questions, needs ${section.count}`);
      }
      for (const q of section.questions) {
        if (Math.abs(q.marks - section.marksEach) > 0.001) {
          errors.push(`${paper.id} Q${q.n}: worth ${q.marks}, section states ${section.marksEach} per question`);
        }
        const sum = q.rubric.reduce((s, c) => s + c.marks, 0);
        if (Math.abs(sum - q.marks) > 0.001) {
          errors.push(`${paper.id} Q${q.n}: rubric sums to ${sum}, question is worth ${q.marks}`);
        }
        if (!q.model) errors.push(`${paper.id} Q${q.n}: no model answer`);
        if (!q.unit) errors.push(`${paper.id} Q${q.n}: no unit tag`);
      }
    }
    // In a paper with a choice, the sum of every printed question exceeds the
    // paper total. What must add up is the attempted requirement.
    if (Math.abs(contribution - paper.totalMarks) > 0.001) {
      errors.push(`${paper.id}: sections require ${contribution} marks, paper states ${paper.totalMarks}`);
    }
  }
  return errors;
}

/* -------------------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------------------- */

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function round3(n) {
  return Math.round(n * 1000) / 1000;
}

export function formatMarks(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}
