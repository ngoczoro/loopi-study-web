/**
 * A soft phone ring for "X started a call", made with the Web Audio API (no sound file).
 *
 * Browsers only let a page make sound after the user has interacted with it, so
 * `unlockRingtone` is called on the first click or key press; before that the ring is
 * silently skipped (the toast and notifications still show).
 */

const RING_COUNT = 3;
const RING_PERIOD_S = 3;
// Two short bursts per ring, each a mix of two tones like a desk phone.
const BURST_OFFSETS_S = [0, 0.55];
const BURST_LENGTH_S = 0.4;
const TONES_HZ = [440, 480];
const VOLUME = 0.12;

let context = null;
let stopCurrent = null;
let suppressed = false;

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!context) {
    try {
      context = new AudioContextClass();
    } catch {
      return null;
    }
  }
  return context;
}

/** Call from a user gesture so later rings can play, even in a background tab. */
export function unlockRingtone() {
  const audio = getContext();
  if (audio?.state === "suspended") audio.resume().catch(() => {});
}

export function stopRingtone() {
  stopCurrent?.();
}

/** No ringing while the user is in a call themselves. */
export function setRingtoneSuppressed(value) {
  suppressed = value;
  if (value) stopRingtone();
}

/** Rings a few times, then stops by itself. A new ring replaces one still playing. */
export function playRingtone() {
  if (suppressed) return;
  stopRingtone();
  const audio = getContext();
  if (!audio || audio.state !== "running") return;

  const master = audio.createGain();
  master.gain.value = VOLUME;
  master.connect(audio.destination);

  const oscillators = [];
  const start = audio.currentTime + 0.05;
  for (let ring = 0; ring < RING_COUNT; ring += 1) {
    for (const offset of BURST_OFFSETS_S) {
      const at = start + ring * RING_PERIOD_S + offset;
      const envelope = audio.createGain();
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(1, at + 0.02);
      envelope.gain.setValueAtTime(1, at + BURST_LENGTH_S - 0.03);
      envelope.gain.linearRampToValueAtTime(0, at + BURST_LENGTH_S);
      envelope.connect(master);
      for (const frequency of TONES_HZ) {
        const oscillator = audio.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.connect(envelope);
        oscillator.start(at);
        oscillator.stop(at + BURST_LENGTH_S + 0.02);
        oscillators.push(oscillator);
      }
    }
  }

  let timer = null;
  const cleanup = () => {
    clearTimeout(timer);
    oscillators.forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // Already stopped.
      }
    });
    master.disconnect();
    if (stopCurrent === cleanup) stopCurrent = null;
  };
  timer = setTimeout(cleanup, (RING_COUNT * RING_PERIOD_S + 0.5) * 1000);
  stopCurrent = cleanup;
}
