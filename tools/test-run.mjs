/**
 * The run economy: damage, healing, XP, ranks, audit outcomes, death.
 * Run: node tools/test-run.mjs
 */

import {
  RUN,
  emptyRun,
  damageFor,
  severityFor,
  xpForGate,
  xpForExit,
  rankFor,
  failCase,
  clearCase,
  auditOutcome,
  newShift,
  hpState,
  terminationLine,
} from "../assets/js/run.js";

let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const T0 = Date.UTC(2026, 0, 1);

/* ---- damage scales with the shift ------------------------------------- */

check("shift 1 costs 9 HP", damageFor(1) === 9, String(damageFor(1)));
check("shift 26 costs 34 HP", damageFor(26) === 34, String(damageFor(26)));
check("damage rises with the shift number", damageFor(20) > damageFor(10) && damageFor(10) > damageFor(2));
check("severity is banded 1 to 5",
  severityFor(1) === 1 && severityFor(8) === 2 && severityFor(14) === 3 && severityFor(20) === 4 && severityFor(26) === 5);

/* ---- failing ----------------------------------------------------------- */

let run = emptyRun();
check("a run starts at full standing", run.hp === 100 && run.status === "active");

const fail1 = failCase(run, { conceptId: "c1-1", levelIndex: 1, now: T0 });
check("a failed shift costs HP", fail1.run.hp === 91, String(fail1.run.hp));
check("a failed shift does not end the run", fail1.terminated === false);
check("the failure reports the damage it dealt", fail1.damage === 9);
check("the failure carries a severity for the sequence", fail1.severity === 1);

let lowRun = { ...emptyRun(), hp: 10 };
const kill = failCase(lowRun, { conceptId: "c1-1", levelIndex: 20, now: T0 });
check("standing cannot go below zero", kill.run.hp === 0, String(kill.run.hp));
check("zero standing terminates the run", kill.terminated === true && kill.run.status === "terminated");
check("a termination counts against the run", kill.run.deaths === 1);
check("a terminated run cannot be failed again",
  failCase(kill.run, { conceptId: "c1-2", levelIndex: 2, now: T0 }).damage === 0);

/* ---- clearing ---------------------------------------------------------- */

const clear = clearCase(emptyRun(), { conceptId: "c1-1", levelIndex: 1, ratio: 1, delayedPass: false, now: T0 });
check("clearing a shift advances the day", clear.run.day === 1);
check("clearing a shift heals", clear.run.hp === 100, String(clear.run.hp));
check("a perfect pass heals more", clear.heal === RUN.perfectHeal, String(clear.heal));
check("clearing earns XP", clear.xp > 0 && clear.run.xp === clear.xp);
check("clearing records the shift", Boolean(clear.run.cleared["c1-1"]));
check("best day tracks the furthest run", clear.run.bestDay === 1);

const partial = clearCase(emptyRun(), { conceptId: "c1-2", levelIndex: 2, ratio: 0.6, delayedPass: false, now: T0 });
check("a partial pass heals less than a perfect one", partial.heal === RUN.clearHeal, String(partial.heal));
check("a partial pass earns less XP than a perfect one", partial.xp < clear.xp);

const delayed = clearCase(emptyRun(), { conceptId: "c1-3", levelIndex: 3, ratio: 0.8, delayedPass: true, now: T0 });
check("a delayed pass heals more", delayed.heal === RUN.clearHeal + RUN.delayedHeal, String(delayed.heal));
check("a delayed pass doubles the XP",
  delayed.xp === Math.round(5 * 10 * 0.8 * 2), String(delayed.xp));

/* ---- XP rules ---------------------------------------------------------- */

check("a correct gate pays", xpForGate(true) === 5);
check("a wrong gate pays nothing", xpForGate(false) === 0);
check("a retry pays less than a first attempt",
  xpForExit({ marks: 5, ratio: 1, delayedPass: false, attempt: 2 }) <
  xpForExit({ marks: 5, ratio: 1, delayedPass: false, attempt: 1 }));
check("accuracy decides the XP",
  xpForExit({ marks: 5, ratio: 0.4, delayedPass: false, attempt: 1 }) <
  xpForExit({ marks: 5, ratio: 1, delayedPass: false, attempt: 1 }));
check("time in the app earns nothing — there is no such input", Object.keys({ ...xpForExit({ marks: 5, ratio: 1 }) }).length === 0);

/* ---- ranks ------------------------------------------------------------- */

check("a new hire is an intern", rankFor(0).name === "Intern");
check("XP promotes", rankFor(130).name === "Junior DBA", rankFor(130).name);
check("the top rank is reachable", rankFor(5000).name === "Head of Systems");
check("the top rank has no next", rankFor(5000).next === null);
check("progress toward the next rank is a fraction", rankFor(200).progress > 0 && rankFor(200).progress <= 1);

/* ---- audit day --------------------------------------------------------- */

const perfectAudit = auditOutcome(emptyRun(), { paperId: "p2023", marks: 75, total: 75, now: T0 });
check("full marks cost no standing", perfectAudit.damage === 0 && perfectAudit.run.hp === 100);
check("full marks pass the audit", perfectAudit.bossWon === false);

const halfAudit = auditOutcome(emptyRun(), { paperId: "p2023", marks: 40, total: 75, now: T0 });
check("a shortfall costs standing", halfAudit.damage > 0, String(halfAudit.damage));
check("a pass at 50%+ does not fail the audit", halfAudit.bossWon === false);

const badAudit = auditOutcome(emptyRun(), { paperId: "p2023", marks: 20, total: 75, now: T0 });
check("below half the committee fails you", badAudit.bossWon === true);
check("failing the audit costs extra", badAudit.damage > halfAudit.damage);
check("the audit is recorded against the paper", Boolean(badAudit.run.bossCleared["p2023"]));

const fatalAudit = auditOutcome({ ...emptyRun(), hp: 15 }, { paperId: "p2023", marks: 5, total: 75, now: T0 });
check("an audit can end the run", fatalAudit.terminated === true && fatalAudit.run.hp === 0);
check("the audit sequence plays at full severity", fatalAudit.severity === 5);

/* ---- death and the new shift ------------------------------------------- */

const dead = { ...emptyRun(), hp: 0, status: "terminated", deaths: 2, bestDay: 11, xp: 400, day: 11 };
const fresh = newShift(dead, T0);
check("a new shift restores standing", fresh.hp === 100 && fresh.status === "active");
check("a new shift resets the map", Object.keys(fresh.cleared).length === 0 && fresh.day === 0);
check("a new shift resets XP", fresh.xp === 0);
check("the death count survives", fresh.deaths === 2);
check("the best day survives", fresh.bestDay === 11);

/* ---- HUD states and the closing line ----------------------------------- */

check("full health is stable", hpState({ hp: 100, maxHp: 100 }).state === "stable");
check("half health is strain", hpState({ hp: 50, maxHp: 100 }).state === "strain");
check("low health is critical", hpState({ hp: 10, maxHp: 100 }).state === "critical");
check("the percentage is computed", hpState({ hp: 25, maxHp: 100 }).percent === 25);
check("an early death gets a different line than a late one",
  terminationLine({ day: 1 }) !== terminationLine({ day: 22 }));

console.log(`\n${passed} run checks passed, ${failures.length} failed.\n`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL  ${f}`);
  process.exitCode = 1;
}
