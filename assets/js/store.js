/**
 * Persistence. Everything is local to this browser — there is no server, no
 * account and no transmission (the product is single-user by design).
 *
 * The state shape is versioned so that a future change can migrate rather than
 * silently discard a student's history.
 */

const KEY = "bca501-dbms-state";
const VERSION = 1;

export function emptyState() {
  return {
    version: VERSION,
    createdAt: Date.now(),
    attempts: [],
    gates: [],
    concepts: {},
    mistakes: [],
    exams: [],
    settings: { interleaveRatio: 0.3 },
  };
}

export function loadState() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch (error) {
    // Private browsing or a blocked storage partition: run in memory for this
    // session rather than failing to open at all.
    return { state: emptyState(), persisted: false };
  }
  if (!raw) return { state: emptyState(), persisted: true };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== VERSION) {
      return { state: migrate(parsed), persisted: true };
    }
    return { state: { ...emptyState(), ...parsed }, persisted: true };
  } catch (error) {
    // A corrupted store must not lock the student out of the material.
    return { state: emptyState(), persisted: false };
  }
}

function migrate(parsed) {
  const base = emptyState();
  if (!parsed || typeof parsed !== "object") return base;
  return {
    ...base,
    attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
    gates: Array.isArray(parsed.gates) ? parsed.gates : [],
    concepts: parsed.concepts && typeof parsed.concepts === "object" ? parsed.concepts : {},
    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
    exams: Array.isArray(parsed.exams) ? parsed.exams : [],
  };
}

let writeTimer = null;

export function saveState(state) {
  if (writeTimer) window.clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
      showToast("Could not save — browser storage is full or blocked. Your work this session is still in memory.");
    }
  }, 150);
}

export function clearState() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (error) {
    /* nothing to clear */
  }
  return emptyState();
}

export function downloadFile(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let toastTimer = null;

export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 6000);
}
