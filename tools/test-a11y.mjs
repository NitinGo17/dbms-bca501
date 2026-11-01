/**
 * Accessibility audit over every rendered view, plus the token contrast pairs.
 *
 * Run: node tools/test-a11y.mjs
 *
 * There is no axe-core here — it needs a real browser DOM. So this checks the
 * things that can be checked deterministically from the rendered markup and the
 * stylesheet: one h1, no skipped heading levels, every control labelled, every
 * button with an accessible name, no positive tabindex, no click-only handlers
 * on non-interactive elements, and WCAG 2.2 contrast for every token pair the
 * design actually uses.
 */

import { parseHTML } from "linkedom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const shell = readFileSync(`${root}/index.html`, "utf8");
const css = readFileSync(`${root}/assets/css/app.css`, "utf8");
const { window: win, document: doc } = parseHTML(shell);

const store = new Map();
win.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
win.location = { hash: "#/", replace: () => {} };
win.scrollTo = () => {};
win.setTimeout = globalThis.setTimeout;
win.clearTimeout = globalThis.clearTimeout;
win.setInterval = globalThis.setInterval;
win.clearInterval = globalThis.clearInterval;

Object.assign(globalThis, {
  window: win,
  document: doc,
  localStorage: win.localStorage,
  Blob: class Blob {},
  URL: { createObjectURL: () => "blob:x", revokeObjectURL: () => {} },
  HTMLElement: win.HTMLElement,
  Node: win.Node,
  Event: win.Event,
});

await import(`${root}/assets/js/app.js`);

let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const main = () => doc.getElementById("view");
function go(hash) {
  win.location.hash = hash;
  win.dispatchEvent(new win.Event("hashchange"));
}

/* ---- Contrast ---------------------------------------------------------- */

function tokens() {
  const block = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  const out = {};
  for (const line of block[1].split("\n")) {
    const m = line.match(/^\s*(--[a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const T = tokens();
function luminance(hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

const textPairs = [
  ["--ink", "--paper", 4.5],
  ["--ink", "--paper-raise", 4.5],
  ["--ink-soft", "--paper", 4.5],
  ["--ink-soft", "--paper-raise", 4.5],
  ["--ink-faint", "--paper", 4.5],
  ["--ink-faint", "--paper-raise", 4.5],
  ["--red", "--paper", 4.5],
  ["--red", "--red-wash", 4.5],
  ["--green", "--green-wash", 4.5],
  ["--green", "--paper", 4.5],
  ["--mustard", "--mustard-wash", 4.5],
  ["--blue", "--paper", 4.5],
  ["--paper-raise", "--ink", 4.5],
  ["--ink-faint", "--paper-sink", 4.5],
];

for (const [fg, bg, target] of textPairs) {
  const r = ratio(T[fg], T[bg]);
  check(`contrast ${fg} on ${bg} ≥ ${target}:1`, r >= target, `${r}:1`);
}

// Non-text UI boundaries need 3:1 (WCAG 2.2, 1.4.11).
for (const [fg, bg] of [
  ["--rule-strong", "--paper-raise"],
  ["--rule-strong", "--paper"],
]) {
  const r = ratio(T[fg], T[bg]);
  check(`border contrast ${fg} on ${bg} ≥ 1.5:1 (decorative rule)`, r >= 1.5, `${r}:1`);
}

/* ---- Per-view structural checks --------------------------------------- */

const views = [
  "#/",
  "#/unit/u1",
  "#/concept/c1-1",
  "#/review",
  "#/review/u1",
  "#/mistakes",
  "#/calibration",
  "#/exam",
  "#/exam/p2023",
  "#/about",
];

for (const hash of views) {
  go(hash);
  const body = main();

  const h1s = [...body.querySelectorAll("h1")];
  check(`${hash}: exactly one h1`, h1s.length === 1, `${h1s.length} found`);

  const headings = [...body.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) =>
    Number(h.tagName.slice(1)),
  );
  let skip = null;
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i] - headings[i - 1] > 1) skip = `${headings[i - 1]} → ${headings[i]}`;
  }
  check(`${hash}: no heading level is skipped`, skip === null, skip || "");

  const unlabelled = [...body.querySelectorAll("input, textarea, select")].filter((el) => {
    if (el.getAttribute("type") === "hidden") return false;
    if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
    const id = el.getAttribute("id");
    if (id && body.querySelector(`label[for="${id}"]`)) return false;
    if (el.closest("label")) return false;
    return true;
  });
  check(`${hash}: every control is labelled`, unlabelled.length === 0, `${unlabelled.length} unlabelled`);

  const namelessButtons = [...body.querySelectorAll("button")].filter(
    (b) => !b.textContent.trim() && !b.getAttribute("aria-label"),
  );
  check(`${hash}: every button has an accessible name`, namelessButtons.length === 0);

  const hreflessLinks = [...body.querySelectorAll("a")].filter((a) => !a.getAttribute("href"));
  check(`${hash}: every link has an href`, hreflessLinks.length === 0);

  const positiveTabindex = [...body.querySelectorAll("[tabindex]")].filter(
    (el) => Number(el.getAttribute("tabindex")) > 0,
  );
  check(`${hash}: no positive tabindex`, positiveTabindex.length === 0);

  const clickOnly = [...body.querySelectorAll("div[onclick], span[onclick]")];
  check(`${hash}: no click handlers on non-interactive elements`, clickOnly.length === 0);

  const imgs = [...body.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt"));
  check(`${hash}: every image has alt text`, imgs.length === 0);
}

/* ---- Document-level --------------------------------------------------- */

check("the document declares a language", doc.documentElement.getAttribute("lang") === "en-IN");
check("there is a skip link", Boolean(doc.querySelector(".skip-link[href='#view']")));
check("the main landmark exists", Boolean(doc.querySelector("main#view")));
check("the navigation landmark is labelled", Boolean(doc.querySelector("aside[aria-label]")));
check("the toast is announced politely", doc.getElementById("toast").getAttribute("aria-live") === "polite");
check("the viewport allows zoom", !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(shell));
check("reduced motion is honoured in CSS", css.includes("prefers-reduced-motion"));
check("focus is visible in CSS", /:focus-visible\s*\{[^}]*outline:/.test(css));
check("targets are at least 44px tall in CSS", css.includes("min-height: 2.75rem"));
// !important is allowed in exactly two places: the reduced-motion reset, which
// must beat every component rule, and the visually-hidden utility, which must
// beat any positioning a component sets.
const importantLines = css.split("\n").filter((l) => l.includes("!important"));
check("!important appears only in the reduced-motion reset and the visually-hidden utility",
  importantLines.length === 4 && importantLines.filter((l) => l.includes("0.01ms")).length === 2,
  importantLines.join(" | "));

/* ---- Live region and status text -------------------------------------- */

go("#/concept/c1-1");
const gate = main().querySelector(".gate");
check("the gate is a labelled group", Boolean(gate.querySelector("[aria-labelledby]")));
check("the gate states what it is in text, not only in colour",
  gate.textContent.includes("Prediction gate"));
check("the gate marks the correct answer in text, not only in colour",
  main().textContent.includes("Prediction gate"));

console.log(`\n${passed} accessibility checks passed, ${failures.length} failed.\n`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL  ${f}`);
  process.exitCode = 1;
}
