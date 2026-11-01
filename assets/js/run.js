/**
 * The run — one career at the exam cell.
 *
 * Health is your standing with the department. Every shift you fail costs some
 * of it, and the cost rises with the shift number, so the run gets more brutal
 * as it goes. At zero the run ends and you start a new shift; the *study*
 * record (attempts, mistakes, calibration) is never deleted, because punishing
 * a game death by destroying revision history would be indefensible.
 *
 * Pure functions, no clock of its own: the caller passes `now`.
 */

export const RUN = {
  maxHp: 100,
  startHp: 100,

  /** Failing shift n costs this much. Shift 1 = 9, shift 26 = 34. */
  failDamage(levelIndex) {
    return 8 + Math.max(1, levelIndex);
  },

  /** Clearing a shift gives a little standing back. */
  clearHeal: 5,
  perfectHeal: 10,
  delayedHeal: 14,

  /** Audit day: the shortfall against 75 marks comes out of your health. */
  auditMaxDamage: 45,
  auditFailExtra: 10,

  ranks: [
    { xp: 0, name: "Intern" },
    { xp: 120, name: "Junior DBA" },
    { xp: 320, name: "DBA" },
    { xp: 700, name: "Senior DBA" },
    { xp: 1200, name: "Head of Systems" },
  ],
};

export function emptyRun() {
  return {
    startedAt: null,
    hp: RUN.startHp,
    maxHp: RUN.maxHp,
    xp: 0,
    day: 0,
    cleared: {},
    bossCleared: {},
    deaths: 0,
    bestDay: 0,
    status: "active", // active | terminated | survived
    lastDamage: null,
    lastHeal: null,
  };
}

/** How hard the failure sequence plays, 1 (quiet) to 5 (brutal). */
export function severityFor(levelIndex) {
  if (levelIndex <= 5) return 1;
  if (levelIndex <= 10) return 2;
  if (levelIndex <= 16) return 3;
  if (levelIndex <= 21) return 4;
  return 5;
}

export function damageFor(levelIndex) {
  return RUN.failDamage(levelIndex);
}

/** XP for a prediction gate: answered correctly or not. */
export function xpForGate(correct) {
  return correct ? 5 : 0;
}

/**
 * XP for an exit check. Accuracy decides it, and a delayed pass doubles it —
 * time spent in the app earns nothing, by design.
 */
export function xpForExit({ marks, ratio, delayedPass, attempt = 1 }) {
  const base = Math.round(marks * 10 * ratio);
  const retryPenalty = attempt > 1 ? 0.4 : 1;
  const delayedBonus = delayedPass ? 2 : 1;
  return Math.round(base * retryPenalty * delayedBonus);
}

export function rankFor(xp) {
  let current = RUN.ranks[0];
  let next = null;
  for (const rank of RUN.ranks) {
    if (xp >= rank.xp) current = rank;
    else if (!next) next = rank;
  }
  const span = next ? next.xp - current.xp : 1;
  const into = next ? xp - current.xp : 1;
  return {
    name: current.name,
    xp,
    next: next ? next.name : null,
    nextAt: next ? next.xp : null,
    progress: next ? Math.min(1, into / span) : 1,
  };
}

function clampHp(value, max) {
  return Math.max(0, Math.min(max, value));
}

/**
 * A failed shift: the boss comes down the aisle. Returns the new run plus what
 * the sequence needs to play.
 */
export function failCase(run, { conceptId, levelIndex, now }) {
  if (run.status !== "active") return { run, damage: 0, terminated: false, severity: 1 };
  const damage = damageFor(levelIndex);
  const hp = clampHp(run.hp - damage, run.maxHp);
  const terminated = hp <= 0;
  const next = {
    ...run,
    hp,
    status: terminated ? "terminated" : "active",
    deaths: terminated ? run.deaths + 1 : run.deaths,
    lastDamage: { conceptId, amount: damage, at: now, levelIndex },
    lastHeal: null,
  };
  return {
    run: next,
    damage,
    terminated,
    severity: severityFor(levelIndex),
    bossLine: terminated ? "Clear your desk. Security will walk you out." : null,
  };
}

/** A cleared shift: the day advances and some standing comes back. */
export function clearCase(run, { conceptId, levelIndex, ratio, delayedPass, now }) {
  if (run.status !== "active") return { run, heal: 0, xp: 0 };
  const attempt = (run.cleared[conceptId]?.attempts || 0) + 1;
  const xp = xpForExit({ marks: 5, ratio, delayedPass, attempt });
  const heal =
    (ratio >= 0.999 ? RUN.perfectHeal : RUN.clearHeal) + (delayedPass ? RUN.delayedHeal : 0);
  const hp = clampHp(run.hp + heal, run.maxHp);
  const day = run.day + 1;

  return {
    run: {
      ...run,
      hp,
      xp: run.xp + xp,
      day,
      bestDay: Math.max(run.bestDay, day),
      cleared: {
        ...run.cleared,
        [conceptId]: { at: now, ratio, attempts: attempt, levelIndex },
      },
      lastHeal: { conceptId, amount: heal, at: now },
      lastDamage: null,
    },
    heal,
    xp,
  };
}

/** Audit day against a verified paper: marks deal damage to the paper, shortfall to you. */
export function auditOutcome(run, { paperId, marks, total, now }) {
  const shortfall = Math.max(0, total - marks);
  const base = Math.round((shortfall / total) * RUN.auditMaxDamage);
  const failedAudit = marks / total < 0.5;
  const damage = base + (failedAudit ? RUN.auditFailExtra : 0);
  const hp = clampHp(run.hp - damage, run.maxHp);
  const terminated = hp <= 0;

  return {
    run: {
      ...run,
      hp,
      status: terminated ? "terminated" : "active",
      deaths: terminated ? run.deaths + 1 : run.deaths,
      bossCleared: { ...run.bossCleared, [paperId]: { marks, total, at: now, passed: !failedAudit } },
      lastDamage: { paperId, amount: damage, at: now, levelIndex: 26 },
      lastHeal: null,
    },
    damage,
    bossWon: failedAudit,
    terminated,
    severity: failedAudit ? 5 : severityFor(Math.round((shortfall / total) * 26)),
  };
}

/** A new shift after a death: HP and the map reset, the study record does not. */
export function newShift(run, now) {
  return {
    ...emptyRun(),
    startedAt: now,
    deaths: run.deaths,
    bestDay: run.bestDay,
  };
}

export function hpState(run) {
  const percent = Math.round((run.hp / run.maxHp) * 100);
  const state = percent <= 25 ? "critical" : percent <= 50 ? "strain" : "stable";
  return { percent, state };
}

/** The line the game-over card shows, scaled by how far the run got. */
export function terminationLine(run) {
  const day = run.day;
  if (day >= 20) return "Nineteen shifts in and it ends here. That is a long way from the door.";
  if (day >= 10) return "Half a term's worth of tickets, and the last one broke you.";
  if (day >= 4) return "You lasted a few days. The exam cell has seen shorter.";
  return "One shift. The manager did not even learn your name.";
}

/* -------------------------------------------------------------------------
   Severity — what the manager calls it, and what it costs you
   ------------------------------------------------------------------------- */

/**
 * Five levels of trouble. The name is what the game-over card calls the shift;
 * the line is what he says while he is standing at your desk. Severity rises
 * with the shift number, so a late failure is a Final notice and an early one
 * is only a Verbal warning.
 */
export const SEVERITIES = [
  {
    n: 1,
    name: "Verbal warning",
    line: "He taps your desk twice. It goes on your file.",
    duration: 2400,
  },
  {
    n: 2,
    name: "Written warning",
    line: "He writes it down in front of you and does not look up.",
    duration: 2900,
  },
  {
    n: 3,
    name: "Performance review",
    line: "Someone from administration sits in. Nobody offers you a chair.",
    duration: 3400,
  },
  {
    n: 4,
    name: "Last chance",
    line: "He says the word suspension, then says he did not say it.",
    duration: 3900,
  },
  {
    n: 5,
    name: "Final notice",
    line: "Twelve noon. The results are due at twelve noon.",
    duration: 4500,
  },
];

export function severityInfo(n) {
  return SEVERITIES[Math.max(1, Math.min(5, n)) - 1];
}

/** The HP a whole floor can cost, from its first shift to its last. */
export function hpRangeFor(levelIndexes) {
  if (!levelIndexes.length) return { from: 0, to: 0 };
  const values = levelIndexes.map((i) => damageFor(i));
  return { from: Math.min(...values), to: Math.max(...values) };
}

/** Five pips, filled to the severity — the card's "Severity 1 of 5". */
export function severityPips(n) {
  return Array.from({ length: 5 }, (_, i) => i < n);
}

/** A one-line read on standing, for under the health bar. */
export function standingLine(run) {
  const { percent } = hpState(run);
  if (run.status === "terminated") return "You no longer work here.";
  if (percent >= 90) return "Standing is stable.";
  if (percent >= 70) return "Someone has noticed.";
  if (percent >= 50) return "The manager is keeping a file.";
  if (percent >= 25) return "One more bad shift and this is over.";
  return "HR have started typing.";
}
