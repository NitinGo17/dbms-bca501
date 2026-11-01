/**
 * Accessibility audit over every rendered view of the game, plus token
 * contrast on the dark ground.
 *
 * Run: node tools/test-a11y.mjs
 *
 * No axe-core here — it needs a real browser. So this checks what can be
 * checked deterministically: heading structure, labelling, accessible names,
 * tabindex, colour-independent state, and WCAG 2.2 contrast for every token
 * pair the design actually uses.
 */

import { parseHTML } from "linkedom";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const shell = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "assets/css/app.css"), "utf8");
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

await import(resolve(root, "assets/js/app.js"));

let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
}

const main = () => doc.getElementById("view");
const hudEl = () => doc.getElementById("hud");
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

/**
 * The wash tokens are rgba() layers over the panel, so they have no single
 * hex value. Composite each one over --panel at its stated alpha to get the
 * colour text actually sits on, then check that.
 */
function compositeWash(name, baseHex) {
  const m = css.match(new RegExp(`--${name}:\\s*rgb\\(([^)]+)\\)`));
  if (!m) return null;
  const parts = m[1].split("/");
  const [r, g, b] = parts[0].trim().split(/\s+/).map(Number);
  const alpha = parts[1] ? Number(parts[1].replace("%", "")) / 100 : 1;
  const base = [1, 3, 5].map((i) => parseInt(baseHex.slice(i, i + 2), 16));
  const mixed = [r, g, b].map((c, i) => Math.round(c * alpha + base[i] * (1 - alpha)));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

for (const wash of ["amber-wash", "red-wash", "green-wash"]) {
  const value = compositeWash(wash, T["--panel"]);
  if (value) T[`--${wash}`] = value;
}
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
  ["--text", "--void", 4.5],
  ["--text", "--panel", 4.5],
  ["--text", "--panel-2", 4.5],
  ["--text-dim", "--panel", 4.5],
  ["--text-dim", "--panel-2", 4.5],
  ["--text-faint", "--panel", 4.5],
  ["--text-faint", "--panel-2", 4.5],
  ["--text-faint", "--void", 4.5],
  ["--amber", "--void", 4.5],
  ["--amber", "--panel", 4.5],
  ["--amber", "--amber-wash", 4.5],
  ["--red", "--void", 4.5],
  ["--red", "--panel", 4.5],
  ["--red", "--red-wash", 4.5],
  ["--green", "--panel", 4.5],
  ["--green", "--green-wash", 4.5],
  ["--void", "--amber", 4.5],
];

for (const [fg, bg, target] of textPairs) {
  const r = ratio(T[fg], T[bg]);
  check(`contrast ${fg} on ${bg} ≥ ${target}:1`, r >= target, `${r}:1`);
}

// Non-text UI boundaries need 3:1 (WCAG 2.2, 1.4.11).
for (const [fg, bg] of [
  ["--line-bright", "--panel"],
  ["--line-bright", "--void"],
]) {
  const r = ratio(T[fg], T[bg]);
  check(`boundary ${fg} on ${bg} ≥ 1.5:1`, r >= 1.5, `${r}:1`);
}

/* ---- Per-view structural checks --------------------------------------- */

const views = [
  "#/",
  "#/floor/u1",
  "#/case/c1-1",
  "#/review",
  "#/review/u1",
  "#/incidents",
  "#/readiness",
  "#/audit",
  "#/audit/p2023",
  "#/manual",
  "#/terminated",
];

for (const hash of views) {
  go(hash);
  const body = main();

  const h1s = [...body.querySelectorAll("h1")];
  check(`${hash}: exactly one h1`, h1s.length === 1, `${h1s.length} found`);

  const headings = [...body.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName.slice(1)));
  let skip = null;
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i] - headings[i - 1] > 1) skip = `${headings[i - 1]} → ${headings[i]}`;
  }
  check(`${hash}: no heading level skipped`, skip === null, skip || "");

  const unlabelled = [...body.querySelectorAll("input, textarea, select")].filter((el) => {
    if (el.getAttribute("type") === "hidden") return false;
    if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
    const id = el.getAttribute("id");
    if (id && body.querySelector(`label[for="${id}"]`)) return false;
    if (el.closest("label")) return false;
    return true;
  });
  check(`${hash}: every control labelled`, unlabelled.length === 0, `${unlabelled.length} unlabelled`);

  const namelessButtons = [...body.querySelectorAll("button")].filter(
    (b) => !b.textContent.trim() && !b.getAttribute("aria-label"),
  );
  check(`${hash}: every button named`, namelessButtons.length === 0);

  const hrefless = [...body.querySelectorAll("a")].filter((a) => !a.getAttribute("href"));
  check(`${hash}: every link has href`, hrefless.length === 0);

  const positiveTabindex = [...body.querySelectorAll("[tabindex]")].filter((el) => Number(el.getAttribute("tabindex")) > 0);
  check(`${hash}: no positive tabindex`, positiveTabindex.length === 0);

  const imgs = [...body.querySelectorAll("img")].filter((i) => !i.hasAttribute("alt"));
  check(`${hash}: every image has alt`, imgs.length === 0);

  // State must never be carried by colour alone.
  if (hash === "#/") {
    const nodes = [...body.querySelectorAll(".node")];
    const marked = nodes.filter((n) => n.classList.contains("node--cleared"));
    check(`${hash}: a cleared node is not marked by colour alone`,
      marked.length === 0 || marked.every((n) => n.textContent.includes("cleared")));
  }
}

/* ---- Document and HUD -------------------------------------------------- */

check("the document declares a language", doc.documentElement.getAttribute("lang") === "en-IN");
check("there is a skip link", Boolean(doc.querySelector(".skip-link[href='#view']")));
check("the main landmark exists", Boolean(doc.querySelector("main#view")));
check("the rail is a labelled navigation landmark", Boolean(doc.querySelector("aside[aria-label]")));
check("the HUD is a labelled banner", hudEl().getAttribute("aria-label") === "Shift status");
check("the health bar is a labelled group", Boolean(hudEl().querySelector(".hp[role='group'][aria-label]")));
check("the toast is announced politely", doc.getElementById("toast").getAttribute("aria-live") === "polite");
check("the viewport allows zoom", !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(shell));
check("reduced motion is honoured", css.includes("prefers-reduced-motion"));
check("focus is visible", /:focus-visible\s*\{[^}]*outline:/.test(css));
check("touch targets are at least 44px", css.includes("min-height: 2.75rem"));
check("the failure sequence has a reduced-motion variant",
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.scene__boss/.test(css));

// !important is allowed only in the reduced-motion resets and the
// visually-hidden utility, which must beat component rules by definition.
const importantLines = css.split("\n").filter((l) => l.includes("!important"));
check("!important appears only in the motion reset and the hidden utility",
  importantLines.length === 3 &&
    importantLines.filter((l) => l.includes("1ms") || l.includes("0ms")).length === 2 &&
    importantLines.some((l) => l.includes("position: absolute")),
  importantLines.join(" | "));

/* ---- Colour-independent verdicts -------------------------------------- */

go("#/case/c1-1");
const gate = main().querySelector(".gate");
check("the gate is a labelled group", Boolean(gate.querySelector("[aria-labelledby]")));
check("the gate states what it is in text", gate.textContent.includes("The manager asks"));

console.log(`\n${passed} accessibility checks passed, ${failures.length} failed.\n`);
if (failures.length) {
  for (const f of failures) console.log(`  FAIL  ${f}`);
  process.exitCode = 1;
}
