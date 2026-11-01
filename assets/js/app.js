/**
 * The student client.
 *
 * A renderer and a state machine, no teaching content of its own (AC-7.3).
 * Every sentence comes from the content modules; this file only decides what
 * to show, in what order, and what to record.
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
const gate = publishGate();

let { state, persisted } = loadState();
let ticker = null;
const itemStages = new Map();
const player = { conceptId: null, gateAnswered: false, gateSkipped: false, stage: "answer" };
const exam = { paperId: null, marking: false };

const STATUS_LABEL = {
  locked: "Locked",
  available: "Ready",
  "check-pending": "Check pending",
  complete: "Complete",
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
  if (parts[0] === "unit" && parts[1]) return { name: "unit", unitId: parts[1] };
  if (parts[0] === "concept" && parts[1]) return { name: "concept", conceptId: parts[1] };
  if (parts[0] === "review") return { name: "review", unitId: parts[1] || null };
  if (parts[0] === "mistakes") return { name: "mistakes" };
  if (parts[0] === "calibration") return { name: "calibration" };
  if (parts[0] === "exam" && parts[1] && parts[2] === "report") {
    return { name: "exam-report", paperId: parts[1] };
  }
  if (parts[0] === "exam" && parts[1]) return { name: "exam-run", paperId: parts[1] };
  if (parts[0] === "exam") return { name: "exam-list" };
  if (parts[0] === "about") return { name: "about" };
  return { name: "home" };
}

function navigate(hash) {
  window.location.hash = hash;
}

let lastRouteKey = null;

function render() {
  const view = route();
  // Item stages survive a re-render of the same view — the answer, confidence
  // and marking steps are a sequence within one page, and clearing them on
  // every repaint would throw the student back to an empty answer box.
  const routeKey = JSON.stringify(view);
  if (routeKey !== lastRouteKey) {
    itemStages.clear();
    lastRouteKey = routeKey;
  }
  if (view.name !== "concept") player.conceptId = null;

  const views = {
    home: renderHome,
    unit: () => renderUnit(view.unitId),
    concept: () => renderConcept(view.conceptId),
    review: () => renderReview(view.unitId),
    mistakes: renderMistakes,
    calibration: renderCalibration,
    "exam-list": renderExamList,
    "exam-run": () => renderExamRun(view.paperId),
    "exam-report": () => renderExamReport(view.paperId),
    about: renderAbout,
  };

  const html = (views[view.name] || renderHome)();
  main.innerHTML = html;
  renderRail(view);
  bindView(view);
  const heading = main.querySelector("h1");
  if (heading) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function renderRail(view) {
  const links = [
    { hash: "#/", label: "The map", num: "§" },
    { hash: "#/review", label: "Due for revision", num: "1" },
    { hash: "#/mistakes", label: "Mistake log", num: "2" },
    { hash: "#/calibration", label: "Calibration", num: "3" },
    { hash: "#/exam", label: "Exam mode", num: "4" },
    { hash: "#/about", label: "How this works", num: "5" },
  ];
  const currentHash =
    view.name === "home"
      ? "#/"
      : view.name === "review"
        ? "#/review"
        : view.name === "mistakes"
          ? "#/mistakes"
          : view.name === "calibration"
            ? "#/calibration"
            : view.name === "about"
              ? "#/about"
              : view.name.startsWith("exam")
                ? "#/exam"
                : "";

  const unitItems = UNITS.map((unit) => {
    const progress = unitProgress(state, unit.id);
    const active = view.name === "unit" && view.unitId === unit.id;
    return `<li>
      <a class="rail__link" href="#/unit/${unit.id}"${active ? ' aria-current="page"' : ""}>
        <span class="rail__num" aria-hidden="true">${unit.numeral}</span>
        <span>${esc(unit.title)}</span>
        <span class="rail__count" title="${progress.done} of ${progress.total} complete">${progress.done}/${progress.total}</span>
      </a>
    </li>`;
  }).join("");

  rail.innerHTML = `
    <div class="rail__masthead">
      <div>
        <p class="rail__code">${esc(SUBJECT.code)} · Sem V</p>
        <p class="rail__title"><a href="#/">${esc(SUBJECT.title)}</a></p>
      </div>
    </div>
    <nav class="rail__nav" aria-label="Sections">
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
    <p class="rail__section-label">Units</p>
    <nav aria-label="Units"><ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:var(--space-1)">
      ${unitItems}
    </ul></nav>
    ${
      persisted
        ? ""
        : `<p class="rail__section-label" style="color:var(--red)">Storage blocked</p>
           <p class="small muted">Progress is in memory only for this session. Nothing is being saved.</p>`
    }
  `;
}

/* ==========================================================================
   Shared components
   ========================================================================== */

function badge(status) {
  return `<span class="badge badge--${status}">${STATUS_LABEL[status] || status}</span>`;
}

function chunkList(unitId) {
  return unitConcepts(unitId)
    .map((concept, index) => {
      const status = chunkStatus(state, concept.id);
      const locked = status === "locked";
      const tag = locked ? "div" : "a";
      const attrs = locked
        ? 'aria-disabled="true"'
        : `href="#/concept/${concept.id}"`;
      return `<li>
        <${tag} class="chunk${locked ? " chunk--locked" : ""}" ${attrs}>
          <span class="chunk__index" aria-hidden="true">${unitId.replace("u", "")}.${index + 1}</span>
          <span>
            <span class="chunk__title">${esc(concept.title)}</span>
            <span class="chunk__hook">${esc(concept.hook)}</span>
          </span>
          ${badge(status)}
        </${tag}>
      </li>`;
    })
    .join("");
}

function colophon() {
  return `<footer class="colophon">
    <p>${esc(SUBJECT.university)} · ${esc(SUBJECT.programme)} · ${esc(SUBJECT.code)} ${esc(SUBJECT.title)}. Units I, II, III, IV and VI. Unit V is outside this map and never appears in a practice set.</p>
    <p>Exam mode uses the verified papers of ${esc(SUBJECT.papers)}. Mark schemes are written for this platform, not by the university, and self-marking is yours to do honestly — the marks are a measurement, not a reward.</p>
  </footer>`;
}

/* ==========================================================================
   Home — the map
   ========================================================================== */

function renderHome() {
  const due = dueConcepts(state.concepts, now());
  const queue = rankMistakes(state.mistakes, UNIT_WEIGHTS, now());
  const flagged = Object.entries(state.concepts).filter(([, s]) => s.flaggedAt);
  const done = CONCEPTS.filter((c) => state.concepts[c.id]?.status === "complete").length;

  const gateBanner = gate.ok
    ? ""
    : `<div class="card" style="border-color:var(--red);background:var(--red-wash)">
         <p class="eyebrow" style="color:var(--red)">Publish gate failed</p>
         <p class="small">Content is not shippable. ${esc([...gate.conceptErrors, ...gate.paperErrors].slice(0, 4).join("; "))}</p>
       </div>`;

  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">${esc(SUBJECT.university)} · ${esc(SUBJECT.code)}</p>
        <h1 style="font-size:var(--text-3xl)">${esc(SUBJECT.title)}</h1>
        <p class="lede">Five units, ${CONCEPTS.length} chunks, and one rule: nothing unlocks until you have produced an answer yourself. ${done} of ${CONCEPTS.length} chunks are complete.</p>
      </header>

      ${gateBanner}

      <section class="stack" style="margin-block-start:var(--space-6)">
        <div class="row" style="justify-content:space-between">
          <h2 style="font-size:var(--text-xl)">Where to start</h2>
          <a class="btn btn--ghost" href="#/review">Revision queue</a>
        </div>
        <div class="card">
          <div class="card__head">
            <p class="eyebrow">Due now</p>
            <p class="small muted">${due.length} concept${due.length === 1 ? "" : "s"} · ${queue.length} open mistake${queue.length === 1 ? "" : "s"}</p>
          </div>
          <p style="margin-block-start:var(--space-3)">
            ${
              due.length + queue.length + flagged.length === 0
                ? "Nothing is due yet. Work through a chunk below — the schedule starts from your first answer."
                : `${due.length} concept${due.length === 1 ? " has" : "s have"} come back for review, ${queue.length} logged mistake${queue.length === 1 ? " is" : "s are"} still open${flagged.length ? `, and ${flagged.length} chunk${flagged.length === 1 ? " was" : "s were"} flagged by a skipped gate` : ""}.`
            }
          </p>
          <p style="margin-block-start:var(--space-3)">
            <a class="btn" href="#/review">Open the queue</a>
          </p>
        </div>
      </section>

      <section aria-labelledby="units-heading">
        <h2 id="units-heading" style="font-size:var(--text-xl);margin-block-start:var(--space-7)">The five units</h2>
        ${UNITS.map((unit) => {
          const progress = unitProgress(state, unit.id);
          return `<section class="unit">
            <div class="unit__head">
              <div>
                <p class="eyebrow">Unit ${esc(unit.numeral)}</p>
                <h3 class="unit__title">${esc(unit.title)}</h3>
              </div>
              <p class="small muted tabular">${progress.done}/${progress.total} complete</p>
            </div>
            <p class="unit__syllabus">${esc(unit.syllabus)}</p>
            <ul class="chunk-list">${chunkList(unit.id)}</ul>
            <p class="small muted" style="margin-block-start:var(--space-3)">${esc(unit.weightBasis)}</p>
          </section>`;
        }).join("")}
      </section>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Unit
   ========================================================================== */

function renderUnit(unitId) {
  const unit = UNIT_BY_ID[unitId];
  if (!unit) return renderHome();
  const progress = unitProgress(state, unitId);
  const studied = studiedUnits(state);
  const hasEarlier = studied.some((u) => u !== unitId);

  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Unit ${esc(unit.numeral)} · ${progress.done} of ${progress.total} complete</p>
        <h1 style="font-size:var(--text-2xl)">${esc(unit.title)}</h1>
        <p class="lede">${esc(unit.syllabus)}</p>
        <p class="small muted">${esc(unit.weightBasis)}</p>
      </header>

      <ul class="chunk-list" style="margin-block-start:var(--space-6)">${chunkList(unitId)}</ul>

      <div class="card" style="margin-block-start:var(--space-6)">
        <p class="eyebrow">Retrieval set</p>
        <p style="margin-block-start:var(--space-2)">
          Ten items drawn only from this unit${hasEarlier ? `, with at least ${pct(SCHEDULE.interleaveRatio)} interleaved from units you have already studied` : ""}.
          ${progress.done === 0 ? " Finish a chunk first — a retrieval set over unread material measures nothing." : ""}
        </p>
        <p style="margin-block-start:var(--space-3)">
          ${
            progress.done === 0
              ? `<span class="badge">Locked until one chunk is complete</span>`
              : `<a class="btn" href="#/review/${unitId}">Start the set</a>`
          }
        </p>
      </div>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Concept player (FR-1, FR-2, FR-4, FR-5)
   ========================================================================== */

function renderConcept(conceptId) {
  const concept = CONCEPT_BY_ID[conceptId];
  if (!concept) return renderHome();

  const status = chunkStatus(state, conceptId);
  if (status === "locked") {
    const index = unitConcepts(concept.unit).findIndex((c) => c.id === conceptId);
    const previous = unitConcepts(concept.unit)[index - 1];
    return `<div class="view">
      <h1 style="font-size:var(--text-2xl)">Not yet</h1>
      <p class="lede" style="margin-block-start:var(--space-3)">This chunk opens when <a href="#/concept/${previous.id}">${esc(previous.title)}</a> has been completed. Progression is gated on effort, not on a swipe.</p>
      <p style="margin-block-start:var(--space-4)"><a class="btn btn--ghost" href="#/unit/${concept.unit}">Back to the unit</a></p>
    </div>`;
  }

  if (player.conceptId !== conceptId) {
    player.conceptId = conceptId;
    player.gateAnswered = false;
    player.gateSkipped = false;
    player.stage = "answer";
    const existing = state.concepts[conceptId];
    if (existing && existing.status === "complete") player.gateAnswered = true;
  }

  const unit = UNIT_BY_ID[concept.unit];
  const index = unitConcepts(concept.unit).findIndex((c) => c.id === conceptId);
  const next = unitConcepts(concept.unit)[index + 1];
  // Items are resolved through ITEMS so each carries its concept and unit tag —
  // the raw content records do not, and the attempt record needs both.
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

  const openingBeats = concept.beats.slice(0, 2);
  const closingBeats = concept.beats.slice(2);

  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Unit ${esc(unit.numeral)} · chunk ${index + 1} of ${unitConcepts(concept.unit).length}</p>
        <h1 style="font-size:var(--text-2xl)">${esc(concept.title)}</h1>
        <p class="lede">${esc(concept.hook)}</p>
      </header>

      <div class="script" style="margin-block-start:var(--space-5)">
        ${openingBeats.map(renderBeat).join("")}
        ${renderGate(concept, gateRecord)}
        ${
          player.gateAnswered || player.gateSkipped
            ? `<div class="page-turn">${closingBeats.map(renderBeat).join("")}</div>`
            : ""
        }
      </div>

      ${
        player.gateAnswered || player.gateSkipped
          ? `<section aria-labelledby="exit-heading" style="margin-block-start:var(--space-6)">
               <h2 id="exit-heading" style="font-size:var(--text-xl)">Exit check</h2>
               <p class="small muted" style="margin-block-start:var(--space-2)">One retrieval, then the next chunk unlocks. A miss replays only the beat that carried the idea — not the whole chunk.</p>
               ${renderItemCard(exitItem, { isExit: true })}
             </section>
             ${
               practice.length
                 ? `<section aria-labelledby="more-heading" style="margin-block-start:var(--space-7)">
                      <h2 id="more-heading" style="font-size:var(--text-xl)">The rest of the set</h2>
                      <p class="small muted" style="margin-block-start:var(--space-2)">Two more items on the same concept. They do not gate progression, but every miss is logged.</p>
                      ${practice.map((item) => renderItemCard(item, { isExit: false })).join("")}
                    </section>`
                 : ""
             }
             ${
               exitPassed
                 ? next
                   ? `<p style="margin-block-start:var(--space-6)"><a class="btn" href="#/concept/${next.id}">Next chunk: ${esc(next.title)}</a></p>`
                   : `<p style="margin-block-start:var(--space-6)"><a class="btn" href="#/review/${concept.unit}">End of unit — start the retrieval set</a></p>`
                 : `<p class="small muted" style="margin-block-start:var(--space-5)">The next chunk opens when this exit check is passed. Until then this chunk stays in check-pending, and that is the point — progression is gated on effort, not on a scroll.</p>`
             }`
          : `<p class="small muted" style="margin-block-start:var(--space-5)">Answer the gate above, or skip it explicitly, to see the mechanism. The gate is not decoration: it is recorded, and a skip flags this chunk for review.</p>`
      }
      ${colophon()}
    </div>`;
}

function renderBeat(beat) {
  const kindLabel = {
    problem: "The problem",
    failure: "Why the obvious fix fails",
    mechanism: "The mechanism",
    cost: "What it costs",
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
         ${!record.correct ? `<br><span class="muted">The mechanism is below. Read it knowing where you went wrong — that is the point of asking first.</span>` : ""}
       </div>`
    : skipped
      ? `<div class="gate__verdict"><strong>Skipped</strong>This chunk is now flagged for additional review, and the skip is recorded.</div>`
      : "";

  return `<div class="gate">
    <div class="gate__flag">
      <span>Prediction gate · answer before the mechanism</span>
      <span aria-hidden="true">P.T.O.</span>
    </div>
    <p class="gate__prompt" id="gate-prompt-${esc(gateData.id)}">${esc(gateData.prompt)}</p>
    <ul class="gate__options" aria-labelledby="gate-prompt-${esc(gateData.id)}">${options}</ul>
    ${verdict}
    ${
      answered || skipped
        ? ""
        : `<p style="margin-block-start:var(--space-3)"><button class="btn btn--quiet" type="button" data-gate-skip>Skip the gate and read on</button></p>`
    }
  </div>`;
}

function renderItemCard(item, { isExit }) {
  const stage = itemStages.get(item.id) || { stage: "answer", answer: "", confidence: null, marked: null };
  itemStages.set(item.id, stage);
  const head = `<div class="attempt__head">
      <div>
        <p class="eyebrow">${isExit ? "Exit check" : "Retrieval item"} · ${formatMarks(item.marks)} marks</p>
      </div>
      ${
        stage.stage === "result"
          ? `<p class="marks ${stage.marked.ratio >= 0.5 ? "marks--hit" : "marks--miss"}">${formatMarks(stage.marked.total)} / ${formatMarks(stage.marked.max)}</p>`
          : ""
      }
    </div>
    <p class="beat__text">${esc(item.prompt)}</p>`;

  if (stage.stage === "answer") {
    return `<div class="attempt" data-item="${esc(item.id)}">${head}
      <p style="margin-block-start:var(--space-3)">
        <label class="field__legend" for="answer-${esc(item.id)}">Your answer</label>
        <textarea class="answer-input" id="answer-${esc(item.id)}" data-answer placeholder="Write the answer you would write in the exam. Two or three sentences is enough for a short question; a long question needs the structure you would give it.">${esc(stage.answer)}</textarea>
      </p>
      <p style="margin-block-start:var(--space-3)">
        <button class="btn" type="button" data-submit-answer>Submit answer</button>
        <span class="small muted">The mark scheme stays hidden until you have submitted.</span>
      </p>
    </div>`;
  }

  if (stage.stage === "confidence") {
    return `<div class="attempt" data-item="${esc(item.id)}">${head}
      <div class="card" style="margin-block-start:var(--space-3);background:var(--paper)">
        <fieldset class="field">
          <legend class="field__legend">Before the grade: how confident are you that this earns full marks?</legend>
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
          <p class="field__hint">This is recorded against your actual result and shown on the calibration dashboard. It is not scored as a mark, and an honest Low costs you nothing.</p>
        </fieldset>
      </div>
      <p style="margin-block-start:var(--space-3)">
        <button class="btn" type="button" data-confirm-confidence>Show the mark scheme</button>
      </p>
    </div>`;
  }

  if (stage.stage === "marking") {
    return `<div class="attempt" data-item="${esc(item.id)}">${head}
      <div class="card" style="margin-block-start:var(--space-3);background:var(--paper)">
        <p class="eyebrow">Mark scheme — tick what your answer actually contains</p>
        <p class="small muted" style="margin-block-start:var(--space-2)">Not what you meant to write. The purpose of this step is to find the gap, and a generous tick hides it until the exam.</p>
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
        <button class="btn" type="button" data-finish-marking>Finish marking</button>
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

    ${
      passed
        ? ""
        : `<div class="gate__verdict" style="border-color:var(--red);background:var(--red-wash)">
             <strong style="color:var(--red)">Below the exit threshold</strong>
             You scored ${formatMarks(marked.total)} of ${formatMarks(marked.max)}. This chunk stays in check-pending until the exit check is passed, so the next one does not unlock.
             ${
               replay.length
                 ? `<p style="margin-block-start:var(--space-2)">The idea you missed is in beat ${replay.map((b) => b + 1).join(" and ")} above — read only ${replay.length === 1 ? "that one" : "those"} again:
                    ${replay
                      .map((b) => {
                        const beat = concept.beats[b];
                        return beat ? `<br><span class="mono small">${esc(beat.text.slice(0, 180))}…</span>` : "";
                      })
                      .join("")}</p>`
                 : ""
             }
           </div>`
    }

    <div class="model-answer">
      <h4>Model answer</h4>
      <p>${esc(item.model)}</p>
    </div>

    <p class="dispute">
      <button class="btn btn--quiet" type="button" data-dispute="${esc(item.id)}">Dispute this mark</button>
      <span class="small muted">Self-marking is yours to do; if a criterion is wrong, say why and it is recorded against this attempt.</span>
    </p>

    ${
      isExit && !passed
        ? `<p style="margin-block-start:var(--space-3)"><button class="btn" type="button" data-retry="${esc(item.id)}">Retry the exit check</button></p>`
        : ""
    }
  </div>`;
}

/* ==========================================================================
   Review queue
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
        <p class="eyebrow">Revision queue</p>
        <h1 style="font-size:var(--text-2xl)">What is due, and why it is here</h1>
        <p class="lede">${total === 0 ? "Nothing is due. That is the honest answer, not a nudge to do more." : `${total} item${total === 1 ? "" : "s"} due. The order is computed from three factors, and each one is shown beside the entry.`}</p>
      </header>

      ${
        flagged.length
          ? `<section style="margin-block-start:var(--space-5)">
               <h2 style="font-size:var(--text-xl)">Flagged by a skipped gate</h2>
               <ul class="chunk-list">
                 ${flagged
                   .map(([id, s]) => {
                     const concept = CONCEPT_BY_ID[id];
                     if (!concept) return "";
                     return `<li><a class="chunk" href="#/concept/${id}">
                       <span class="chunk__index" aria-hidden="true">!</span>
                       <span><span class="chunk__title">${esc(concept.title)}</span>
                       <span class="chunk__hook">Gate skipped ${shortDate(s.flaggedAt)} — re-read it and answer</span></span>
                       <span class="badge badge--pending">Flagged</span>
                     </a></li>`;
                   })
                   .join("")}
               </ul>
             </section>`
          : ""
      }

      ${
        due.length
          ? `<section style="margin-block-start:var(--space-6)">
               <h2 style="font-size:var(--text-xl)">Scheduled for today</h2>
               <p class="small muted" style="margin-block-start:var(--space-2)">Concepts you missed, re-queued at day 1, 3 and 10. A concept is only mastered after a pass at a delay of seven days or more.</p>
               <ul class="chunk-list">
                 ${due
                   .map(({ id, overdueMs }) => {
                     const concept = CONCEPT_BY_ID[id];
                     if (!concept) return "";
                     const days = Math.floor(overdueMs / 86400000);
                     return `<li><a class="chunk" href="#/concept/${id}">
                       <span class="chunk__index" aria-hidden="true">${esc(UNIT_BY_ID[concept.unit].numeral)}</span>
                       <span><span class="chunk__title">${esc(concept.title)}</span>
                       <span class="chunk__hook">${days > 0 ? `${days} day${days === 1 ? "" : "s"} overdue` : "Due today"}</span></span>
                       <span class="badge badge--available">Review</span>
                     </a></li>`;
                   })
                   .join("")}
               </ul>
             </section>`
          : ""
      }

      ${
        queue.length
          ? `<section style="margin-block-start:var(--space-6)">
               <h2 style="font-size:var(--text-xl)">Open mistakes, ranked</h2>
               <p class="small muted" style="margin-block-start:var(--space-2)">Priority = recurrence × exam weight × recency. All three are shown so you can disagree with the order.</p>
               <div class="card card--flush" style="margin-block-start:var(--space-3)">
                 <table class="data-table">
                   <caption>${queue.length} open entries</caption>
                   <thead><tr><th scope="col">Concept</th><th scope="col">What was missed</th><th scope="col">Factors</th></tr></thead>
                   <tbody>
                     ${queue
                       .slice(0, 12)
                       .map((m) => {
                         const concept = CONCEPT_BY_ID[m.conceptId];
                         return `<tr>
                           <td><a href="#/concept/${m.conceptId}">${esc(concept ? concept.title : m.conceptId)}</a><br><span class="small muted">Unit ${esc(UNIT_BY_ID[m.unit]?.numeral || "?")} · seen ${m.count}×</span></td>
                           <td class="small">${esc(MISCONCEPTIONS[m.tag] || m.tag)}</td>
                           <td class="num small">${m.factors.recurrence} × ${m.factors.examWeight} × ${m.factors.recency}<br><span class="muted">= ${m.score}</span></td>
                         </tr>`;
                       })
                       .join("")}
                   </tbody>
                 </table>
               </div>
               <p style="margin-block-start:var(--space-3)"><a class="btn btn--ghost" href="#/mistakes">The full log</a></p>
             </section>`
          : ""
      }

      ${total === 0 ? `<p style="margin-block-start:var(--space-5)"><a class="btn" href="#/">Back to the map</a></p>` : ""}
      ${colophon()}
    </div>`;
}

function renderRetrievalSet(unitId) {
  const unit = UNIT_BY_ID[unitId];
  if (!unit) return renderHome();
  const studied = studiedUnits(state);
  const set = selectRetrievalSet(ITEMS, UNIT_ORDER, {
    unitId,
    size: 10,
    seed: Math.floor(now() / 60000) % 100000,
    studiedUnits: studied,
  });

  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Unit ${esc(unit.numeral)} · retrieval set</p>
        <h1 style="font-size:var(--text-2xl)">${esc(unit.title)}</h1>
        <p class="lede">${set.total} items: ${set.total - set.interleavedCount} from this unit and ${set.interleavedCount} interleaved from units you have already studied (${pct(set.ratio)}, target ${pct(SCHEDULE.interleaveRatio)}).</p>
        ${set.note ? `<p class="small muted">${esc(set.note)}</p>` : ""}
        ${!set.meetsInterleaveTarget ? `<p class="small" style="color:var(--red)">The interleaving target is not met by this set. That is a defect in the selection, not a judgement about you.</p>` : ""}
      </header>
      <div style="margin-block-start:var(--space-5)">
        ${set.items
          .map((item) => {
            const concept = CONCEPT_BY_ID[item.conceptId];
            return `<section style="margin-block-start:var(--space-5)">
              <p class="eyebrow">Unit ${esc(UNIT_BY_ID[item.unit].numeral)}${item.unit !== unitId ? " · interleaved" : ""} · ${esc(concept ? concept.title : "")}</p>
              ${renderItemCard(item, { isExit: false })}
            </section>`;
          })
          .join("")}
      </div>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Mistake log
   ========================================================================== */

function renderMistakes() {
  const open = rankMistakes(state.mistakes, UNIT_WEIGHTS, now());
  const resolved = state.mistakes.filter((m) => m.resolvedAt);

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">Mistake log</p>
        <h1 style="font-size:var(--text-2xl)">Every missed criterion, one entry each</h1>
        <p class="lede">Deduplicated on concept, criterion and misconception, so a recurring error is one entry that gains weight. An entry is resolved only by a correct answer given at least seven days after it was recorded — a same-day retry updates the history and resolves nothing.</p>
      </header>

      <div class="row" style="margin-block-start:var(--space-4)">
        <button class="btn btn--ghost" type="button" data-export>Export as CSV</button>
        <span class="small muted">${open.length} open · ${resolved.length} resolved · ${state.mistakes.length} total</span>
      </div>

      ${
        open.length === 0
          ? `<p class="empty" style="margin-block-start:var(--space-5)">No open mistakes. Either you have answered nothing yet, or nothing has been missed — the log cannot tell those apart, so check the map.</p>`
          : `<div class="card card--flush" style="margin-block-start:var(--space-5)">
               <table class="data-table">
                 <caption>Open entries, ranked by recurrence × exam weight × recency</caption>
                 <thead><tr>
                   <th scope="col">Concept</th><th scope="col">Criterion missed</th><th scope="col">Tag</th>
                   <th scope="col">Seen</th><th scope="col">First</th><th scope="col">Score</th>
                 </tr></thead>
                 <tbody>
                   ${open
                     .map((m) => {
                       const concept = CONCEPT_BY_ID[m.conceptId];
                       return `<tr>
                         <td><a href="#/concept/${m.conceptId}">${esc(concept ? concept.title : m.conceptId)}</a><br><span class="small muted">Unit ${esc(UNIT_BY_ID[m.unit]?.numeral || "?")}</span></td>
                         <td class="small">${esc(m.criterion)}</td>
                         <td class="small mono">${esc(m.tag)}</td>
                         <td class="num">${m.count}</td>
                         <td class="num small">${shortDate(m.firstAt)}</td>
                         <td class="num">${m.score}</td>
                       </tr>`;
                     })
                     .join("")}
                 </tbody>
               </table>
             </div>`
      }

      ${
        resolved.length
          ? `<section style="margin-block-start:var(--space-6)">
               <h2 style="font-size:var(--text-xl)">Resolved</h2>
               <p class="small muted" style="margin-block-start:var(--space-2)">Kept, not deleted — the history of a resolved entry is what makes the recurrence counts mean anything.</p>
               <div class="card card--flush" style="margin-block-start:var(--space-3)">
                 <table class="data-table">
                   <thead><tr><th scope="col">Concept</th><th scope="col">Criterion</th><th scope="col">Seen</th><th scope="col">Resolved</th></tr></thead>
                   <tbody>
                     ${resolved
                       .map((m) => {
                         const concept = CONCEPT_BY_ID[m.conceptId];
                         return `<tr>
                           <td>${esc(concept ? concept.title : m.conceptId)}</td>
                           <td class="small">${esc(m.criterion)}</td>
                           <td class="num">${m.count}</td>
                           <td class="num small">${shortDate(m.resolvedAt)}</td>
                         </tr>`;
                       })
                       .join("")}
                   </tbody>
                 </table>
               </div>
             </section>`
          : ""
      }
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Calibration
   ========================================================================== */

function renderCalibration() {
  const overall = calibration(state.attempts);
  const perUnit = UNITS.map((unit) => ({
    unit,
    verdict: calibrationVerdict(state.attempts, unit.id, `Unit ${unit.numeral}`),
    cal: calibration(state.attempts.filter((a) => a.unit === unit.id)),
  }));

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">Calibration</p>
        <h1 style="font-size:var(--text-2xl)">Whether your estimate of yourself is worth trusting</h1>
        <p class="lede">Confidence is captured before the grade is shown. Over-confidence is the failure mode that costs marks in an exam and is invisible without instrumentation — so it is measured here, in plain language, with the sample size beside every figure.</p>
      </header>

      ${
        overall.n === 0
          ? `<p class="empty" style="margin-block-start:var(--space-5)">No graded attempts yet. Answer one exit check and this page has something to say.</p>`
          : `<section style="margin-block-start:var(--space-6)">
               <h2 style="font-size:var(--text-xl)">Accuracy by confidence band</h2>
               <p class="small muted" style="margin-block-start:var(--space-2)">Over ${overall.n} attempts. Brier score ${overall.brier} — lower is better; 0 is perfect, 0.25 is what you get by always saying Medium.</p>
               <div class="card stack" style="margin-block-start:var(--space-3)">
                 ${overall.bands
                   .map((b) => {
                     const width = b.accuracy === null ? 0 : Math.round(b.accuracy * 100);
                     const warn = b.accuracy !== null && b.accuracy < 0.5;
                     return `<div class="band">
                       <span>${esc(b.label)}</span>
                       <span class="band__track"><span class="band__fill${warn ? " band__fill--warn" : ""}" style="width:${width}%"></span></span>
                       <span class="band__value">${b.accuracy === null ? "no data" : `${width}% · n=${b.n}`}</span>
                     </div>`;
                   })
                   .join("")}
               </div>
             </section>

             <section style="margin-block-start:var(--space-6)">
               <h2 style="font-size:var(--text-xl)">Verdict by unit</h2>
               <div class="stack" style="margin-block-start:var(--space-3)">
                 ${perUnit
                   .map(
                     ({ unit, verdict }) => `<div class="card">
                       <div class="card__head">
                         <p class="eyebrow">Unit ${esc(unit.numeral)} · ${esc(unit.title)}</p>
                         <span class="badge ${verdict.verdict === "over-confident" ? "badge--miss" : verdict.verdict === "calibrated" ? "badge--complete" : ""}">${esc(verdict.verdict.replace("-", " "))}</span>
                       </div>
                       <p style="margin-block-start:var(--space-2)">${esc(verdict.text)}</p>
                     </div>`,
                   )
                   .join("")}
               </div>
             </section>`
      }
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Exam mode (FR-8)
   ========================================================================== */

function renderExamList() {
  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">Exam mode</p>
        <h1 style="font-size:var(--text-2xl)">Three hours, seventy-five marks, no feedback</h1>
        <p class="lede">Built from the verified papers of ${esc(SUBJECT.papers)}. The clock is real, the budget is marks-per-minute, and no hint, correctness signal or model answer is available until you submit — that is the whole point of the mode.</p>
      </header>

      <div class="stack" style="margin-block-start:var(--space-6)">
        ${PAPERS.map((paper) => {
          const budget = marksBudget(paper);
          const best = state.exams.filter((e) => e.paperId === paper.id).sort((a, b) => b.report.totals.marks - a.report.totals.marks)[0];
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
            <p style="margin-block-start:var(--space-3)">${questions} questions in ${paper.sections.length} sections. Budget ${budget.minutesPerMark} minutes per mark — ${budget.secondsPerMark} seconds.${best ? ` Best attempt so far: ${formatMarks(best.report.totals.marks)} of ${best.report.totals.max} (${best.report.totals.percent}%).` : ""}</p>
            <p style="margin-block-start:var(--space-3)">
              <a class="btn" href="#/exam/${paper.id}">Open the paper</a>
              ${best ? `<a class="btn btn--quiet" href="#/exam/${paper.id}/report">Last report</a>` : ""}
            </p>
          </div>`;
        }).join("")}
      </div>
      ${colophon()}
    </div>`;
}

function renderExamRun(paperId) {
  const paper = PAPERS.find((p) => p.id === paperId);
  if (!paper) return renderExamList();
  const budget = marksBudget(paper);

  // A submitted paper is not "finished" until it has been marked, so the most
  // recent sitting is what decides which screen this is.
  const sitting = state.exams.filter((e) => e.paperId === paperId).slice(-1)[0];
  if (sitting && sitting.marking) {
    return renderExamMarking(paper, sitting);
  }
  const run = sitting && !sitting.submittedAt ? sitting : null;

  if (!run) {
    const questions = paper.sections.reduce((s, sec) => s + sec.questions.length, 0);
    return `
      <div class="view">
        <header class="stack">
          <p class="eyebrow">${esc(paper.label)} · before you start</p>
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
          <p class="small" style="color:var(--red)">Once started, the clock runs whether or not you are looking at it, and no feedback of any kind is available until you submit.</p>
          <p><button class="btn" type="button" data-start-exam="${esc(paper.id)}">Start the paper</button></p>
        </div>
        ${colophon()}
      </div>`;
  }

  const elapsed = now() - run.startedAt;
  const remaining = Math.max(0, paper.durationMinutes * 60 - Math.floor(elapsed / 1000));
  const answered = Object.values(run.answers).filter((a) => a.text && a.text.trim()).length;

  const sections = paper.sections
    .map(
      (section) => `<section style="margin-block-start:var(--space-6)">
        <div class="card__head">
          <h2 style="font-size:var(--text-xl)">${esc(section.name)}</h2>
          <p class="small muted">${esc(section.note)}</p>
        </div>
        ${section.questions
          .map((q) => {
            const a = run.answers[q.n] || { text: "" };
            return `<div class="exam-q">
              <div class="exam-q__head">
                <p class="eyebrow">Q${q.n} · ${formatMarks(q.marks)} marks · Unit ${esc(UNIT_BY_ID[q.unit]?.numeral || "?")}</p>
                <p class="small muted tabular">${Math.round(q.marks * budget.secondsPerMark)}s budget</p>
              </div>
              <p class="exam-q__prompt">${esc(q.prompt)}</p>
              ${q.figureNote ? `<p class="small muted" style="margin-block-end:var(--space-3)">${esc(q.figureNote)}</p>` : ""}
              <label class="visually-hidden" for="exam-${esc(paper.id)}-${q.n}">Answer to question ${q.n}</label>
              <textarea class="answer-input" id="exam-${esc(paper.id)}-${q.n}" data-exam-q="${q.n}" placeholder="Your answer. Nothing here is marked until you submit the whole paper.">${esc(a.text || "")}</textarea>
            </div>`;
          })
          .join("")}
      </section>`,
    )
    .join("");

  const html = `
    <div class="view view--wide">
      <div class="exam-bar" role="status" aria-live="polite">
        <span>${esc(paper.label)} · ${esc(SUBJECT.code)}</span>
        <span class="exam-bar__clock" id="exam-clock" data-warn="${remaining < 300}">${formatDuration(remaining)}</span>
        <span class="small"><span id="exam-answered">${answered}</span> answered · lockdown: no hints</span>
        <button class="btn btn--ghost" type="button" data-submit-exam style="min-height:2rem;padding-block:0.25rem">Submit paper</button>
      </div>
      ${sections}
      <p style="margin-block-start:var(--space-6)"><button class="btn" type="button" data-submit-exam>Submit the paper</button></p>
      ${colophon()}
    </div>`;

  window.setTimeout(() => startExamClock(paper, run), 0);
  return html;
}

function startExamClock(paper, run) {
  const clock = document.getElementById("exam-clock");
  if (!clock) return;
  if (ticker) window.clearInterval(ticker);
  ticker = window.setInterval(() => {
    const remaining = Math.max(0, paper.durationMinutes * 60 - Math.floor((now() - run.startedAt) / 1000));
    clock.textContent = formatDuration(remaining);
    clock.dataset.warn = String(remaining < 300);
    if (remaining === 0) {
      window.clearInterval(ticker);
      ticker = null;
      showToast("Time is up. The paper has been submitted.");
      submitExam(paper.id);
    }
  }, 1000);
}

function renderExamMarking(paper, run) {
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
        <p class="lede">The paper is submitted and locked. Mark each answer against the scheme you were not allowed to see during the exam, then the report is built from your marks.</p>
      </header>

      ${attempted
        .map(
          ({ q, a, section }) => `<section style="margin-block-start:var(--space-6)">
            <p class="eyebrow">${esc(section.name)} · Q${q.n} · ${formatMarks(q.marks)} marks</p>
            <p class="exam-q__prompt">${esc(q.prompt)}</p>
            <div class="card" style="background:var(--paper)">
              <p class="eyebrow">What you wrote</p>
              <p class="small" style="margin-block-start:var(--space-2);white-space:pre-wrap">${esc(a.text)}</p>
            </div>
            <ul class="rubric">
              ${q.rubric
                .map(
                  (c, i) => `<li class="rubric__item">
                    <input type="checkbox" id="exam-crit-${q.n}-${i}" data-exam-criterion="${q.n}:${i}"${a.hits && a.hits[i] ? " checked" : ""}>
                    <label class="rubric__label" for="exam-crit-${q.n}-${i}">${esc(c.label)}</label>
                    <span class="rubric__marks">${formatMarks(c.marks)}</span>
                  </li>`,
                )
                .join("")}
            </ul>
          </section>`,
        )
        .join("")}

      <p style="margin-block-start:var(--space-6)"><button class="btn" type="button" data-finish-exam>Finish marking and build the report</button></p>
      ${colophon()}
    </div>`;
}

function renderExamReport(paperId) {
  const paper = PAPERS.find((p) => p.id === paperId);
  const run = state.exams.filter((e) => e.paperId === paperId && e.submittedAt).sort((a, b) => b.submittedAt - a.submittedAt)[0];
  if (!paper || !run) return renderExamList();
  const report = run.report;

  return `
    <div class="view view--wide">
      <header class="stack">
        <p class="eyebrow">${esc(paper.label)} · report</p>
        <h1 style="font-size:var(--text-2xl)">${report.totals.marks} of ${report.totals.max} marks (${report.totals.percent}%)</h1>
        <p class="lede">${esc(report.diagnosis)}</p>
        <p class="small muted">${esc(paper.source)}</p>
      </header>

      <section style="margin-block-start:var(--space-6)">
        <h2 style="font-size:var(--text-xl)">Marks by unit</h2>
        <div class="card card--flush" style="margin-block-start:var(--space-3)">
          <table class="data-table">
            <caption>Joined to the syllabus map — this is the diagnostic, not the score</caption>
            <thead><tr><th scope="col">Unit</th><th scope="col">Questions</th><th scope="col">Marks</th><th scope="col">Percent</th></tr></thead>
            <tbody>
              ${report.byUnit
                .sort((a, b) => UNIT_ORDER.indexOf(a.unit) - UNIT_ORDER.indexOf(b.unit))
                .map(
                  (u) => `<tr>
                    <td>Unit ${esc(UNIT_BY_ID[u.unit]?.numeral || "?")} — ${esc(UNIT_BY_ID[u.unit]?.title || u.unit)}</td>
                    <td class="num">${u.answered}/${u.questions}</td>
                    <td class="num">${formatMarks(u.marks)} / ${formatMarks(u.max)}</td>
                    <td class="num">${u.percent}%</td>
                  </tr>`,
                )
                .join("")}
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
              ${report.rows
                .map(
                  (r) => `<tr>
                    <td class="num">${r.n}</td>
                    <td class="num">${formatMarks(r.marks)} / ${formatMarks(r.max)}</td>
                    <td class="num">${r.attempted ? formatDuration(r.timeSec) : "—"}</td>
                    <td class="num">${formatDuration(r.allowedSec)}</td>
                    <td class="small">${!r.attempted ? `<span style="color:var(--red)">Blank</span>` : r.overBudget ? `<span style="color:var(--mustard)">Over budget</span>` : "Within budget"}</td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <p class="small muted" style="margin-block-start:var(--space-3)">Time per question is attributed from when you were typing in it, so reading and thinking before the first keystroke is not counted. It is an approximation, and it is labelled as one.</p>
      </section>

      <p style="margin-block-start:var(--space-6)"><a class="btn btn--ghost" href="#/exam">Back to the papers</a></p>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   About
   ========================================================================== */

function renderAbout() {
  return `
    <div class="view">
      <header class="stack">
        <p class="eyebrow">How this works</p>
        <h1 style="font-size:var(--text-2xl)">What this is, and what it deliberately is not</h1>
        <p class="lede">A syllabus-bounded retrieval tool for five units of BCA-501. Roughly thirty per cent of your time goes into reading, seventy per cent into producing answers — that ratio is the design, not an accident.</p>
      </header>

      <div class="prose" style="margin-block-start:var(--space-5)">
        <p><strong>The five-part pattern.</strong> Every chunk follows the same shape: the concrete problem, why the obvious fix fails, a prediction gate you must answer before the mechanism is revealed, the mechanism itself, and what it costs. The gate is graded and stored like any other attempt. Skipping it is allowed, recorded, and flags the chunk for review.</p>
        <p><strong>Progression is gated on effort.</strong> A chunk unlocks the next one only when its exit check has been passed. A failed exit check replays the single beat that carried the missed idea, not the whole chunk, so a second attempt is cheap enough to actually happen.</p>
        <p><strong>Retrieval sets are bounded by the syllabus map.</strong> Units I, II, III, IV and VI are mapped. Unit V is absent from the map, so no practice set can reach it. At least thirty per cent of a unit's set is interleaved from units you have already studied.</p>
        <p><strong>Nothing is mastered on a same-day retry.</strong> A missed concept re-queues at roughly one, three and ten days. An entry in the mistake log is resolved only by a correct answer given seven days or more after the mistake — an immediate correction measures short-term memory, not learning.</p>
        <p><strong>Confidence is captured before the grade.</strong> The calibration dashboard shows accuracy per confidence band with the sample size beside it, and withholds a verdict when the sample is too small to support one. Over-confidence raises the review frequency for that unit.</p>
      </div>

      <section style="margin-block-start:var(--space-7)">
        <h2 style="font-size:var(--text-xl)">Where it departs from the specification, and why</h2>
        <div class="prose" style="margin-block-start:var(--space-3)">
          <p><strong>Grading is self-marked, not model-graded.</strong> The specification's grader is a model call constrained to each item's rubric. This build has no model key, so the rubric is shown and you mark against it. The order the specification requires is preserved — answer, then confidence, then the scheme, then the model answer — but the judgement is yours. It is honest about that in every card, and every graded answer carries a dispute action.</p>
          <p><strong>No voice answers.</strong> Spoken answers require a speech path and a transcript editor. Typed answers only, and the specification's transcript rule is therefore not exercised.</p>
          <p><strong>Single user, local only.</strong> All state lives in this browser's storage. There is no account, no server and no transmission of anything you type. Clearing site data deletes your history — export the mistake log before you do.</p>
          <p><strong>Time per question is approximate.</strong> It is attributed from typing activity, so it under-counts thinking done before the first keystroke. The report labels it as an approximation rather than presenting it as a measurement.</p>
          <p><strong>Two items in the Dec 2024 paper carry a transcription caveat.</strong> Q6's diagram has cardinality marks that are not legible in the copy held, so the question states both cases and requires you to say which applies. That is also what the marking scheme asks for.</p>
        </div>
      </section>

      <section style="margin-block-start:var(--space-7)">
        <h2 style="font-size:var(--text-xl)">Content and sources</h2>
        <div class="prose" style="margin-block-start:var(--space-3)">
          <p>Scope comes from the ${esc(SUBJECT.university)} ${esc(SUBJECT.programme)} syllabus for ${esc(SUBJECT.code)} ${esc(SUBJECT.title)}. Exam mode uses the verified question papers of ${esc(SUBJECT.papers)}, transcribed from the papers themselves. Every mark scheme here is written for this platform against the wording of each question; none of them is an official university scheme, and no grade on this site is attributable to an examiner.</p>
          <p>Unit weights are derived from how often each unit was examined across those three papers, and the count is stated beside each weight so you can check the arithmetic.</p>
        </div>
      </section>

      <p style="margin-block-start:var(--space-6)">
        <button class="btn btn--danger" type="button" data-reset>Delete all progress in this browser</button>
      </p>
      ${colophon()}
    </div>`;
}

/* ==========================================================================
   Events
   ========================================================================== */

function bindView(view) {
  if (view.name === "concept") bindConcept();
  if (view.name === "review") bindItemCards();
  if (view.name === "mistakes") bindMistakes();
  if (view.name === "exam-run") bindExam(view);
  if (view.name === "about") bindAbout();
}

function bindConcept() {
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

  bindItemCards({ isConcept: true });
}

function bindItemCards({ isConcept = false } = {}) {
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
          showToast("Pick Low, Medium or High. The point of the step is that it is recorded before the grade.");
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
        recordAttempt(item, stage, marked, { isConcept });
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
          showToast("Recorded. The dispute is stored against this attempt, and the item is flagged for content review.");
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

function recordAttempt(item, stage, marked, { isConcept }) {
  const timestamp = now();
  const attempt = {
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
  };
  state.attempts.push(attempt);

  const previous = state.concepts[item.conceptId];
  const delayDays = previous && previous.lastReviewedAt
    ? (timestamp - previous.lastReviewedAt) / 86400000
    : 0;

  const scheduling = scheduleAfter(previous, {
    correct: marked.ratio >= 0.5,
    delayDays,
    now: timestamp,
  });

  const completed = previous && previous.status === "complete";
  state.concepts[item.conceptId] = {
    ...previous,
    ...scheduling,
    status:
      item.kind === "exit"
        ? marked.ratio >= 0.5
          ? "complete"
          : "check-pending"
        : completed
          ? "complete"
          : previous?.status === "check-pending"
            ? "check-pending"
            : "available",
    attempts: (previous?.attempts || 0) + 1,
  };

  if (marked.ratio >= 0.5) {
    state.mistakes = resolveMistakes(state.mistakes, {
      conceptId: item.conceptId,
      at: timestamp,
    });
    if (state.concepts[item.conceptId].flaggedAt) {
      state.concepts[item.conceptId].flaggedAt = null;
    }
  }

  for (const criterion of marked.criteria) {
    if (criterion.hit) continue;
    state.mistakes = logMistake(
      state.mistakes,
      {
        conceptId: item.conceptId,
        unit: item.unit,
        criterion: criterion.label,
        tag: criterion.tag,
        itemId: item.id,
      },
      timestamp,
    );
  }

  saveState(state);
}

function bindMistakes() {
  const exportButton = main.querySelector("[data-export]");
  if (exportButton) {
    exportButton.addEventListener("click", () => {
      const csv = exportMistakes(state.mistakes, now());
      downloadFile(`bca501-mistake-log-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
      showToast("Exported. It includes resolved entries, not just the open ones.");
    });
  }
}

function bindAbout() {
  const reset = main.querySelector("[data-reset]");
  if (reset) {
    reset.addEventListener("click", () => {
      const sure = window.confirm(
        "Delete all progress in this browser — every attempt, mistake, schedule and exam result? This cannot be undone.",
      );
      if (!sure) return;
      state = clearState();
      saveState(state);
      showToast("Progress deleted.");
      navigate("#/");
      render();
    });
  }
}

function bindExam(view) {
  const paper = PAPERS.find((p) => p.id === view.paperId);
  if (!paper) return;

  const start = main.querySelector("[data-start-exam]");
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
      });
      saveState(state);
      render();
    });
    return;
  }

  let lastTick = now();
  const stamp = () => {
    const run = state.exams.find((e) => e.paperId === paper.id && !e.submittedAt);
    return run;
  };

  main.querySelectorAll("[data-exam-q]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const run = stamp();
      if (!run) return;
      const n = textarea.dataset.examQ;
      const delta = now() - lastTick;
      lastTick = now();
      run.answers[n] = run.answers[n] || { text: "", timeMs: 0, hits: {} };
      run.answers[n].text = textarea.value;
      run.answers[n].timeMs = (run.answers[n].timeMs || 0) + delta;
      const counter = document.getElementById("exam-answered");
      if (counter) {
        counter.textContent = String(
          Object.values(run.answers).filter((a) => a.text && a.text.trim()).length,
        );
      }
      saveState(state);
    });
  });

  main.querySelectorAll("[data-exam-criterion]").forEach((box) => {
    box.addEventListener("change", () => {
      const run = stamp() || state.exams.find((e) => e.paperId === paper.id && e.marking);
      if (!run) return;
      const [n, i] = box.dataset.examCriterion.split(":");
      run.answers[n] = run.answers[n] || { text: "", timeMs: 0, hits: {} };
      run.answers[n].hits = run.answers[n].hits || {};
      run.answers[n].hits[i] = box.checked;
      saveState(state);
    });
  });

  main.querySelectorAll("[data-submit-exam]").forEach((button) => {
    button.addEventListener("click", () => submitExam(paper.id));
  });

  const finish = main.querySelector("[data-finish-exam]");
  if (finish) {
    finish.addEventListener("click", () => finishExamMarking(paper.id));
  }
}

function submitExam(paperId) {
  const paper = PAPERS.find((p) => p.id === paperId);
  const run = state.exams.find((e) => e.paperId === paperId && !e.submittedAt);
  if (!paper || !run) return;
  const attempted = Object.values(run.answers).filter((a) => a.text && a.text.trim()).length;
  if (attempted === 0) {
    showToast("Nothing has been written yet. Submit again once you have answered at least one question.");
    return;
  }
  run.marking = true;
  run.submittedAt = now();
  saveState(state);
  render();
}

function finishExamMarking(paperId) {
  const paper = PAPERS.find((p) => p.id === paperId);
  const run = state.exams.find((e) => e.paperId === paperId && e.marking);
  if (!paper || !run) return;

  for (const section of paper.sections) {
    for (const q of section.questions) {
      const a = run.answers[q.n];
      if (!a) continue;
      const hits = a.hits || {};
      const marked = markAttempt(q, hits);
      a.marks = marked.total;
      a.ratio = marked.ratio;
      if (a.text && a.text.trim()) {
        state.attempts.push({
          id: uid(),
          itemId: `exam-${paper.id}-${q.n}`,
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
              itemId: `exam-${paper.id}-${q.n}`,
            },
            run.submittedAt,
          );
        }
      }
    }
  }

  run.marking = false;
  run.report = examReport(paper, run.answers);
  saveState(state);
  navigate(`#/exam/${paperId}/report`);
  render();
}

/** Exam questions are tagged to a unit, not a concept; log them against the unit's first chunk. */
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
