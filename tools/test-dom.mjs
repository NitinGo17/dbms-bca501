/**
 * DOM smoke test — the shift loop, driven through linkedom.
 * Run: node tools/test-dom.mjs
 *
 * Proves the client wires the game rules up: the HUD shows standing, a locked
 * ticket refuses, the manager's question withholds the fix, a failed
 * verification costs HP and plays the sequence, a cleared shift advances the
 * day, and zero HP ends the run.
 */

import { parseHTML } from "linkedom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { emptyRun } from "../assets/js/run.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const shell = readFileSync(resolve(root, "index.html"), "utf8");
const { window: win, document: doc } = parseHTML(shell);

const store = new Map();
win.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
win.location = { hash: "#/", replace: (h) => { win.location.hash = h; } };
win.scrollTo = () => {};
win.confirm = () => false;
win.setTimeout = globalThis.setTimeout.bind(globalThis);
win.clearTimeout = globalThis.clearTimeout.bind(globalThis);
win.setInterval = globalThis.setInterval.bind(globalThis);
win.clearInterval = globalThis.clearInterval.bind(globalThis);

Object.assign(globalThis, {
  window: win,
  document: doc,
  localStorage: win.localStorage,
  Blob: win.Blob || class Blob {},
  URL: win.URL || { createObjectURL: () => "blob:x", revokeObjectURL: () => {} },
  HTMLElement: win.HTMLElement,
  Node: win.Node,
  Event: win.Event,
});

// Seed a run one bad shift away from the end, so the death path is reachable.
const seed = {
  version: 2,
  createdAt: Date.now(),
  attempts: [],
  gates: [],
  concepts: {},
  mistakes: [],
  exams: [],
  settings: { interleaveRatio: 0.3 },
  run: { ...emptyRun(), hp: 5, startedAt: Date.now() },
};
win.localStorage.setItem("bca501-dbms-state", JSON.stringify(seed));

const errors = [];
win.addEventListener("error", (e) => errors.push(String(e.message)));

let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const main = () => doc.getElementById("view");
const hudEl = () => doc.getElementById("hud");
const sceneEl = () => doc.getElementById("scene");
const text = () => main().textContent.replace(/\s+/g, " ");
const hudText = () => hudEl().textContent.replace(/\s+/g, " ");
const q = (sel) => main().querySelector(sel);
const qa = (sel) => [...main().querySelectorAll(sel)];
const settle = () => new Promise((r) => globalThis.setTimeout(r, 220));

async function readState() {
  await settle();
  const raw = win.localStorage.getItem("bca501-dbms-state");
  return raw ? JSON.parse(raw) : null;
}

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
}

function type(el, value) {
  el.value = value;
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
}

await import(resolve(root, "assets/js/app.js"));

/* ---- 1. The HUD -------------------------------------------------------- */

check("the HUD renders", Boolean(hudEl()) && hudText().length > 0);
check("the HUD shows standing", hudText().includes("HP"), hudText());
check("the HUD shows the seeded low health", hudText().includes("5"), hudText());
check("the HUD shows the shift number", hudText().toLowerCase().includes("shift"));
check("the HUD shows a rank", hudText().includes("Intern"));
check("the HUD offers audit day", Boolean(hudEl().querySelector('a[href="#/audit"]')));
check("the HUD shows an avatar", Boolean(hudEl().querySelector(".hud__avatar svg")));
check("the HUD shows XP toward the next rank", /XP/.test(hudText()));
check("the HUD shows the shift out of the total", /Shift\s*01\s*\/\s*26/.test(hudText().replace(/\s+/g, " ")));
check("the HUD shows a standing line", Boolean(hudEl().querySelector(".hud__standing")));
check("the HUD has a sound toggle that starts off",
  hudEl().querySelector("[data-sound]").getAttribute("aria-pressed") === "false");
check("the sound toggle is labelled", hudEl().querySelector("[data-sound]").textContent.trim() === "Sound on");

/* ---- 2. The building --------------------------------------------------- */

check("the building lists five floors",
  text().includes("Exam Cell") && text().includes("Records Office") &&
  text().includes("Server Room") && text().includes("Query Desk") && text().includes("The Vault"));
check("tickets are numbered", Boolean(q(".node__no")));
check("tickets carry a ticket number", text().includes("#1041"));
check("later tickets are locked", Boolean(q(".node--locked")));
check("floors are numbered in a box", qa(".floor__num").length === 5);
check("each floor states its cleared count and HP range",
  /0\/5 cleared/.test(text()) && /−9 to −13 HP/.test(text()));
check("each ticket states what failing it costs", text().includes("−9 HP if failed"));
check("a locked ticket is dashed and dimmed, not hidden", Boolean(q(".node--locked")) && text().includes("locked"));
check("the office names three simulated colleagues", qa(".roster tbody tr").length === 3);
check("colleagues are marked as NPCs", qa(".npc").length === 3);
check("the office wire carries entries", qa(".wire li").length > 0);

/* ---- 3. A locked ticket refuses --------------------------------------- */

go("#/case/c1-3");
check("a locked ticket refuses", text().includes("Not your ticket yet"));
check("a locked ticket shows no case detail", !text().includes("Deadline") && !text().includes("toolset"));

/* ---- 4. The case desk ------------------------------------------------- */

go("#/case/c1-1");
check("the ticket renders", text().includes("Ticket #1041"));
check("the reporter is named", text().includes("Exam Cell clerk"));
check("the deadline is stated", text().includes("4 hours"));
check("the stake is stated", text().includes("fined under a name"));
check("the toolset is named", text().includes("Redundancy"));
check("the threat card states the damage", text().includes("−9 HP"));
check("the case title sits in a frame", Boolean(q(".case-title")));
check("the ticket header is the amber bar", Boolean(q(".ticket__head")));
check("the threat card carries the manager's portrait", Boolean(q(".threat__portrait svg")));
check("the threat card names the warning", text().includes("Verbal warning"));
check("the threat card shows five severity pips", qa(".threat__pips .pips span").length === 5);
check("one severity pip is filled on shift 1",
  qa(".threat__pips .pips span[data-on='true']").length === 1);
check("the threat card states the severity in text", text().includes("Severity 1 of 5"));
check("the manager's question renders", qa("[data-gate-option]").length === 4);
check("the fix is withheld before the question", !text().includes("Store the name once"));
check("verification is withheld before the question", !q("[data-item]"));

click(qa("[data-gate-option]")[1]);
check("answering reveals the fix", text().includes("Store the name once"));
check("the answer is confirmed correct", text().includes("Correct"));
check("verification appears", Boolean(q("[data-item]")));

/* ---- 5. Answer → confidence → scheme → result ------------------------- */

type(q("[data-answer]"), "The name is redundant across three files so the copies disagree; store it once and reference it by roll number.");
click(q("[data-submit-answer]"));
check("confidence is asked before the mark", qa("[data-confidence]").length === 3);
check("the scheme is still hidden", !text().includes("Marking scheme"));

const high = qa("[data-confidence]").find((r) => r.getAttribute("value") === "high");
high.checked = true;
high.dispatchEvent(new win.Event("change", { bubbles: true }));
click(q("[data-confirm-confidence]"));
check("the scheme appears", text().includes("Marking scheme"));
check("the model answer is still hidden", !text().includes("What the manager wanted"));

/* ---- 6. A failed verification plays the sequence --------------------- */

click(q("[data-finish-marking]"));
check("a zero score is shown", /0 \/ 5/.test(text()));
check("the failure is stated plainly", text().includes("The fix does not hold"));
check("the model answer is revealed", text().includes("What the manager wanted"));

const afterFail = await readState();
check("standing drops by the shift's damage", afterFail.run.hp === 0, String(afterFail.run.hp));
check("the run is terminated at zero", afterFail.run.status === "terminated");
check("the death is counted", afterFail.run.deaths === 1);

check("the failure sequence is on screen", sceneEl() && sceneEl().hidden === false);
check("the sequence shows the damage", sceneEl().textContent.includes("−9 HP"));
check("the sequence shows the manager's line", sceneEl().textContent.length > 40);
check("the sequence offers a skip", Boolean(sceneEl().querySelector("[data-skip-scene]")));
check("the sequence is a labelled modal dialog",
  sceneEl().querySelector("[role='dialog'][aria-modal='true'][aria-labelledby]") !== null);
check("the sequence's skip control is a real button",
  sceneEl().querySelector("[data-skip-scene]").tagName === "BUTTON");
check("the corridor is drawn in perspective rings", sceneEl().querySelectorAll(".scene__ring").length >= 5);
check("the desk is in the foreground", Boolean(sceneEl().querySelector(".scene__desk svg")));
check("the manager is on screen", Boolean(sceneEl().querySelector(".scene__boss svg")));
check("the sequence has a sound toggle", Boolean(sceneEl().querySelector("[data-sound-scene]")));
check("the sequence states the shift and the failure", /Shift 01/.test(sceneEl().textContent));

click(sceneEl().querySelector("[data-skip-scene]"));
check("skipping lands on the card", sceneEl().textContent.includes("Shift terminated"));
check("the card offers a new shift", Boolean(sceneEl().querySelector('a[href="#/terminated"]')));
check("the card names the warning level", /Final notice|Verbal warning|Written warning|Performance review|Last chance/.test(sceneEl().textContent));
check("the card reports damage, HP left and severity",
  sceneEl().textContent.includes("Damage") && sceneEl().textContent.includes("HP left") && sceneEl().textContent.includes("Severity"));
check("the card draws an ECG", Boolean(sceneEl().querySelector(".scene__ecg svg")));

/* ---- 7. The game-over page ------------------------------------------- */

go("#/terminated");
check("the run summary renders", text().includes("Cleared out"));
check("the summary states the study record survives", text().includes("study record is kept"));
check("a new shift is offered", Boolean(q("[data-new-shift]")));

click(q("[data-new-shift]"));
await settle();
const afterNew = await readState();
check("a new shift restores standing", afterNew.run.hp === 100, String(afterNew.run.hp));
check("a new shift resets the map", Object.keys(afterNew.run.cleared).length === 0);
check("the death count survives", afterNew.run.deaths === 1);
check("the HUD reflects the restored standing", hudText().includes("100"));

/* ---- 8. A cleared shift advances the day ----------------------------- */

go("#/case/c1-1");
click(qa("[data-gate-option]")[1]);
type(q("[data-answer]"), "Redundant name across three files causes inconsistency; store once and reference by roll number.");
click(q("[data-submit-answer]"));
const medium = qa("[data-confidence]").find((r) => r.getAttribute("value") === "medium");
medium.checked = true;
medium.dispatchEvent(new win.Event("change", { bubbles: true }));
click(q("[data-confirm-confidence]"));
qa("[data-criterion]").forEach(tick);
click(q("[data-finish-marking]"));

check("a full pass shows full marks", /5 \/ 5/.test(text()));
check("the shift is signed off", text().includes("Shift signed off"));
check("the next ticket is offered", text().includes("Next ticket:"));

const afterClear = await readState();
check("the ticket is cleared", Boolean(afterClear.run.cleared["c1-1"]));
check("the day advances", afterClear.run.day === 1, String(afterClear.run.day));
check("the concept is complete", afterClear.concepts["c1-1"].status === "complete");
check("XP was earned", afterClear.run.xp > 0, String(afterClear.run.xp));

/* ---- 9. Audit day ----------------------------------------------------- */

go("#/audit");
check("three papers are listed", text().includes("Dec 2023") && text().includes("Dec 2025"));
check("the verified source is shown", text().includes("C.C.S. University, Meerut"));
check("the budget is stated", text().includes("2.4 min/mark"));

go("#/audit/p2023");
check("the brief shows the marks", text().includes("75"));
check("the brief shows the duration", text().includes("180 minutes"));
check("no marking scheme before the paper", qa("[data-audit-criterion]").length === 0);

click(q("[data-start-audit]"));
check("the clock runs", Boolean(doc.getElementById("audit-clock")));
check("every question has a box", qa("[data-exam-q]").length === 13);
check("no scheme during the audit", qa("[data-audit-criterion]").length === 0);

/* ---- 10. No runtime errors ------------------------------------------- */

go("#/manual");
check("the field manual explains the rules", text().includes("Failing costs standing"));
check("the manual states the deviations", text().includes("self-marked"));
check("no uncaught runtime errors occurred", errors.length === 0, errors.join("; "));

console.log(`\n${passed} DOM checks passed, ${failures.length} failed.\n`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL  ${f}`);
  process.exitCode = 1;
}
