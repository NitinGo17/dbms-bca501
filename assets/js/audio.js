/**
 * Sound.
 *
 * Everything is synthesised with the Web Audio API — no files, no downloads, no
 * third-party requests. It is off until the student turns it on, because
 * autoplaying audio is hostile and browsers block it anyway.
 *
 * The cues are deliberately dry: footsteps, a heartbeat that speeds up, a
 * flatline. Nothing musical, nothing that would feel like a reward.
 */

let ctx = null;
let enabled = false;

function context() {
  if (ctx) return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

export function isEnabled() {
  return enabled;
}

export function setEnabled(value) {
  enabled = Boolean(value);
  if (enabled) {
    const c = context();
    if (c && c.state === "suspended") c.resume();
  }
  return enabled;
}

function ready() {
  if (!enabled) return null;
  const c = context();
  if (!c) return null;
  if (c.state === "suspended") c.resume();
  return c;
}

/** A short burst of filtered noise — a footstep on a hard floor. */
export function footstep(intensity = 1) {
  const c = ready();
  if (!c) return;
  const length = Math.floor(c.sampleRate * 0.09);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 220 + intensity * 120;

  const gain = c.createGain();
  gain.gain.value = 0.16 * intensity;

  source.connect(filter).connect(gain).connect(c.destination);
  source.start();
}

/** Two low thumps, quickening as severity rises. */
export function heartbeat(severity = 1) {
  const c = ready();
  if (!c) return;
  const gap = 0.34 - severity * 0.035;
  const thump = (at, strength) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(64, at);
    osc.frequency.exponentialRampToValueAtTime(38, at + 0.16);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.28 * strength, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    osc.connect(gain).connect(c.destination);
    osc.start(at);
    osc.stop(at + 0.26);
  };
  const now = c.currentTime;
  thump(now, 1);
  thump(now + gap, 0.7);
}

/** A flat, unbroken tone. */
export function flatline(seconds = 1.6) {
  const c = ready();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = 988;
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, c.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, c.currentTime + seconds - 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + seconds);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + seconds);
}

/** A soft click for a pressed control. */
export function click() {
  const c = ready();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.value = 320;
  gain.gain.setValueAtTime(0.04, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.05);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.06);
}
