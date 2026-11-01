/**
 * The content store's public surface.
 *
 * The client holds no teaching copy of its own (AC-7.3): every sentence a
 * student reads comes from these data modules, and the player is a renderer
 * over whatever script it is served.
 */

import { UNITS, SUBJECT, MISCONCEPTIONS, SCHEDULE } from "./data/units.js";
import { CONCEPTS_U1_U2 } from "./data/concepts-u1-u2.js";
import { CONCEPTS_U3_U4 } from "./data/concepts-u3-u4.js";
import { CONCEPTS_U6 } from "./data/concepts-u6.js";
import { PAPERS } from "./data/papers.js";
import { validateConcept, validatePapers } from "./engine.js";

export { UNITS, SUBJECT, MISCONCEPTIONS, SCHEDULE, PAPERS };

export const CONCEPTS = [...CONCEPTS_U1_U2, ...CONCEPTS_U3_U4, ...CONCEPTS_U6];

export const UNIT_BY_ID = Object.fromEntries(UNITS.map((u) => [u.id, u]));
export const CONCEPT_BY_ID = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
export const UNIT_WEIGHTS = Object.fromEntries(UNITS.map((u) => [u.id, u.examWeight]));
export const UNIT_ORDER = UNITS.map((u) => u.id);

/** Every rubric-backed item, tagged with the concept and unit it belongs to. */
export const ITEMS = CONCEPTS.flatMap((concept) =>
  concept.items.map((item) => ({
    ...item,
    conceptId: concept.id,
    conceptTitle: concept.title,
    unit: concept.unit,
    syllabusTag: concept.syllabusTag,
  })),
);

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** Concepts of a unit, in their declared dependency order. */
export function unitConcepts(unitId) {
  return CONCEPTS.filter((c) => c.unit === unitId);
}

export function conceptIndexInUnit(conceptId) {
  const concept = CONCEPT_BY_ID[conceptId];
  if (!concept) return -1;
  return unitConcepts(concept.unit).findIndex((c) => c.id === conceptId);
}

/**
 * Chunk state machine (FR-2): locked, available, in progress, check pending,
 * complete. Only a completed chunk unlocks the next one.
 */
export function chunkStatus(state, conceptId) {
  const concept = CONCEPT_BY_ID[conceptId];
  if (!concept) return "locked";
  const index = conceptIndexInUnit(conceptId);
  const progress = state.concepts[conceptId];
  if (progress && progress.status === "complete") return "complete";
  if (index === 0) return progress && progress.status === "check-pending" ? "check-pending" : "available";
  const previous = unitConcepts(concept.unit)[index - 1];
  const previousDone = state.concepts[previous.id]?.status === "complete";
  if (!previousDone) return "locked";
  if (progress && progress.status === "check-pending") return "check-pending";
  return "available";
}

/** Units whose first chunk is reachable — all of them, since units are independent topics. */
export function unitProgress(state, unitId) {
  const concepts = unitConcepts(unitId);
  const done = concepts.filter((c) => state.concepts[c.id]?.status === "complete").length;
  return {
    done,
    total: concepts.length,
    percent: concepts.length === 0 ? 0 : Math.round((done / concepts.length) * 100),
  };
}

/** Units the student has actually studied, which is what interleaving draws from. */
export function studiedUnits(state) {
  return UNITS.filter((u) =>
    unitConcepts(u.id).some((c) => state.concepts[c.id]?.status === "complete"),
  ).map((u) => u.id);
}

/**
 * Runs the publish gate over all content. The app refuses to open a concept
 * that fails it, and shows the failures rather than hiding them.
 */
export function publishGate() {
  const conceptErrors = CONCEPTS.flatMap((c) =>
    validateConcept(c).map((e) => `${c.id}: ${e}`),
  );
  const paperErrors = validatePapers(PAPERS);
  return { ok: conceptErrors.length === 0 && paperErrors.length === 0, conceptErrors, paperErrors };
}
