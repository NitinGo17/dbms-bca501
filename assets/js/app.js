/**
 * The student client — a renderer and a state machine over the content store.
 *
 * No teaching copy lives here (AC-7.3). This file decides what the shift shows,
 * in what order, and what gets recorded: the ticket, the gate, the fix, the
 * damage, and the sequence when the manager walks down the aisle.
 */

import {
  SUBJECT,
  UNITS,
  CONCEPTS,
  CONCEPT_BY_ID,
  UNIT_BY_ID,
  UNIT_WEIGHTS,
  UNIT_ORDER,
  ITEMS,
  PAPERS,
  MISCONCEPTIONS,
  SCHEDULE,
  unitConcepts,
  chunkStatus,
  unitProgress,
  studiedUnits,
  publishGate,
} from "./content.js";
import { CASES, FLOORS, caseFor, floorFor } from "./data/cases.js";
import { officeToday } from "./data/office.js";
import * as sound from "./audio.js";
import {
  RUN,
  emptyRun,
  damageFor,
  severityFor,
  xpForGate,
  rankFor,
  failCase,
  clearCase,
  auditOutcome,
  newShift,
  hpState,
  terminationLine,
  severityInfo,
  severityPips,
  hpRangeFor,
  standingLine,
} from "./run.js";
import {
  markAttempt,
  beatsToReplay,
  scheduleAfter,
  dueConcepts,
  selectRetrievalSet,
  logMistake,
  resolveMistakes,
  rankMistakes,
  exportMistakes,
  calibration,
  calibrationVerdict,
  marksBudget,
  examReport,
  formatMarks,
  formatDuration,
  CONFIDENCE,
} from "./engine.js";
import { loadState, saveState, clearState, downloadFile, showToast } from "./store.js";
import { renderFigure, esc } from "./figures.js";

/* ==========================================================================
   Boot
   ========================================================================== */

const main = document.getElementById("view");
const rail = document.getElementById("rail");
const hud = document.getElementById("hud");
const sceneHost = document.getElementById("scene");
const gate = publishGate();

let { state, persisted } = loadState();
let ticker = null;
let sceneTimer = null;
let footstepTimer = null;
let sceneFinish = null;
let lastRouteKey = null;

const itemStages = new Map();
const player = { conceptId: null, gateAnswered: false, gateSkipped: false };
const exam = { paperId: null };

const STATUS_LABEL = {
  locked: "Locked",
  available: "Ready",
  "check-pending": "Check pending",
  complete: "Cleared",
};

function now() {
  return Date.now();
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pct(n) {
  return `${Math.round(n * 100)}%`;
}

function shortDate(ms) {
  return new Date(ms).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function levelIndexFor(conceptId) {
  const ordered = UNIT_ORDER.flatMap((unitId) => unitConcepts(unitId).map((c) => c.id));
  return ordered.indexOf(conceptId) + 1;
}

/* ==========================================================================
   Router
   ========================================================================== */

function route() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (ticker) {
    window.clearInterval(ticker);
    ticker = null;
  }
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "floor" && parts[1]) return { name: "floor", unitId: parts[1] };
  if (parts[0] === "case" && parts[1]) return { name: "case", conceptId: parts[1] };
  if (parts[0] === "review") return { name: "review", unitId: parts[1] || null };
  if (parts[0] === "incidents") return { name: "incidents" };
  if (parts[0] === "readiness") return { name: "readiness" };
  if (parts[0] === "audit" && parts[1] && parts[2] === "report") {
    return { name: "audit-report", paperId: parts[1] };
  }
  if (parts[0] === "audit" && parts[1]) return { name: "audit-run", paperId: parts[1] };
  if (parts[0] === "audit") return { name: "audit-list" };
  if (parts[0] === "manual") return { name: "manual" };
  if (parts[0] === "terminated") return { name: "terminated" };
  return { name: "home" };
}

function navigate(hash) {
  window.location.hash = hash;
}

function render() {
  const view = route();
  const routeKey = JSON.stringify(view);
  if (routeKey !== lastRouteKey) {
    itemStages.clear();
    lastRouteKey = routeKey;
    hideScene();
  }
  if (view.name !== "case") player.conceptId = null;

  const views = {
    home: renderHome,
    floor: () => renderFloor(view.unitId),
    case: () => renderCase(view.conceptId),
    review: () => renderReview(view.unitId),
    incidents: renderIncidents,
    readiness: renderReadiness,
    "audit-list": renderAuditList,
    "audit-run": () => renderAuditRun(view.paperId),
    "audit-report": () => renderAuditReport(view.paperId),
    manual: renderManual,
    terminated: renderTerminated,
  };

  main.innerHTML = (views[view.name] || renderHome)();
  renderHud();
  renderRail(view);
  bindView(view);
  const heading = main.querySelector("h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

/* ==========================================================================
   HUD
   ========================================================================== */

function avatarFigure() {
  return `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <rect width="40" height="40" fill="#111a21"/>
    <circle cx="20" cy="15" r="7" fill="#8fa3b0"/>
    <path d="M6 40c0-8 6.4-13 14-13s14 5 14 13z" fill="#2c3f4c"/>
    <path d="M17 22h6l-3 8z" fill="#f0a93c"/>
  </svg>`;
}

function renderHud() {
  const run = state.run;
  const hp = hpState(run);
  const rank = rankFor(run.xp);
  const total = CONCEPTS.length;
  const shift = Math.min(run.day + 1, total);

  hud.innerHTML = `
    <div class="hud__identity">
      <span class="hud__avatar">${avatarFigure()}</span>
      <span class="hud__rank">
        <strong>${esc(rank.name)}</strong>
        <span class="hud__xp">${run.xp} XP${rank.next ? ` · ${Math.max(0, rank.nextAt - run.xp)} to ${esc(rank.next)}` : " · top of the ladder"}</span>
      </span>
    </div>
    <div class="hud__vitals">
      <div class="hud__vitals-top">
        <div class="hp" role="group" aria-label="Standing with the department: ${run.hp} of ${run.maxHp}">
          <span>HP</span>
          <span class="hp__track"><span class="hp__fill hp__fill--${hp.state}" style="width:${hp.percent}%"></span></span>
          <span class="hp__value">${run.hp}<small>/${run.maxHp}</small></span>
        </div>
        <p class="hud__shift">Shift <strong>${String(shift).padStart(2, "0")}</strong> / ${total}</p>
      </div>
      <span class="hud__standing">${esc(standingLine(run))}</span>
    </div>
    <div class="hud__actions">
      <button class="hud__btn" type="button" data-sound aria-pressed="${sound.isEnabled()}">${sound.isEnabled() ? "Sound off" : "Sound on"}</button>
      <a class="hud__btn hud__btn--audit" href="#/audit">Audit day</a>
    </div>`;

  const soundBtn = hud.querySelector("[data-sound]");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const on = sound.setEnabled(!sound.isEnabled());
      if (on) sound.click();
      renderHud();
      showToast(
        on
          ? "Sound on — footsteps, a heartbeat, a flatline. All synthesised, no files."
          : "Sound off.",
      );
    });
  }
}

/* ==========================================================================
   Rail
   ========================================================================== */

function renderRail(view) {
  const links = [
    { hash: "#/", label: "The building", num: "§" },
    { hash: "#/review", label: "Due today", num: "1" },
    { hash: "#/incidents", label: "Open incidents", num: "2" },
    { hash: "#/readiness", label: "Readiness", num: "3" },
    { hash: "#/audit", label: "Audit day", num: "4" },
    { hash: "#/manual", label: "Field manual", num: "5" },
  ];

  const currentHash =
    view.name === "home" ? "#/"
    : view.name === "review" ? "#/review"
    : view.name === "incidents" ? "#/incidents"
    : view.name === "readiness" ? "#/readiness"
    : view.name === "manual" ? "#/manual"
    : view.name.startsWith("audit") ? "#/audit"
    : "";

  const floors = UNITS.map((unit) => {
    const floor = floorFor(unit.id);
    const progress = unitProgress(state, unit.id);
    const active = view.name === "floor" && view.unitId === unit.id;
    return `<li>
      <a class="rail__link" href="#/floor/${unit.id}"${active ? ' aria-current="page"' : ""}>
        <span class="rail__num" aria-hidden="true">${esc(floor.numeral)}</span>
        <span>${esc(floor.name)}</span>
        <span class="rail__count" title="${progress.done} of ${progress.total} cleared">${progress.done}/${progress.total}</span>
      </a>
    </li>`;
  }).join("");

  rail.innerHTML = `
    <p class="rail__section-label">${esc(SUBJECT.code)} · Exam cell</p>
    <nav aria-label="Sections">
      <ul>
        ${links
          .map(
            (l) => `<li><a class="rail__link" href="${l.hash}"${currentHash === l.hash ? ' aria-current="page"' : ""}>
              <span class="rail__num" aria-hidden="true">${l.num}</span><span>${esc(l.label)}</span>
            </a></li>`,
          )
          .join("")}
      </ul>
    </nav>
    <p class="rail__section-label">Floors</p>
    <nav aria-label="Floors"><ul>${floors}</ul></nav>
    ${
      persisted
        ? ""
        : `<p class="rail__section-label" style="color:var(--red)">Storage blocked</p>
           <p class="small muted">Progress is in memory for this session only.</p>`
    }
  `;
}

/* ==========================================================================
   Shared components
   ========================================================================== */

function colophon() {
  return `<footer class="colophon">
    <p>${esc(SUBJECT.university)} · ${esc(SUBJECT.programme)} · ${esc(SUBJECT.code)} ${esc(SUBJECT.title)}. Floors 1–4 and the vault. Unit V is not on the map.</p>
    <p>Audit days use the verified papers of ${esc(SUBJECT.papers)}. The mark schemes are written for this platform, not by the university.</p>
  </footer>`;
}

function nodeFor(concept) {
  const status = chunkStatus(state, concept.id);
  const c = caseFor(concept.id);
  const levelIndex = levelIndexFor(concept.id);
  const locked = status === "locked";
  const failed =
    !locked && status !== "complete" && state.concepts[concept.id]?.status === "check-pending";
  const cls = locked ? "locked" : status === "complete" ? "cleared" : failed ? "failed" : "current";
  const tag = locked ? "div" : "a";
  const attrs = locked ? 'aria-disabled="true"' : `href="#/case/${concept.id}"`;
  return `<li>
    <${tag} class="node node--${cls}" ${attrs}>
      <span class="node__top">
        <span class="node__no">${String(levelIndex).padStart(2, "0")}</span>
        <span class="node__dot" aria-hidden="true"></span>
      </span>
      <span class="node__title">${esc(concept.title)}</span>
      <span class="node__ticket">${esc(c ? c.ticket : "")}${locked ? " · locked" : status === "complete" ? " · cleared" : ""}</span>
      <span class="node__cost">−${damageFor(levelIndex)} HP if failed</span>
    </${tag}>
  </li>`;
}

function floorCard(unitId) {
  const floor = floorFor(unitId);
  const unit = UNIT_BY_ID[unitId];
  const progress = unitProgress(state, unitId);
  const range = hpRangeFor(unitConcepts(unitId).map((c) => levelIndexFor(c.id)));
  return `<section class="floor floor--${esc(floor.id)}" aria-labelledby="floor-${esc(floor.id)}">
    <div class="floor__head">
      <span class="floor__num" aria-hidden="true">${esc(floor.numeral)}</span>
      <div>
        <h2 class="floor__title" id="floor-${esc(floor.id)}">Floor ${esc(floor.numeral)} · ${esc(floor.name)}</h2>
        <p class="floor__blurb">${esc(floor.blurb)}</p>
      </div>
      <p class="floor__meta">
        <span>${progress.done}/${progress.total} cleared</span>
        <span>−${range.from} to −${range.to} HP</span>
      </p>
    </div>
    <div class="floor__body">
      <ul class="map">${unitConcepts(unitId).map((c) => nodeFor(c)).join("")}</ul>
    </div>
    <p class="floor__foot">${esc(unit.weightBasis)}</p>
  </section>`;
}

function renderOffice() {
  const { colleagues, wire } = officeToday(new Date());
  return `<section class="office" aria-labelledby="office-heading">
    <div>
      <h2 id="office-heading">The office</h2>
      <p class="office__lede">Simulated colleagues. There is no server in this build, so nobody here is a real player; they work the same tickets on a schedule fixed by the calendar, and every device sees the same roster.</p>
      <p class="office__label">Head count</p>
      <table class="roster">
        <caption class="visually-hidden">Colleagues, their roles, and the shift they have reached</caption>
        <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Shift</th></tr></thead>
        <tbody>
          ${colleagues
            .map(
              (person) => `<tr>
                <td>${esc(person.name)}<span class="npc">NPC</span></td>
                <td>${esc(person.role)}</td>
                <td class="tabular">${String(person.shift).padStart(2, "0")}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div>
      <p class="office__label">Office wire</p>
      <ul class="wire">
        ${wire
          .map(
            (entry) => `<li>
              <span class="wire__at">${esc(entry.at)}</span>
              <span class="wire__who">${esc(entry.who)}</span>
              <span class="${entry.kind === "note" ? "wire__note" : ""}">${esc(entry.text)}</span>
            </li>`,
          )
          .join("")}
      </ul>
    </div>
  </section>`;
}

function renderHome() {
  const run = state.run;
  const due = dueConcepts(state.concepts, now());
  const queue = rankMistakes(state.mistakes, UNIT_WEIGHTS, now());
  const cleared = Object.keys(run.cleared).length;

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">${esc(SUBJECT.university)} · ${esc(SUBJECT.code)}</p>
        <h1 style="font-size:var(--text-2xl)">The exam cell</h1>
        <p class="lede">You are the new database administrator. ${CONCEPTS.length} tickets are open across five floors, and each one is a real fault in the college's records. Fail a shift and the manager comes down the aisle.</p>
      </header>

      <div class="card stack" style="margin-block-start:var(--space-4)">
        <div class="card__head">
          <p class="eyebrow">Where you stand</p>
          <p class="small muted">${cleared} of ${CONCEPTS.length} cleared · ${run.deaths} run${run.deaths === 1 ? "" : "s"} ended</p>
        </div>
        <p>${due.length + queue.length === 0
          ? "Nothing is due and nothing is logged. Pick a ticket and start the shift."
          : `${due.length} concept${due.length === 1 ? "" : "s"} due for revision and ${queue.length} open incident${queue.length === 1 ? "" : "s"}. Both are worth clearing before the next audit.`}</p>
        <p class="row">
          <a class="btn" href="#/review">Due today</a>
          <a class="btn btn--ghost" href="#/incidents">Open incidents</a>
        </p>
      </div>

      ${UNITS.map((unit) => floorCard(unit.id)).join("")}
      ${renderOffice()}
      ${colophon()}
    </div>`;
}

function renderFloor(unitId) {
  const unit = UNIT_BY_ID[unitId];
  if (!unit) return renderHome();
  const floor = floorFor(unitId);
  const progress = unitProgress(state, unitId);
  const studied = studiedUnits(state);
  const hasEarlier = studied.some((u) => u !== unitId);

  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Floor ${esc(floor.numeral)} · ${progress.done} of ${progress.total} cleared</p>
        <h1 style="font-size:var(--text-2xl)">${esc(floor.name)}</h1>
        <p class="lede">${esc(unit.syllabus)}</p>
        <p class="small muted">${esc(floor.blurb)}</p>
      </header>

      ${floorCard(unitId)}

      <div class="card" style="margin-block-start:var(--space-5)">
        <p class="eyebrow">Retrieval set</p>
        <p style="margin-block-start:var(--space-2)">Ten items drawn only from this floor${hasEarlier ? `, at least ${pct(SCHEDULE.interleaveRatio)} interleaved from floors you have already worked` : ""}.</p>
        <p style="margin-block-start:var(--space-3)">
          ${progress.done === 0
            ? `<span class="badge">Locked until one ticket is cleared</span>`
            : `<a class="btn" href="#/review/${unitId}">Start the set</a>`}
        </p>
      </div>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   The case desk
   ========================================================================== */

function bossPortrait() {
  return `<svg viewBox="0 0 64 74" aria-hidden="true" focusable="false">
    <rect width="64" height="74" fill="#111a21"/>
    <circle cx="32" cy="26" r="13" fill="#0a1014"/>
    <circle cx="27" cy="25" r="2.2" fill="#f0665a"/>
    <circle cx="37" cy="25" r="2.2" fill="#f0665a"/>
    <path d="M32 39l-6 4v31h12V43z" fill="#1b2830"/>
    <path d="M26 43h12l-6 12z" fill="#f0665a" opacity=".85"/>
    <path d="M14 48c0-3 5-5 12-5v26H14zM50 48c0-3-5-5-12-5v26h12z" fill="#0d151a"/>
  </svg>`;
}

function ticketBlock(concept) {
  const c = caseFor(concept.id);
  if (!c) return "";
  const floor = floorFor(concept.unit);
  return `<div class="ticket">
    <div class="ticket__head">
      <span>Ticket ${esc(c.ticket)}</span>
      <span>${esc(SUBJECT.code)} · ${esc(floor.name)}</span>
    </div>
    <div class="ticket__body">
      <div class="ticket__row"><span class="ticket__key">Reported by</span><span class="ticket__val">${esc(c.reporter)}</span></div>
      <div class="ticket__row"><span class="ticket__key">Fault</span><span class="ticket__val">${esc(c.subject)}</span></div>
      <div class="ticket__row"><span class="ticket__key">Deadline</span><span class="ticket__val">${esc(c.deadline)}</span></div>
      <div class="ticket__row"><span class="ticket__key">If it stays open</span><span class="ticket__val ticket__val--stake">${esc(c.stake)}</span></div>
      <div class="ticket__row"><span class="ticket__key">Your toolset</span><span class="ticket__val">${esc(c.toolset)}</span></div>
    </div>
  </div>`;
}

function threatCard(levelIndex) {
  const damage = damageFor(levelIndex);
  const sev = severityInfo(severityFor(levelIndex));
  const pips = severityPips(sev.n);
  return `<div class="threat">
    <div class="threat__grid">
      <span class="threat__portrait">${bossPortrait()}</span>
      <div>
        <p class="threat__label">If this fix fails</p>
        <p class="threat__warning" style="margin-block-start:var(--space-2)"><strong>${esc(sev.name)}.</strong> ${esc(sev.line)}</p>
        <p class="threat__pips">
          <span class="pips" aria-hidden="true">${pips.map((on) => `<span data-on="${on}"></span>`).join("")}</span>
          <span>Severity ${sev.n} of 5</span>
        </p>
      </div>
      <p class="threat__damage">−${damage} HP</p>
    </div>
    <div class="threat__bar"><span style="width:${Math.min(100, Math.round((damage / 40) * 100))}%"></span></div>
  </div>`;
}

function renderCase(conceptId) {
  const concept = CONCEPT_BY_ID[conceptId];
  if (!concept) return renderHome();

  const status = chunkStatus(state, conceptId);
  const levelIndex = levelIndexFor(conceptId);

  if (status === "locked") {
    const index = unitConcepts(concept.unit).findIndex((c) => c.id === conceptId);
    const previous = unitConcepts(concept.unit)[index - 1];
    return `<div class="view">
      <p class="eyebrow">Ticket ${esc(caseFor(conceptId)?.ticket || "")}</p>
      <h1 style="font-size:var(--text-2xl)">Not your ticket yet</h1>
      <p class="lede" style="margin-block-start:var(--space-3)">This one opens when <a href="#/case/${previous.id}">${esc(previous.title)}</a> is cleared. The queue is worked in order — that is what makes the floor a floor and not a list.</p>
      <p style="margin-block-start:var(--space-4)"><a class="btn btn--ghost" href="#/floor/${concept.unit}">Back to the floor</a></p>
    </div>`;
  }

  if (player.conceptId !== conceptId) {
    player.conceptId = conceptId;
    player.gateAnswered = false;
    player.gateSkipped = false;
    if (state.concepts[conceptId]?.status === "complete") player.gateAnswered = true;
  }

  const floor = floorFor(concept.unit);
  const index = unitConcepts(concept.unit).findIndex((c) => c.id === conceptId);
  const next = unitConcepts(concept.unit)[index + 1];
  const enrich = (item) =>
    ITEMS.find((i) => i.id === item.id) || { ...item, conceptId: concept.id, unit: concept.unit };
  const exitSource = concept.items.find((i) => i.kind === "exit") || concept.items[0];
  const exitItem = enrich(exitSource);
  const practice = concept.items.filter((i) => i.id !== exitSource.id).map(enrich);
  const gateRecord = state.gates.filter((g) => g.conceptId === conceptId).slice(-1)[0];
  const exitStage = itemStages.get(exitItem.id);
  const exitPassed =
    (exitStage && exitStage.marked && exitStage.marked.ratio >= 0.5) ||
    state.concepts[conceptId]?.status === "complete";

  return `
    <div class="view">
      <header>
        <p class="eyebrow">Floor ${esc(floor.numeral)} · ${esc(floor.name)} · shift ${String(levelIndex).padStart(2, "0")} of ${CONCEPTS.length}</p>
        <h1 class="case-title">${esc(concept.title)}</h1>
      </header>

      ${ticketBlock(concept)}
      ${threatCard(levelIndex)}

      <div class="script" style="margin-block-start:var(--space-5)">
        ${concept.beats.slice(0, 2).map(renderBeat).join("")}
        ${renderGate(concept, gateRecord)}
        ${player.gateAnswered || player.gateSkipped
          ? `<div>${concept.beats.slice(2).map(renderBeat).join("")}</div>`
          : ""}
      </div>

      ${player.gateAnswered || player.gateSkipped
        ? `<section aria-labelledby="exit-heading" style="margin-block-start:var(--space-6)">
             <h2 id="exit-heading" style="font-size:var(--text-xl)">Verify the fix</h2>
             <p class="small muted" style="margin-block-start:var(--space-2)">This is what the manager checks before signing the shift off. Miss it and the shift stays open — and you take the damage.</p>
             ${renderItemCard(exitItem, { isExit: true })}
           </section>
           ${practice.length
             ? `<section aria-labelledby="more-heading" style="margin-block-start:var(--space-7)">
                  <h2 id="more-heading" style="font-size:var(--text-xl)">The rest of the file</h2>
                  <p class="small muted" style="margin-block-start:var(--space-2)">Two more items on the same fault. They do not gate the shift, but every miss becomes an incident.</p>
                  ${practice.map((item) => renderItemCard(item, { isExit: false })).join("")}
                </section>`
             : ""}
           ${exitPassed
             ? next
               ? `<p style="margin-block-start:var(--space-6)"><a class="btn" href="#/case/${next.id}">Next ticket: ${esc(next.title)}</a></p>`
               : `<p style="margin-block-start:var(--space-6)"><a class="btn" href="#/review/${concept.unit}">Floor cleared — start the retrieval set</a></p>`
             : `<p class="small muted" style="margin-block-start:var(--space-5)">The next ticket opens when this fix is verified.</p>`}`
        : `<p class="small muted" style="margin-block-start:var(--space-5)">Answer the manager's question above, or skip it and read on. A skip is recorded and flags this ticket.</p>`}
      ${colophon()}
    </div>`;
}

function renderBeat(beat) {
  const kindLabel = {
    problem: "The fault",
    failure: "The obvious fix, and why it fails",
    mechanism: "The fix",
    cost: "What the fix costs",
  }[beat.kind] || beat.kind;
  return `<article class="beat">
    <span class="beat__kind beat__kind--${beat.kind}">${esc(kindLabel)}</span>
    <p class="beat__text">${esc(beat.text)}</p>
    ${renderFigure(beat.figure)}
  </article>`;
}

function renderGate(concept, record) {
  const gateData = concept.gate;
  const answered = record && !record.skipped;
  const skipped = record && record.skipped;

  const options = gateData.options
    .map((option, i) => {
      let result = "";
      if (answered) {
        if (option.correct) result = ' data-result="hit"';
        else if (record.chosenIndex === i) result = ' data-result="miss"';
      }
      return `<li><button class="gate__option" type="button" data-gate-option="${i}"${result}${
        answered || skipped ? " disabled" : ""
      }>${esc(option.text)}</button></li>`;
    })
    .join("");

  const verdict = answered
    ? `<div class="gate__verdict">
         <strong>${record.correct ? "Correct" : "Not this one"}</strong>
         ${esc(gateData.options[record.chosenIndex]?.why || "")}
       </div>`
    : skipped
      ? `<div class="gate__verdict"><strong>Skipped</strong>Recorded, and this ticket is now flagged. The manager remembers which ones you did not answer.</div>`
      : "";

  return `<div class="gate">
    <div class="gate__flag">
      <span>The manager asks, before you commit</span>
      <span aria-hidden="true">·</span>
    </div>
    <p class="gate__prompt" id="gate-prompt-${esc(gateData.id)}">${esc(gateData.prompt)}</p>
    <ul class="gate__options" aria-labelledby="gate-prompt-${esc(gateData.id)}">${options}</ul>
    ${verdict}
    ${answered || skipped
      ? ""
      : `<p style="margin-block-start:var(--space-3)"><button class="btn btn--quiet" type="button" data-gate-skip>Skip the question and read on</button></p>`}
  </div>`;
}

function renderItemCard(item, { isExit }) {
  const stage = itemStages.get(item.id) || { stage: "answer", answer: "", confidence: null, marked: null };
  itemStages.set(item.id, stage);
  const levelIndex = levelIndexFor(item.conceptId);
  const damage = damageFor(levelIndex);

  const head = `<div class="attempt__head">
      <p class="eyebrow">${isExit ? "Verification" : "File item"} · ${formatMarks(item.marks)} marks</p>
      ${stage.stage === "result"
        ? `<p class="marks ${stage.marked.ratio >= 0.5 ? "marks--hit" : "marks--miss"}">${formatMarks(stage.marked.total)} / ${formatMarks(stage.marked.max)}</p>`
        : ""}
    </div>
    <p class="beat__text">${esc(item.prompt)}</p>`;

  if (stage.stage === "answer") {
    return `<div class="attempt" data-item="${esc(item.id)}">${head}
      <p style="margin-block-start:var(--space-3)">
        <label class="field__legend" for="answer-${esc(item.id)}">What you would do</label>
        <textarea class="answer-input" id="answer-${esc(item.id)}" data-answer placeholder="Write it the way you would say it to the manager. Two or three sentences for a short ticket; structure for a long one.">${esc(stage.answer)}</textarea>
      </p>
      <p style="margin-block-start:var(--space-3)">
        <button class="btn" type="button" data-submit-answer>Submit</button>
        <span class="small muted">The marking scheme stays hidden until you submit.</span>
      </p>
    </div>`;
  }

  if (stage.stage === "confidence") {
    return `<div class="attempt" data-item="${esc(item.id)}">${head}
      <div class="card" style="margin-block-start:var(--space-3);background:var(--panel-2)">
        <fieldset class="field">
          <legend class="field__legend">Before the mark: how sure are you that this holds?</legend>
          <div class="segmented">
            ${Object.entries(CONFIDENCE)
              .map(
                ([key, c]) => `<label class="segmented__option">
                  <input type="radio" name="confidence-${esc(item.id)}" value="${key}" data-confidence${stage.confidence === key ? " checked" : ""}>
                  <span>${esc(c.label)}</span>
                </label>`,
              )
              .join("")}
          </div>
          <p class="field__hint">Recorded against the result and shown on the readiness page. It is not scored, and an honest Low costs nothing.</p>
        </fieldset>
      </div>
      <p style="margin-block-start:var(--space-3)">
        <button class="btn" type="button" data-confirm-confidence>Show the scheme</button>
      </p>
    </div>`;
  }

  if (stage.stage === "marking") {
    return `<div class="attempt" data-item="${esc(item.id)}">${head}
      <div class="card" style="margin-block-start:var(--space-3);background:var(--panel-2)">
        <p class="eyebrow">Marking scheme — tick what your answer actually contains</p>
        <p class="small muted" style="margin-block-start:var(--space-2)">Not what you meant to write. A generous tick hides the gap until the audit.</p>
        <ul class="rubric">
          ${item.rubric
            .map(
              (criterion, i) => `<li class="rubric__item">
                <input type="checkbox" id="crit-${esc(item.id)}-${i}" data-criterion="${i}">
                <label class="rubric__label" for="crit-${esc(item.id)}-${i}">${esc(criterion.label)}
                  <small>If missing, logged as: ${esc(MISCONCEPTIONS[criterion.tag] || criterion.tag)}</small>
                </label>
                <span class="rubric__marks">${formatMarks(criterion.marks)}</span>
              </li>`,
            )
            .join("")}
        </ul>
      </div>
      <p style="margin-block-start:var(--space-3)">
        <button class="btn" type="button" data-finish-marking>Sign off</button>
      </p>
    </div>`;
  }

  const marked = stage.marked;
  const replay = beatsToReplay(marked);
  const concept = CONCEPT_BY_ID[item.conceptId];
  const passed = marked.ratio >= 0.5;

  return `<div class="attempt" data-item="${esc(item.id)}">${head}
    <ul class="rubric" style="margin-block-start:var(--space-3)">
      ${marked.criteria
        .map(
          (c) => `<li class="rubric__item" style="border-color:${c.hit ? "var(--green)" : "var(--red)"};background:${c.hit ? "var(--green-wash)" : "var(--red-wash)"}">
            <span aria-hidden="true" style="font-family:var(--font-mono);color:${c.hit ? "var(--green)" : "var(--red)"}">${c.hit ? "✓" : "×"}</span>
            <span class="rubric__label">${esc(c.label)}</span>
            <span class="rubric__marks">${c.hit ? formatMarks(c.marks) : "0"} / ${formatMarks(c.marks)}</span>
          </li>`,
        )
        .join("")}
    </ul>

    ${passed
      ? `<p class="small" style="margin-block-start:var(--space-3);color:var(--green)">Shift signed off. Standing restored.</p>`
      : `<div class="gate__verdict" style="border-color:var(--red);background:var(--red-wash)">
           <strong style="color:var(--red)">The fix does not hold</strong>
           You scored ${formatMarks(marked.total)} of ${formatMarks(marked.max)}. This ticket stays open and it costs you ${damage} HP.
           ${replay.length
             ? `<p style="margin-block-start:var(--space-2)">The idea you missed is in ${replay.length === 1 ? "one part" : `${replay.length} parts`} above — read ${replay.length === 1 ? "it" : "them"} again:
                ${replay.map((b) => (concept.beats[b] ? `<br><span class="mono small">${esc(concept.beats[b].text.slice(0, 170))}…</span>` : "")).join("")}</p>`
             : ""}
         </div>`}

    <div class="model-answer">
      <h4>What the manager wanted</h4>
      <p>${esc(item.model)}</p>
    </div>

    <p class="dispute">
      <button class="btn btn--quiet" type="button" data-dispute="${esc(item.id)}">Dispute this mark</button>
      <span class="small muted">Self-marking is yours to do; if a criterion is wrong, say so and it is recorded.</span>
    </p>

    ${isExit && !passed
      ? `<p style="margin-block-start:var(--space-3)"><button class="btn" type="button" data-retry="${esc(item.id)}">Try the fix again</button></p>`
      : ""}
  </div>`;
}

/* ==========================================================================
   The failure sequence — first person, corridor, the manager
   ========================================================================== */

function bossFigure() {
  return `<svg viewBox="0 0 120 260" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="bossCoat" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a252d"/>
        <stop offset="1" stop-color="#080d11"/>
      </linearGradient>
    </defs>
    <ellipse cx="60" cy="252" rx="34" ry="6" fill="#000" opacity=".5"/>
    <path d="M60 18c11 0 18 9 18 21s-7 21-18 21-18-9-18-21 7-21 18-21z" fill="#0a1014"/>
    <circle cx="52" cy="40" r="2.6" fill="#f0665a"/>
    <circle cx="68" cy="40" r="2.6" fill="#f0665a"/>
    <path d="M38 62h44l12 34-10 5-4-14v96H40V87l-4 14-10-5z" fill="url(#bossCoat)"/>
    <path d="M60 62l-6 14 6 16 6-16z" fill="#2c3f4c"/>
    <path d="M52 66l8 11 8-11" fill="none" stroke="#3d5566" stroke-width="1.6"/>
    <rect x="74" y="104" width="20" height="26" rx="1.5" fill="#0d151a" stroke="#2c3f4c" stroke-width="1.4"/>
    <path d="M78 110h12M78 116h12M78 122h8" stroke="#3d5566" stroke-width="1.4"/>
    <path d="M40 196h40v10H40z" fill="#0d151a"/>
  </svg>`;
}

function deskFigure() {
  return `<svg viewBox="0 0 300 150" aria-hidden="true" focusable="false">
    <rect x="40" y="96" width="220" height="14" fill="#3a2a1e"/>
    <rect x="40" y="110" width="220" height="40" fill="#241a12"/>
    <g>
      <rect x="86" y="66" width="128" height="9" fill="#cfd3d6"/>
      <rect x="90" y="57" width="120" height="9" fill="#dfe3e6"/>
      <rect x="94" y="48" width="112" height="9" fill="#eef1f3"/>
      <rect x="98" y="39" width="104" height="9" fill="#f6f8f9"/>
      <rect x="118" y="58" width="66" height="16" fill="#c8342a" transform="rotate(-8 151 66)"/>
      <path d="M126 62h48" stroke="#f4d9d6" stroke-width="1.6" transform="rotate(-8 151 66)"/>
    </g>
    <rect x="52" y="86" width="26" height="12" fill="#4a3626"/>
    <rect x="222" y="86" width="26" height="12" fill="#4a3626"/>
  </svg>`;
}

function ecgPath() {
  return "M0 60 H120 l10 -34 l10 68 l10 -34 H260 l12 -18 l10 30 l10 -12 H420 l10 -40 l10 80 l10 -40 H600 l12 -14 l10 22 l10 -8 H820 l10 -30 l10 60 l10 -30 H1000";
}

function hideScene() {
  if (sceneTimer) {
    window.clearTimeout(sceneTimer);
    sceneTimer = null;
  }
  if (footstepTimer) {
    window.clearInterval(footstepTimer);
    footstepTimer = null;
  }
  sceneFinish = null;
  if (sceneHost) {
    sceneHost.hidden = true;
    sceneHost.innerHTML = "";
  }
}

/**
 * The failure. Three stages: the corridor, the verdict, and — if this killed
 * the run — the flatline, then the card. Severity scales the approach, the
 * shake, the dialogue and the name on the card.
 */
function playFailure({ conceptId, levelIndex, damage, severity, lines, terminated, onRetry }) {
  if (!sceneHost) return;
  const concept = CONCEPT_BY_ID[conceptId];
  const c = concept ? caseFor(concept.id) : null;
  const bossLines = lines && lines.length ? lines : (c ? c.boss : ["I asked for one thing."]);
  const sev = severityInfo(severity);
  const hp = hpState(state.run);
  const cells = Array.from({ length: 22 }, (_, i) => i < Math.round((state.run.hp / state.run.maxHp) * 22));

  hideScene();
  sceneHost.hidden = false;

  const rings = Array.from(
    { length: 7 },
    (_, i) => `<span class="scene__ring" style="--inset:${i * 7};--depth:${i * 40}"></span>`,
  ).join("");

  const topbar = `
    <div class="scene__topbar">
      <span>Shift ${String(levelIndex).padStart(2, "0")} · verification failed</span>
      <span class="scene__topbar-right">
        <span>HP</span>
        <span class="scene__hp" aria-hidden="true">${cells.map((on) => `<span data-empty="${!on}"></span>`).join("")}</span>
        <span>−${damage} HP</span>
      </span>
    </div>`;

  const controls = `
    <div class="scene__controls">
      <button class="scene__control" type="button" data-sound-scene>${sound.isEnabled() ? "Sound off" : "Sound on"}</button>
      <button class="scene__control" type="button" data-skip-scene>Skip</button>
    </div>`;

  sceneHost.innerHTML = `
    <div class="scene" style="--sev:${severity}" role="dialog" aria-modal="true" aria-labelledby="scene-title" aria-describedby="scene-desc">
      ${topbar}
      <div class="scene__shake" data-shake="true">
        <div class="scene__corridor">
          <div class="scene__floor"></div>
          ${rings}
          <div class="scene__lights"></div>
          <div class="scene__boss">${bossFigure()}</div>
        </div>
        <div class="scene__desk">${deskFigure()}</div>
        <div class="scene__dialogue">
          ${bossLines.map((line) => `<p class="scene__line">${esc(line)}</p>`).join("")}
        </div>
      </div>
      ${controls}
    </div>`;

  const scene = sceneHost.querySelector(".scene");
  const duration = sev.duration;

  if (sound.isEnabled()) {
    footstepTimer = window.setInterval(() => sound.footstep(severity / 3), 460);
  }

  const finish = () => {
    sceneFinish = null;
    if (sceneTimer) {
      window.clearTimeout(sceneTimer);
      sceneTimer = null;
    }
    if (footstepTimer) {
      window.clearInterval(footstepTimer);
      footstepTimer = null;
    }
    if (sound.isEnabled()) {
      if (terminated) sound.flatline(1.6);
      else sound.heartbeat(severity);
    }
    const statLine = terminated
      ? terminationLine(state.run)
      : "He signs it off anyway and takes it out of your standing. The ticket is still open.";
    scene.innerHTML = `
      ${topbar}
      <div class="scene__ecg" aria-hidden="true">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none">
          <path class="scene__ecg-line" d="${terminated ? ecgPath() : "M0 60 H1000"}"></path>
        </svg>
        <span class="scene__ecg-label">${esc(sev.name)}</span>
      </div>
      <div class="scene__card">
        <p class="scene__kicker">Shift ${String(levelIndex).padStart(2, "0")} · ${esc(sev.name)}</p>
        <h2 class="scene__title" id="scene-title">${terminated ? "Shift terminated" : "Shift not signed off"}</h2>
        <p class="scene__sub" id="scene-desc">${esc(statLine)}</p>
        <div class="scene__stats">
          <span>Damage<strong>−${damage}</strong></span>
          <span>HP left<strong>${state.run.hp}</strong></span>
          <span>Severity<strong class="pips">${severityPips(severity)
            .map((on) => `<span data-on="${on}"></span>`)
            .join("")}</strong></span>
        </div>
        <div class="row" style="justify-content:center">
          ${terminated
            ? `<a class="btn" href="#/terminated">Start a new shift</a>`
            : `<button class="btn" type="button" data-retry-scene>Back to the ticket</button>`}
        </div>
      </div>
      ${controls}`;

    wireSceneControls(scene, { terminated, onRetry });
  };

  const verdict = () => {
    const dialogue = scene.querySelector(".scene__dialogue");
    const desk = scene.querySelector(".scene__desk");
    const corridor = scene.querySelector(".scene__corridor");
    if (!dialogue) return;
    if (corridor) corridor.style.opacity = "0.25";
    if (desk) desk.style.opacity = "0.35";
    scene.insertAdjacentHTML(
      "beforeend",
      `<div class="scene__verdict">
         <p class="scene__verdict-word">${esc(sev.name)}</p>
         <p class="scene__verdict-sub">${esc(bossLines[bossLines.length - 1] || "")}</p>
       </div>`,
    );
    if (sound.isEnabled()) sound.heartbeat(severity);
    sceneTimer = window.setTimeout(finish, 1500);
  };

  sceneFinish = finish;
  wireSceneControls(scene, { terminated, onRetry });
  sceneTimer = window.setTimeout(verdict, duration);
}

function wireSceneControls(scene, { terminated, onRetry }) {
  const skip = scene.querySelector("[data-skip-scene]");
  if (skip) {
    skip.addEventListener("click", () => {
      if (sceneFinish) sceneFinish();
    });
  }

  const soundBtn = scene.querySelector("[data-sound-scene]");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const on = sound.setEnabled(!sound.isEnabled());
      if (on) sound.click();
      soundBtn.textContent = on ? "Sound off" : "Sound on";
    });
  }

  const retry = scene.querySelector("[data-retry-scene]");
  if (retry) {
    retry.addEventListener("click", () => {
      hideScene();
      if (onRetry) onRetry();
    });
  }
}

/* ==========================================================================
   Game over
   ========================================================================== */

function renderTerminated() {
  const run = state.run;
  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Run ended</p>
        <h1 style="font-size:var(--text-3xl)">Cleared out</h1>
        <p class="lede">${esc(terminationLine(run))}</p>
      </header>

      <div class="card stack" style="margin-block-start:var(--space-5)">
        <table class="data-table">
          <caption>What this run was</caption>
          <tbody>
            <tr><th scope="row">Shifts cleared</th><td class="num">${Object.keys(run.cleared).length} of ${CONCEPTS.length}</td></tr>
            <tr><th scope="row">Best day</th><td class="num">${run.bestDay}</td></tr>
            <tr><th scope="row">Runs ended</th><td class="num">${run.deaths}</td></tr>
            <tr><th scope="row">XP at the end</th><td class="num">${run.xp}</td></tr>
          </tbody>
        </table>
        <p class="small">Your study record is kept — every attempt, every open incident, your readiness. A game death should not delete revision history. Starting a new shift resets standing and the floor map only.</p>
        <p><button class="btn" type="button" data-new-shift>Start a new shift</button></p>
      </div>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Review, incidents, readiness
   ========================================================================== */

function renderReview(unitId) {
  if (unitId) return renderRetrievalSet(unitId);

  const due = dueConcepts(state.concepts, now());
  const queue = rankMistakes(state.mistakes, UNIT_WEIGHTS, now());
  const flagged = Object.entries(state.concepts).filter(([, s]) => s.flaggedAt);
  const total = due.length + queue.length + flagged.length;

  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Due today</p>
        <h1 style="font-size:var(--text-2xl)">The morning queue</h1>
        <p class="lede">${total === 0
          ? "Nothing is due. That is the honest answer, not a nudge to do more."
          : `${total} item${total === 1 ? "" : "s"}. Each one shows why it is here.`}</p>
      </header>

      ${flagged.length
        ? `<section style="margin-block-start:var(--space-5)">
             <h2 style="font-size:var(--text-xl)">Flagged — you skipped the question</h2>
             <ul class="map" style="margin-block-start:var(--space-3)">
               ${flagged.map(([id, s]) => {
                 const concept = CONCEPT_BY_ID[id];
                 if (!concept) return "";
                 return `<li><a class="node node--failed" href="#/case/${id}">
                   <span class="node__no">!</span>
                   <span><span class="node__title">${esc(concept.title)}</span>
                   <span class="node__ticket">skipped ${shortDate(s.flaggedAt)}</span></span>
                 </a></li>`;
               }).join("")}
             </ul>
           </section>`
        : ""}

      ${due.length
        ? `<section style="margin-block-start:var(--space-6)">
             <h2 style="font-size:var(--text-xl)">Scheduled</h2>
             <p class="small muted" style="margin-block-start:var(--space-2)">Re-queued at roughly day 1, 3 and 10. A concept is mastered only after a pass at a delay of seven days or more.</p>
             <ul class="map" style="margin-block-start:var(--space-3)">
               ${due.map(({ id, overdueMs }) => {
                 const concept = CONCEPT_BY_ID[id];
                 if (!concept) return "";
                 const days = Math.floor(overdueMs / 86400000);
                 return `<li><a class="node node--current" href="#/case/${id}">
                   <span class="node__no">${esc(UNIT_BY_ID[concept.unit].numeral)}</span>
                   <span><span class="node__title">${esc(concept.title)}</span>
                   <span class="node__ticket">${days > 0 ? `${days}d overdue` : "due today"}</span></span>
                 </a></li>`;
               }).join("")}
             </ul>
           </section>`
        : ""}

      ${queue.length
        ? `<section style="margin-block-start:var(--space-6)">
             <h2 style="font-size:var(--text-xl)">Open incidents, ranked</h2>
             <p class="small muted" style="margin-block-start:var(--space-2)">Priority = recurrence × exam weight × recency. All three shown, so you can disagree with the order.</p>
             <div class="card card--flush" style="margin-block-start:var(--space-3)">
               <table class="data-table">
                 <thead><tr><th scope="col">Ticket</th><th scope="col">What was missed</th><th scope="col">Score</th></tr></thead>
                 <tbody>
                   ${queue.slice(0, 12).map((m) => {
                     const concept = CONCEPT_BY_ID[m.conceptId];
                     return `<tr>
                       <td><a href="#/case/${m.conceptId}">${esc(concept ? concept.title : m.conceptId)}</a><br><span class="small muted">seen ${m.count}×</span></td>
                       <td class="small">${esc(MISCONCEPTIONS[m.tag] || m.tag)}</td>
                       <td class="num">${m.score}</td>
                     </tr>`;
                   }).join("")}
                 </tbody>
               </table>
             </div>
             <p style="margin-block-start:var(--space-3)"><a class="btn btn--ghost" href="#/incidents">The full log</a></p>
           </section>`
        : ""}

      ${total === 0 ? `<p style="margin-block-start:var(--space-5)"><a class="btn" href="#/">Back to the building</a></p>` : ""}
      ${colophon()}
    </div>`;
}

function renderRetrievalSet(unitId) {
  const unit = UNIT_BY_ID[unitId];
  if (!unit) return renderHome();
  const set = selectRetrievalSet(ITEMS, UNIT_ORDER, {
    unitId,
    size: 10,
    seed: Math.floor(now() / 60000) % 100000,
    studiedUnits: studiedUnits(state),
  });

  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Floor ${esc(floorFor(unitId).numeral)} · retrieval set</p>
        <h1 style="font-size:var(--text-2xl)">${esc(floorFor(unitId).name)}</h1>
        <p class="lede">${set.total} items: ${set.total - set.interleavedCount} from this floor, ${set.interleavedCount} interleaved (${pct(set.ratio)}, target ${pct(SCHEDULE.interleaveRatio)}).</p>
        ${set.note ? `<p class="small muted">${esc(set.note)}</p>` : ""}
        ${!set.meetsInterleaveTarget ? `<p class="small" style="color:var(--red)">The interleaving target is not met by this set. That is a defect in the selection, not a judgement about you.</p>` : ""}
      </header>
      <div style="margin-block-start:var(--space-5)">
        ${set.items.map((item) => {
          const concept = CONCEPT_BY_ID[item.conceptId];
          return `<section style="margin-block-start:var(--space-5)">
            <p class="eyebrow">${esc(floorFor(item.unit).name)}${item.unit !== unitId ? " · interleaved" : ""} · ${esc(concept ? concept.title : "")}</p>
            ${renderItemCard(item, { isExit: false })}
          </section>`;
        }).join("")}
      </div>
      ${colophon()}
    </div>`;
}

function renderIncidents() {
  const open = rankMistakes(state.mistakes, UNIT_WEIGHTS, now());
  const resolved = state.mistakes.filter((m) => m.resolvedAt);

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">Open incidents</p>
        <h1 style="font-size:var(--text-2xl)">Everything still standing</h1>
        <p class="lede">One entry per missed criterion, deduplicated. Resolved only by a correct answer seven days or more after the miss — a same-day retry clears nothing.</p>
      </header>

      <div class="row" style="margin-block-start:var(--space-4)">
        <button class="btn btn--ghost" type="button" data-export>Export as CSV</button>
        <span class="small muted">${open.length} open · ${resolved.length} resolved</span>
      </div>

      ${open.length === 0
        ? `<p class="empty" style="margin-block-start:var(--space-5)">No open incidents. Either nothing has been attempted, or nothing has been missed.</p>`
        : `<div class="card card--flush" style="margin-block-start:var(--space-5)">
             <table class="data-table">
               <caption>Ranked by recurrence × exam weight × recency</caption>
               <thead><tr><th scope="col">Ticket</th><th scope="col">Criterion</th><th scope="col">Tag</th><th scope="col">Seen</th><th scope="col">Score</th></tr></thead>
               <tbody>
                 ${open.map((m) => {
                   const concept = CONCEPT_BY_ID[m.conceptId];
                   return `<tr>
                     <td><a href="#/case/${m.conceptId}">${esc(concept ? concept.title : m.conceptId)}</a></td>
                     <td class="small">${esc(m.criterion)}</td>
                     <td class="small">${esc(m.tag)}</td>
                     <td class="num">${m.count}</td>
                     <td class="num">${m.score}</td>
                   </tr>`;
                 }).join("")}
               </tbody>
             </table>
           </div>`}

      ${resolved.length
        ? `<section style="margin-block-start:var(--space-6)">
             <h2 style="font-size:var(--text-xl)">Resolved</h2>
             <div class="card card--flush" style="margin-block-start:var(--space-3)">
               <table class="data-table">
                 <thead><tr><th scope="col">Ticket</th><th scope="col">Criterion</th><th scope="col">Seen</th><th scope="col">Closed</th></tr></thead>
                 <tbody>
                   ${resolved.map((m) => {
                     const concept = CONCEPT_BY_ID[m.conceptId];
                     return `<tr>
                       <td>${esc(concept ? concept.title : m.conceptId)}</td>
                       <td class="small">${esc(m.criterion)}</td>
                       <td class="num">${m.count}</td>
                       <td class="num small">${shortDate(m.resolvedAt)}</td>
                     </tr>`;
                   }).join("")}
                 </tbody>
               </table>
             </div>
           </section>`
        : ""}
      ${colophon()}
    </div>`;
}

function renderReadiness() {
  const overall = calibration(state.attempts);
  const perUnit = UNITS.map((unit) => ({
    unit,
    verdict: calibrationVerdict(state.attempts, unit.id, `Floor ${floorFor(unit.id).numeral}`),
  }));

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">Readiness</p>
        <h1 style="font-size:var(--text-2xl)">Whether your estimate of yourself holds</h1>
        <p class="lede">Confidence is captured before the mark is shown. Over-confidence is what costs marks in the audit and is invisible without instrumentation — so it is measured, with the sample size beside every figure.</p>
      </header>

      ${overall.n === 0
        ? `<p class="empty" style="margin-block-start:var(--space-5)">No graded attempts yet. Clear one shift and this page has something to say.</p>`
        : `<section style="margin-block-start:var(--space-6)">
             <h2 style="font-size:var(--text-xl)">Accuracy by confidence band</h2>
             <p class="small muted" style="margin-block-start:var(--space-2)">Over ${overall.n} attempts. Brier ${overall.brier} — lower is better; 0.25 is what always saying Medium earns.</p>
             <div class="card stack" style="margin-block-start:var(--space-3)">
               ${overall.bands.map((b) => {
                 const width = b.accuracy === null ? 0 : Math.round(b.accuracy * 100);
                 const warn = b.accuracy !== null && b.accuracy < 0.5;
                 return `<div class="band">
                   <span>${esc(b.label)}</span>
                   <span class="band__track"><span class="band__fill${warn ? " band__fill--warn" : ""}" style="width:${width}%"></span></span>
                   <span class="band__value">${b.accuracy === null ? "no data" : `${width}% · n=${b.n}`}</span>
                 </div>`;
               }).join("")}
             </div>
           </section>

           <section style="margin-block-start:var(--space-6)">
             <h2 style="font-size:var(--text-xl)">Verdict by floor</h2>
             <div class="stack" style="margin-block-start:var(--space-3)">
               ${perUnit.map(({ unit, verdict }) => `<div class="card">
                 <div class="card__head">
                   <p class="eyebrow">Floor ${esc(floorFor(unit.id).numeral)} · ${esc(floorFor(unit.id).name)}</p>
                   <span class="badge ${verdict.verdict === "over-confident" ? "badge--miss" : verdict.verdict === "calibrated" ? "badge--complete" : ""}">${esc(verdict.verdict.replace("-", " "))}</span>
                 </div>
                 <p style="margin-block-start:var(--space-2)">${esc(verdict.text)}</p>
               </div>`).join("")}
             </div>
           </section>`}
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Audit day
   ========================================================================== */

function renderAuditList() {
  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Audit day</p>
        <h1 style="font-size:var(--text-2xl)">Three hours, seventy-five marks, no help</h1>
        <p class="lede">The inspection committee sits with the verified papers of ${esc(SUBJECT.papers)}. Every mark you fail to earn comes out of your standing. No hints, no feedback, nothing revealed until you submit.</p>
      </header>

      <div class="stack" style="margin-block-start:var(--space-6)">
        ${PAPERS.map((paper) => {
          const budget = marksBudget(paper);
          const best = state.exams.filter((e) => e.paperId === paper.id && e.submittedAt).sort((a, b) => b.report.totals.marks - a.report.totals.marks)[0];
          const questions = paper.sections.reduce((s, sec) => s + sec.questions.length, 0);
          return `<div class="card">
            <div class="card__head">
              <div>
                <p class="eyebrow">${esc(paper.label)} · verified paper</p>
                <h2 style="font-size:var(--text-xl);margin-block-start:var(--space-1)">${esc(SUBJECT.title)} (${esc(SUBJECT.code)})</h2>
              </div>
              <p class="small muted tabular">${paper.totalMarks} marks · ${paper.durationMinutes} min</p>
            </div>
            <p class="small muted" style="margin-block-start:var(--space-2)">${esc(paper.source)}</p>
            <p style="margin-block-start:var(--space-3)">${questions} questions, ${paper.sections.length} sections. Budget ${budget.minutesPerMark} min/mark.${best ? ` Best so far: ${formatMarks(best.report.totals.marks)} of ${best.report.totals.max} (${best.report.totals.percent}%).` : ""}</p>
            <p class="row" style="margin-block-start:var(--space-3)">
              <a class="btn" href="#/audit/${paper.id}">Sit the audit</a>
              ${best ? `<a class="btn btn--quiet" href="#/audit/${paper.id}/report">Last report</a>` : ""}
            </p>
          </div>`;
        }).join("")}
      </div>
      ${colophon()}
    </div>`;
}

function renderAuditRun(paperId) {
  const paper = PAPERS.find((p) => p.id === paperId);
  if (!paper) return renderAuditList();
  const budget = marksBudget(paper);

  const sitting = state.exams.filter((e) => e.paperId === paperId).slice(-1)[0];
  if (sitting && sitting.marking) return renderAuditMarking(paper, sitting);
  const run = sitting && !sitting.submittedAt ? sitting : null;

  if (!run) {
    const questions = paper.sections.reduce((s, sec) => s + sec.questions.length, 0);
    return `
      <div class="view">
        <header class="stack">
          <p class="eyebrow">${esc(paper.label)} · before you sit down</p>
          <h1 style="font-size:var(--text-2xl)">${esc(SUBJECT.title)} (${esc(SUBJECT.code)})</h1>
          <p class="lede">${esc(paper.source)}</p>
        </header>
        <div class="card stack" style="margin-block-start:var(--space-5)">
          <table class="data-table">
            <caption>What you are agreeing to</caption>
            <tbody>
              <tr><th scope="row">Source</th><td>${esc(paper.source)}</td></tr>
              <tr><th scope="row">Year</th><td class="num">${paper.year}</td></tr>
              <tr><th scope="row">Total marks</th><td class="num">${paper.totalMarks}</td></tr>
              <tr><th scope="row">Duration</th><td class="num">${paper.durationMinutes} minutes</td></tr>
              <tr><th scope="row">Budget</th><td class="num">${budget.minutesPerMark} minutes per mark</td></tr>
              <tr><th scope="row">Questions</th><td class="num">${questions}</td></tr>
            </tbody>
          </table>
          ${paper.sections.map((s) => `<p class="small"><strong>${esc(s.name)}</strong> — ${esc(s.note)}</p>`).join("")}
          <p class="small" style="color:var(--red)">The clock runs whether or not you are looking at it. No feedback of any kind until you submit.</p>
          <p><button class="btn" type="button" data-start-audit="${esc(paper.id)}">Start the paper</button></p>
        </div>
        ${colophon()}
      </div>`;
  }

  const remaining = Math.max(0, paper.durationMinutes * 60 - Math.floor((now() - run.startedAt) / 1000));
  const answered = Object.values(run.answers).filter((a) => a.text && a.text.trim()).length;

  const sections = paper.sections.map((section) => `<section style="margin-block-start:var(--space-6)">
    <div class="card__head">
      <h2 style="font-size:var(--text-xl)">${esc(section.name)}</h2>
      <p class="small muted">${esc(section.note)}</p>
    </div>
    ${section.questions.map((q) => {
      const a = run.answers[q.n] || { text: "" };
      return `<div class="exam-q">
        <div class="exam-q__head">
          <p class="eyebrow">Q${q.n} · ${formatMarks(q.marks)} marks · floor ${esc(floorFor(q.unit).numeral)}</p>
          <p class="small muted tabular">${Math.round(q.marks * budget.secondsPerMark)}s budget</p>
        </div>
        <p class="exam-q__prompt">${esc(q.prompt)}</p>
        ${q.figureNote ? `<p class="small muted" style="margin-block-end:var(--space-3)">${esc(q.figureNote)}</p>` : ""}
        <label class="visually-hidden" for="audit-${esc(paper.id)}-${q.n}">Answer to question ${q.n}</label>
        <textarea class="answer-input" id="audit-${esc(paper.id)}-${q.n}" data-exam-q="${q.n}" placeholder="Nothing here is marked until you submit the whole paper.">${esc(a.text || "")}</textarea>
      </div>`;
    }).join("")}
  </section>`).join("");

  window.setTimeout(() => startAuditClock(paper, run), 0);

  return `
    <div class="view view--wide">
      <div class="exam-bar" role="status" aria-live="polite">
        <span>${esc(paper.label)} · ${esc(SUBJECT.code)}</span>
        <span class="exam-bar__clock" id="audit-clock" data-warn="${remaining < 300}">${formatDuration(remaining)}</span>
        <span class="small"><span id="audit-answered">${answered}</span> answered</span>
        <button class="btn btn--ghost" type="button" data-submit-audit style="min-height:2rem;padding-block:0.25rem">Submit</button>
      </div>
      ${sections}
      <p style="margin-block-start:var(--space-6)"><button class="btn" type="button" data-submit-audit>Submit the paper</button></p>
      ${colophon()}
    </div>`;
}

function startAuditClock(paper, run) {
  const clock = document.getElementById("audit-clock");
  if (!clock) return;
  if (ticker) window.clearInterval(ticker);
  ticker = window.setInterval(() => {
    const remaining = Math.max(0, paper.durationMinutes * 60 - Math.floor((now() - run.startedAt) / 1000));
    clock.textContent = formatDuration(remaining);
    clock.dataset.warn = String(remaining < 300);
    if (remaining === 0) {
      window.clearInterval(ticker);
      ticker = null;
      showToast("Time is up. The paper is submitted.");
      submitAudit(paper.id);
    }
  }, 1000);
}

function renderAuditMarking(paper, run) {
  const attempted = [];
  for (const section of paper.sections) {
    for (const q of section.questions) {
      const a = run.answers[q.n];
      if (a && a.text && a.text.trim()) attempted.push({ q, a, section });
    }
  }

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">${esc(paper.label)} · marking</p>
        <h1 style="font-size:var(--text-2xl)">Mark the ${attempted.length} answer${attempted.length === 1 ? "" : "s"} you wrote</h1>
        <p class="lede">The paper is locked. Mark against the scheme you were not allowed to see, then the committee reports.</p>
      </header>

      ${attempted.map(({ q, a, section }) => `<section style="margin-block-start:var(--space-6)">
        <p class="eyebrow">${esc(section.name)} · Q${q.n} · ${formatMarks(q.marks)} marks</p>
        <p class="exam-q__prompt">${esc(q.prompt)}</p>
        <div class="card" style="background:var(--panel-2)">
          <p class="eyebrow">What you wrote</p>
          <p class="small" style="margin-block-start:var(--space-2);white-space:pre-wrap">${esc(a.text)}</p>
        </div>
        <ul class="rubric">
          ${q.rubric.map((c, i) => `<li class="rubric__item">
            <input type="checkbox" id="audit-crit-${q.n}-${i}" data-audit-criterion="${q.n}:${i}"${a.hits && a.hits[i] ? " checked" : ""}>
            <label class="rubric__label" for="audit-crit-${q.n}-${i}">${esc(c.label)}</label>
            <span class="rubric__marks">${formatMarks(c.marks)}</span>
          </li>`).join("")}
        </ul>
      </section>`).join("")}

      <p style="margin-block-start:var(--space-6)"><button class="btn" type="button" data-finish-audit>Finish marking and face the committee</button></p>
      ${colophon()}
    </div>`;
}

function renderAuditReport(paperId) {
  const paper = PAPERS.find((p) => p.id === paperId);
  const run = state.exams.filter((e) => e.paperId === paperId && e.submittedAt).sort((a, b) => b.submittedAt - a.submittedAt)[0];
  if (!paper || !run) return renderAuditList();
  const report = run.report;
  const passed = report.totals.percent >= 50;

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">${esc(paper.label)} · committee report</p>
        <h1 style="font-size:var(--text-2xl)">${report.totals.marks} of ${report.totals.max} marks (${report.totals.percent}%)</h1>
        <p class="lede">${esc(report.diagnosis)}</p>
        <p class="small muted">${esc(paper.source)}</p>
        <p class="small ${passed ? "" : ""}" style="${passed ? "color:var(--green)" : "color:var(--red)"}">
          ${passed ? "The committee passes the floor. No damage." : `The committee fails the floor. Damage taken: −${run.auditDamage ?? 0} HP.`}
        </p>
      </header>

      <section style="margin-block-start:var(--space-6)">
        <h2 style="font-size:var(--text-xl)">Marks by floor</h2>
        <div class="card card--flush" style="margin-block-start:var(--space-3)">
          <table class="data-table">
            <caption>Joined to the syllabus map — this is the diagnostic, not the score</caption>
            <thead><tr><th scope="col">Floor</th><th scope="col">Questions</th><th scope="col">Marks</th><th scope="col">Percent</th></tr></thead>
            <tbody>
              ${report.byUnit.sort((a, b) => UNIT_ORDER.indexOf(a.unit) - UNIT_ORDER.indexOf(b.unit)).map((u) => `<tr>
                <td>${esc(floorFor(u.unit).name)}</td>
                <td class="num">${u.answered}/${u.questions}</td>
                <td class="num">${formatMarks(u.marks)} / ${formatMarks(u.max)}</td>
                <td class="num">${u.percent}%</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section style="margin-block-start:var(--space-6)">
        <h2 style="font-size:var(--text-xl)">Time against the ${report.budget.minutesPerMark} min/mark budget</h2>
        <div class="card card--flush" style="margin-block-start:var(--space-3)">
          <table class="data-table">
            <thead><tr><th scope="col">Q</th><th scope="col">Marks</th><th scope="col">Time</th><th scope="col">Allowed</th><th scope="col">Status</th></tr></thead>
            <tbody>
              ${report.rows.map((r) => `<tr>
                <td class="num">${r.n}</td>
                <td class="num">${formatMarks(r.marks)} / ${formatMarks(r.max)}</td>
                <td class="num">${r.attempted ? formatDuration(r.timeSec) : "—"}</td>
                <td class="num">${formatDuration(r.allowedSec)}</td>
                <td class="small">${!r.attempted ? `<span style="color:var(--red)">Blank</span>` : r.overBudget ? `<span style="color:var(--amber)">Over budget</span>` : "Within budget"}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <p class="small muted" style="margin-block-start:var(--space-3)">Time per question is attributed from typing activity, so thinking before the first keystroke is not counted. It is an approximation, and it is labelled as one.</p>
      </section>

      <p style="margin-block-start:var(--space-6)"><a class="btn btn--ghost" href="#/audit">Back to the papers</a></p>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Field manual
   ========================================================================== */

function renderManual() {
  const run = state.run;
  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Field manual</p>
        <h1 style="font-size:var(--text-2xl)">How this place works</h1>
        <p class="lede">A survival sim over five floors of a university exam cell, built on the syllabus of ${esc(SUBJECT.code)}. Thirty per cent reading, seventy per cent producing — that ratio is the design.</p>
      </header>

      <div class="prose" style="margin-block-start:var(--space-5)">
        <p><strong>Every ticket is a real fault.</strong> ${CONCEPTS.length} of them, one per chunk of the syllabus. The ticket tells you who reported it, what breaks if it stays open, and which part of the syllabus is your toolset.</p>
        <p><strong>The manager asks before you commit.</strong> Each ticket opens with a question you must answer before the fix is revealed. It is graded and stored like any other attempt, and skipping it flags the ticket.</p>
        <p><strong>Failing costs standing.</strong> HP starts at ${RUN.startHp}. A failed verification costs ${damageFor(1)} HP on shift 1 and ${damageFor(CONCEPTS.length)} on shift ${CONCEPTS.length} — the run gets more brutal as it goes. Clearing a shift restores a little; a delayed pass restores more.</p>
        <p><strong>At zero you are cleared out.</strong> The manager walks down the aisle, and the run ends. Starting a new shift resets standing and the floor map. Your study record — attempts, incidents, readiness — is kept, because a game death should not delete revision history.</p>
        <p><strong>Audit day is the real test.</strong> The three verified papers, 75 marks, three hours, and the shortfall comes out of your HP. The report is a diagnostic: marks by floor, time against the budget, and every question you left blank.</p>
        <p><strong>XP only for accuracy.</strong> Nothing for time in the app, nothing for streaks. A delayed pass doubles it. A game that pays you for sitting still teaches the wrong thing.</p>
      </div>

      <section style="margin-block-start:var(--space-6)">
        <h2 style="font-size:var(--text-xl)">Where it departs from the specification</h2>
        <div class="prose" style="margin-block-start:var(--space-3)">
          <p><strong>Grading is self-marked.</strong> The specification's grader is a model call constrained to each item's rubric. There is no model key in this build, so the rubric is shown and you mark against it. The required order is preserved — answer, confidence, scheme, model answer — and every graded item carries a dispute action.</p>
          <p><strong>No voice answers.</strong> Typed only, so the transcript-before-grading rule is not exercised.</p>
          <p><strong>Single user, local only.</strong> Everything lives in this browser. No account, no server, no transmission. Clearing site data deletes the history — export the incident log first.</p>
          <p><strong>Time per question is approximate.</strong> Attributed from typing activity.</p>
        </div>
      </section>

      <p style="margin-block-start:var(--space-6)">
        <button class="btn btn--danger" type="button" data-reset>Delete everything in this browser</button>
      </p>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Events
   ========================================================================== */

function bindView(view) {
  if (view.name === "case") bindCase();
  if (view.name === "review") bindItemCards();
  if (view.name === "incidents") bindIncidents();
  if (view.name === "audit-run") bindAudit(view);
  if (view.name === "manual") bindManual();
  if (view.name === "terminated") bindTerminated();
}

function bindCase() {
  const conceptId = player.conceptId;
  const concept = CONCEPT_BY_ID[conceptId];
  if (!concept) return;

  main.querySelectorAll("[data-gate-option]").forEach((button) => {
    button.addEventListener("click", () => {
      if (player.gateAnswered || player.gateSkipped) return;
      const chosenIndex = Number(button.dataset.gateOption);
      const option = concept.gate.options[chosenIndex];
      state.gates.push({
        conceptId,
        gateId: concept.gate.id,
        at: now(),
        chosenIndex,
        correct: Boolean(option.correct),
        skipped: false,
      });
      if (option.correct) {
        state.run.xp += xpForGate(true);
      }
      player.gateAnswered = true;
      persistAndRender();
    });
  });

  const skip = main.querySelector("[data-gate-skip]");
  if (skip) {
    skip.addEventListener("click", () => {
      state.gates.push({
        conceptId,
        gateId: concept.gate.id,
        at: now(),
        chosenIndex: null,
        correct: false,
        skipped: true,
      });
      const existing = state.concepts[conceptId] || {};
      state.concepts[conceptId] = { ...existing, flaggedAt: now() };
      player.gateSkipped = true;
      persistAndRender();
    });
  }

  bindItemCards();
}

function bindItemCards() {
  main.querySelectorAll(".attempt[data-item]").forEach((card) => {
    const itemId = card.dataset.item;
    const item = ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    const stage = itemStages.get(itemId);

    const textarea = card.querySelector("[data-answer]");
    if (textarea) {
      textarea.addEventListener("input", () => {
        stage.answer = textarea.value;
      });
    }

    const submit = card.querySelector("[data-submit-answer]");
    if (submit) {
      submit.addEventListener("click", () => {
        if (!stage.answer.trim()) {
          showToast("Write something first. An empty answer cannot be marked against a scheme.");
          return;
        }
        stage.stage = "confidence";
        persistAndRender();
      });
    }

    card.querySelectorAll("[data-confidence]").forEach((radio) => {
      radio.addEventListener("change", () => {
        stage.confidence = radio.value;
      });
    });

    const confirm = card.querySelector("[data-confirm-confidence]");
    if (confirm) {
      confirm.addEventListener("click", () => {
        if (!stage.confidence) {
          showToast("Pick Low, Medium or High — the point of the step is that it is recorded first.");
          return;
        }
        stage.stage = "marking";
        persistAndRender();
      });
    }

    const finish = card.querySelector("[data-finish-marking]");
    if (finish) {
      finish.addEventListener("click", () => {
        const hits = {};
        card.querySelectorAll("[data-criterion]").forEach((box) => {
          hits[Number(box.dataset.criterion)] = box.checked;
        });
        const marked = markAttempt(item, hits);
        stage.marked = marked;
        stage.stage = "result";
        recordAttempt(item, stage, marked);
        persistAndRender();
      });
    }

    const dispute = card.querySelector("[data-dispute]");
    if (dispute) {
      dispute.addEventListener("click", () => {
        const attempt = state.attempts.slice().reverse().find((a) => a.itemId === item.id);
        if (attempt) {
          attempt.disputed = true;
          attempt.disputedAt = now();
          saveState(state);
          showToast("Recorded against this attempt, and the item is flagged for content review.");
        }
      });
    }

    const retry = card.querySelector("[data-retry]");
    if (retry) {
      retry.addEventListener("click", () => {
        itemStages.set(itemId, { stage: "answer", answer: "", confidence: null, marked: null });
        persistAndRender();
      });
    }
  });
}

/**
 * Records an attempt, then applies the game consequence: a pass clears the
 * shift and heals; a failed verification costs HP and plays the sequence.
 */
function recordAttempt(item, stage, marked) {
  const timestamp = now();
  const passed = marked.ratio >= 0.5;
  const levelIndex = levelIndexFor(item.conceptId);

  state.attempts.push({
    id: uid(),
    itemId: item.id,
    conceptId: item.conceptId,
    unit: item.unit,
    kind: item.kind,
    at: timestamp,
    confidence: stage.confidence,
    answer: stage.answer,
    marks: marked.total,
    max: marked.max,
    ratio: marked.ratio,
    criteria: marked.criteria.map((c) => ({ label: c.label, marks: c.marks, hit: c.hit, tag: c.tag })),
    disputed: false,
  });

  const previous = state.concepts[item.conceptId];
  const delayDays = previous && previous.lastReviewedAt ? (timestamp - previous.lastReviewedAt) / 86400000 : 0;
  const delayedPass = passed && delayDays >= SCHEDULE.delayedPassDays;
  const scheduling = scheduleAfter(previous, { correct: passed, delayDays, now: timestamp });

  state.concepts[item.conceptId] = {
    ...previous,
    ...scheduling,
    status:
      item.kind === "exit"
        ? passed ? "complete" : "check-pending"
        : previous?.status === "complete" ? "complete" : previous?.status === "check-pending" ? "check-pending" : "available",
    attempts: (previous?.attempts || 0) + 1,
  };

  if (passed) {
    state.mistakes = resolveMistakes(state.mistakes, { conceptId: item.conceptId, at: timestamp });
    if (state.concepts[item.conceptId].flaggedAt) state.concepts[item.conceptId].flaggedAt = null;
  }

  for (const criterion of marked.criteria) {
    if (criterion.hit) continue;
    state.mistakes = logMistake(
      state.mistakes,
      { conceptId: item.conceptId, unit: item.unit, criterion: criterion.label, tag: criterion.tag, itemId: item.id },
      timestamp,
    );
  }

  if (item.kind !== "exit") {
    saveState(state);
    return;
  }

  if (passed) {
    const outcome = clearCase(state.run, {
      conceptId: item.conceptId,
      levelIndex,
      ratio: marked.ratio,
      delayedPass,
      now: timestamp,
    });
    state.run = outcome.run;
    saveState(state);
    if (outcome.heal > 0) showToast(`Shift signed off. +${outcome.heal} HP, +${outcome.xp} XP.`);
    return;
  }

  const outcome = failCase(state.run, { conceptId: item.conceptId, levelIndex, now: timestamp });
  state.run = outcome.run;
  saveState(state);
  const concept = CONCEPT_BY_ID[item.conceptId];
  playFailure({
    conceptId: item.conceptId,
    levelIndex,
    damage: outcome.damage,
    severity: outcome.severity,
    lines: concept ? caseFor(concept.id)?.boss : null,
    terminated: outcome.terminated,
    onRetry: () => render(),
  });
}

function bindIncidents() {
  const exportButton = main.querySelector("[data-export]");
  if (exportButton) {
    exportButton.addEventListener("click", () => {
      const csv = exportMistakes(state.mistakes, now());
      downloadFile(`bca501-incidents-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
      showToast("Exported, including resolved entries.");
    });
  }
}

function bindManual() {
  const reset = main.querySelector("[data-reset]");
  if (reset) {
    reset.addEventListener("click", () => {
      const sure = window.confirm("Delete every attempt, incident, exam result and shift? This cannot be undone.");
      if (!sure) return;
      state = clearState();
      saveState(state);
      showToast("Everything deleted.");
      navigate("#/");
      render();
    });
  }
}

function bindTerminated() {
  const button = main.querySelector("[data-new-shift]");
  if (button) {
    button.addEventListener("click", () => {
      state.run = newShift(state.run, now());
      saveState(state);
      showToast("New shift. Standing restored, floors reset, your record kept.");
      navigate("#/");
      render();
    });
  }
}

function bindAudit(view) {
  const paper = PAPERS.find((p) => p.id === view.paperId);
  if (!paper) return;

  const start = main.querySelector("[data-start-audit]");
  if (start) {
    start.addEventListener("click", () => {
      state.exams.push({
        id: uid(),
        paperId: paper.id,
        startedAt: now(),
        submittedAt: null,
        marking: false,
        answers: {},
        report: null,
        auditDamage: 0,
      });
      saveState(state);
      render();
    });
    return;
  }

  let lastTick = now();
  const sitting = () => state.exams.find((e) => e.paperId === paper.id && !e.submittedAt);

  main.querySelectorAll("[data-exam-q]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const run = sitting();
      if (!run) return;
      const n = textarea.dataset.examQ;
      const delta = now() - lastTick;
      lastTick = now();
      run.answers[n] = run.answers[n] || { text: "", timeMs: 0, hits: {} };
      run.answers[n].text = textarea.value;
      run.answers[n].timeMs = (run.answers[n].timeMs || 0) + delta;
      const counter = document.getElementById("audit-answered");
      if (counter) counter.textContent = String(Object.values(run.answers).filter((a) => a.text && a.text.trim()).length);
      saveState(state);
    });
  });

  main.querySelectorAll("[data-audit-criterion]").forEach((box) => {
    box.addEventListener("change", () => {
      const run = state.exams.find((e) => e.paperId === paper.id && e.marking);
      if (!run) return;
      const [n, i] = box.dataset.auditCriterion.split(":");
      run.answers[n] = run.answers[n] || { text: "", timeMs: 0, hits: {} };
      run.answers[n].hits = run.answers[n].hits || {};
      run.answers[n].hits[i] = box.checked;
      saveState(state);
    });
  });

  main.querySelectorAll("[data-submit-audit]").forEach((button) => {
    button.addEventListener("click", () => submitAudit(paper.id));
  });

  const finish = main.querySelector("[data-finish-audit]");
  if (finish) finish.addEventListener("click", () => finishAuditMarking(paper.id));
}

function submitAudit(paperId) {
  const run = state.exams.find((e) => e.paperId === paperId && !e.submittedAt);
  if (!run) return;
  const attempted = Object.values(run.answers).filter((a) => a.text && a.text.trim()).length;
  if (attempted === 0) {
    showToast("Nothing written yet. Submit again once you have answered at least one question.");
    return;
  }
  run.marking = true;
  run.submittedAt = now();
  saveState(state);
  render();
}

function finishAuditMarking(paperId) {
  const paper = PAPERS.find((p) => p.id === paperId);
  const run = state.exams.find((e) => e.paperId === paperId && e.marking);
  if (!paper || !run) return;

  for (const section of paper.sections) {
    for (const q of section.questions) {
      const a = run.answers[q.n];
      if (!a) continue;
      const marked = markAttempt(q, a.hits || {});
      a.marks = marked.total;
      a.ratio = marked.ratio;
      if (a.text && a.text.trim()) {
        state.attempts.push({
          id: uid(),
          itemId: `audit-${paper.id}-${q.n}`,
          conceptId: null,
          unit: q.unit,
          kind: "exam",
          at: run.submittedAt,
          confidence: null,
          answer: a.text,
          marks: marked.total,
          max: marked.max,
          ratio: marked.ratio,
          criteria: marked.criteria,
          disputed: false,
        });
        for (const criterion of marked.criteria) {
          if (criterion.hit) continue;
          state.mistakes = logMistake(
            state.mistakes,
            {
              conceptId: conceptForUnit(q.unit),
              unit: q.unit,
              criterion: criterion.label,
              tag: criterion.tag,
              itemId: `audit-${paper.id}-${q.n}`,
            },
            run.submittedAt,
          );
        }
      }
    }
  }

  run.marking = false;
  run.report = examReport(paper, run.answers);
  const outcome = auditOutcome(state.run, {
    paperId: paper.id,
    marks: run.report.totals.marks,
    total: run.report.totals.max,
    now: run.submittedAt,
  });
  run.auditDamage = outcome.damage;
  state.run = outcome.run;
  saveState(state);

  if (outcome.terminated) {
    playFailure({
      conceptId: conceptForUnit("u6"),
      levelIndex: 26,
      damage: outcome.damage,
      severity: outcome.severity,
      lines: ["The committee has finished.", "Seventy-five marks and you left most of them on the table."],
      terminated: true,
    });
    return;
  }

  navigate(`#/audit/${paperId}/report`);
  render();
}

function conceptForUnit(unitId) {
  const concept = unitConcepts(unitId)[0];
  return concept ? concept.id : unitId;
}

/* ==========================================================================
   Start
   ========================================================================== */

function persistAndRender() {
  saveState(state);
  render();
}

window.addEventListener("hashchange", render);

if (!window.location.hash) {
  window.location.replace("#/");
}

render();
