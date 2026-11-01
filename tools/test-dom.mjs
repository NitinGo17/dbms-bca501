/**
 * DOM smoke test — the interactive paths, driven through linkedom.
 *
 * Run: node tools/test-dom.mjs
 *
 * The engine test proves the rules. This proves the client actually wires them
 * up: the gate blocks the mechanism, the exit check runs answer → confidence →
 * scheme → model answer, a fail leaves the chunk in check-pending, and a pass
 * unlocks the next chunk.
 */

import { parseHTML } from "linkedom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const shell = readFileSync(resolve(root, "index.html"), "utf8");
const { window: win, document: doc } = parseHTML(shell);

// A minimal storage and location, since linkedom ships neither.
const store = new Map();
win.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
win.location = { hash: "#/", replace: (h) => { win.location.hash = h; } };

global.window = win;
global.document = doc;
global.localStorage = win.localStorage;
global.Blob = win.Blob || class Blob { constructor(parts) { this.parts = parts; } };
global.URL = win.URL || { createObjectURL: () => "blob:x", revokeObjectURL: () => {} };
global.HTMLElement = win.HTMLElement;
global.Node = win.Node;
global.Event = win.Event;

win.scrollTo = () => {};
win.setTimeout = globalThis.setTimeout.bind(globalThis);
win.clearTimeout = globalThis.clearTimeout.bind(globalThis);
win.setInterval = globalThis.setInterval.bind(globalThis);
win.clearInterval = globalThis.clearInterval.bind(globalThis);
win.confirm = () => false;

const errors = [];
win.addEventListener("error", (e) => errors.push(String(e.message)));

let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const main = () => doc.getElementById("view");
const text = () => main().textContent.replace(/\s+/g, " ");
const q = (sel) => main().querySelector(sel);
const settle = () => new Promise((r) => globalThis.setTimeout(r, 250));
async function readState() {
  await settle();
  const raw = win.localStorage.getItem("bca501-dbms-state");
  return raw ? JSON.parse(raw) : null;
}
const qa = (sel) => [...main().querySelectorAll(sel)];

function go(hash) {
  win.location.hash = hash;
  win.dispatchEvent(new win.Event("hashchange"));
}

function click(el) {
  if (!el) throw new Error("click on a missing element");
  el.dispatchEvent(new win.Event("click", { bubbles: true, cancelable: true }));
}

function tick(el) {
  el.checked = true;
  el.dispatchEvent(new win.Event("change", { bubbles: true }));
  el.dispatchEvent(new win.Event("click", { bubbles: true, cancelable: true }));
}

function type(el, value) {
  el.value = value;
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
}

await import(resolve(root, "assets/js/app.js"));

/* ---- 1. The map renders ------------------------------------------------ */

check("home renders the course title", text().includes("Introduction to DBMS"));
check("home lists all five units",
  ["Introduction", "E-R Modelling", "File Organisation", "Relational Data Model and SQL"].every((t) => text().includes(t)));
check("unit V is not offered anywhere", !doc.querySelector('a[href*="u5"]') && !text().includes("EER"));
check("the rail renders unit progress", doc.getElementById("rail").textContent.includes("0/5"));
check("the first chunk of a unit is reachable",
  Boolean(main().querySelector('a.chunk[href="#/concept/c1-1"]')));
check("the third chunk of a unit is locked",
  Boolean(main().querySelector(".chunk--locked")));

/* ---- 2. A locked chunk refuses ---------------------------------------- */

go("#/concept/c1-3");
check("a locked chunk shows a refusal, not the material",
  text().includes("Not yet") && !text().includes("Three levels, two mappings"));

/* ---- 3. The player gates the mechanism (FR-1, AC-1.2) ----------------- */

go("#/concept/c1-1");
check("the chunk title renders", text().includes("One correction, three files"));
check("the hook renders", text().includes("Three weeks later"));
check("the problem beat renders", text().includes("admission, library and examination"));
check("the gate renders with four options", qa("[data-gate-option]").length === 4);
check("the mechanism is withheld before the gate", !text().includes("Store the name once"));
check("the exit check is withheld before the gate", !q("[data-item]"));

click(qa("[data-gate-option]")[0]);
check("answering the gate reveals the mechanism", text().includes("Store the name once"));
check("a wrong gate choice is marked wrong", text().includes("Not this one"));
check("the gate explains why the answer was wrong", text().includes("A name is a few bytes"));
check("the exit check appears after the gate", Boolean(q("[data-item]")));
check("the gate records an attempt in storage", (await readState()).gates.length === 1);

/* ---- 4. Answer → confidence → scheme → model (FR-4, FR-5) ------------- */

const textarea = q("[data-answer]");
check("the answer box is labelled", Boolean(main().querySelector('label[for^="answer-"]')));
type(textarea, "The name is redundant across three files, so the copies disagree. Fix it by storing the name once and referencing it by roll number.");
click(q("[data-submit-answer]"));
check("confidence is asked for before any grade", qa("[data-confidence]").length === 3);
check("the mark scheme is still hidden at the confidence step", !text().includes("Mark scheme — tick"));

const high = qa("[data-confidence]").find((r) => r.getAttribute("value") === "high");
high.checked = true;
high.dispatchEvent(new win.Event("change", { bubbles: true }));
click(q("[data-confirm-confidence]"));
check("the mark scheme appears after confidence", text().includes("Mark scheme"));
check("the model answer is still hidden while marking", !text().includes("Model answer"));
check("every criterion has a checkbox", qa("[data-criterion]").length === 3);

tick(qa("[data-criterion]")[0]);
click(q("[data-finish-marking]"));
check("marks are shown as a fraction", /1 \/ 5/.test(text()));
check("the model answer is revealed after submission", text().includes("Model answer"));
check("a per-criterion breakdown is shown", qa(".rubric__item").length >= 3);
check("a dispute action is offered", Boolean(q("[data-dispute]")));
check("a fail is stated plainly", text().includes("Below the exit threshold"));
check("a fail offers the single beat to replay", Boolean(q("[data-retry]")));
check("the failed exit check did not unlock the next chunk",
  !text().includes("Next chunk:"));

const stored = await readState();
check("the attempt is persisted with confidence", stored.attempts.length === 1 && stored.attempts[0].confidence === "high");
check("the miss is logged with a misconception tag", stored.mistakes.length >= 1 && Boolean(stored.mistakes[0].tag));
check("the concept is left in check-pending", stored.concepts["c1-1"].status === "check-pending");

/* ---- 5. Retry and pass unlocks the next chunk (FR-2, AC-2.2) ---------- */

click(q("[data-retry]"));
type(q("[data-answer]"), "Redundant name across three files causes inconsistency; store it once and reference by roll number.");
click(q("[data-submit-answer]"));
const medium = qa("[data-confidence]").find((r) => r.getAttribute("value") === "medium");
medium.checked = true;
medium.dispatchEvent(new win.Event("change", { bubbles: true }));
click(q("[data-confirm-confidence]"));
qa("[data-criterion]").forEach(tick);
click(q("[data-finish-marking]"));
check("a full pass shows full marks", /5 \/ 5/.test(text()));
check("passing unlocks the next chunk", text().includes("Next chunk:"));
const afterPass = await readState();
check("the concept is complete", afterPass.concepts["c1-1"].status === "complete");
check("the concept is scheduled for review", typeof afterPass.concepts["c1-1"].nextReviewAt === "number");

go("#/unit/u1");
check("the unit page reflects the completed chunk", text().includes("1 of 5 complete"));
check("the second chunk is now reachable", Boolean(main().querySelector('a.chunk[href="#/concept/c2-1"], a.chunk[href="#/concept/c1-2"]')));

/* ---- 6. Retrieval set, mistake log, calibration ----------------------- */

go("#/review/u1");
check("the retrieval set builds", text().includes("retrieval set"));
check("the set states its interleaving", text().includes("interleaved"));
check("the set offers answerable items", qa("[data-item]").length > 0);

go("#/mistakes");
check("the mistake log lists the open entry", text().includes("Open entries"));
check("the log states the resolution rule", text().includes("seven days"));
check("the log offers an export", Boolean(q("[data-export]")));

go("#/calibration");
check("calibration reports the band table", text().includes("Accuracy by confidence band"));
check("calibration shows the sample size beside the figure", text().includes("n="));
check("calibration withholds verdicts on small samples", text().includes("insufficient") || text().includes("withheld"));

/* ---- 7. Exam mode ----------------------------------------------------- */

go("#/exam");
check("exam mode lists three papers", text().includes("Dec 2023") && text().includes("Dec 2024") && text().includes("Dec 2025"));
check("each paper states its verified source", text().includes("C.C.S. University, Meerut"));
check("the budget is stated before starting", text().includes("2.4 minutes per mark"));

go("#/exam/p2024");
check("the brief shows the year", text().includes("2024"));
check("the brief shows the total marks and duration",
  text().includes("180 minutes") && text().includes("minutes per mark"));
check("the brief shows the sections' instructions", text().includes("Attempt any two"));
check("no model answer is reachable before the exam", !text().includes("Model answer"));
check("the start control exists", Boolean(q("[data-start-exam]")));

click(q("[data-start-exam]"));
check("the paper opens with a clock", Boolean(doc.getElementById("exam-clock")));
check("every question has an answer box", qa("[data-exam-q]").length === 13);
check("the lockdown is stated", text().includes("lockdown"));
check("no rubric is visible during the exam", qa("[data-exam-criterion]").length === 0);
check("no model answer is visible during the exam", !text().includes("Model answer"));

const q1 = q('[data-exam-q="1"]');
type(q1, "A schema is the description of the database structure.");
const midExam = await readState();
check("typing records an answer", midExam.exams[0].answers["1"].text.length > 10);
check("typing records time against the question", midExam.exams[0].answers["1"].timeMs >= 0);

click(q("[data-submit-exam]"));
check("submitting opens the marking screen", text().includes("Mark the 1 answer"));
check("marking shows what was written", text().includes("A schema is the description"));
check("the rubric appears only after submission", qa("[data-exam-criterion]").length > 0);

qa("[data-exam-criterion]").forEach(tick);
click(q("[data-finish-exam]"));
check("the report renders after marking", text().includes("marks by unit") || text().includes("Marks by unit"));
check("the report is a diagnostic, not just a score", text().includes("questions attempted"));
check("the report compares time against the budget", text().includes("min/mark budget"));
check("the report lists time per question", text().includes("Allowed"));

const finalState = await readState();
check("the exam is stored with a report", finalState.exams[0].report !== null && finalState.exams[0].submittedAt !== null);
check("exam answers feed the attempt history", finalState.attempts.some((a) => a.kind === "exam"));

/* ---- 8. About, and no runtime errors --------------------------------- */

go("#/about");
check("the about page names the deviations", text().includes("self-marked"));
check("the about page names the sources", text().includes("Dec 2023"));
check("no uncaught runtime errors occurred", errors.length === 0, errors.join("; "));

console.log(`\n${passed} DOM checks passed, ${failures.length} failed.\n`);
if (failures.length) {
  for (const failure of failures) console.log(`  FAIL  ${failure}`);
  process.exitCode = 1;
}
