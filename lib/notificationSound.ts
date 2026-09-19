"use client";

// Short chat/notification sounds generated with the Web Audio API — no audio assets needed.
let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

/**
 * Browsers only allow audio after the user has interacted with the page. Call this from a real click / key
 * press (we hook the first one globally) so later notification sounds are allowed to play.
 */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

// ---- user preference (per browser) ----
const SOUND_KEY = "wayfeir-notification-sound";

export function isNotificationSoundEnabled() {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setNotificationSoundEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // storage blocked — the preference just won't persist
  }
}

interface Note {
  from: number;
  to: number;
  at: number;
  duration: number;
  volume: number;
}

// One soft "bubble" note: a sine that glides upward, with a quiet triangle an octave up for body.
function playNote(ctx: AudioContext, start: number, { from, to, duration, volume }: Omit<Note, "at">) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(ctx.destination);

  const body = ctx.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(from, start);
  body.frequency.exponentialRampToValueAtTime(to, start + duration * 0.6);
  body.connect(gain);
  body.start(start);
  body.stop(start + duration + 0.02);

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.25;
  shimmerGain.connect(gain);
  const shimmer = ctx.createOscillator();
  shimmer.type = "triangle";
  shimmer.frequency.setValueAtTime(from * 2, start);
  shimmer.frequency.exponentialRampToValueAtTime(to * 2, start + duration * 0.6);
  shimmer.connect(shimmerGain);
  shimmer.start(start);
  shimmer.stop(start + duration + 0.02);
}

/** Skype-style notification: a quick, bubbly three-note rising "bloop-bloop-bloop". Respects the mute setting. */
export function playNotificationSound() {
  if (!isNotificationSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime + 0.01;
  const notes: Note[] = [
    { from: 660, to: 740, at: 0, duration: 0.13, volume: 0.16 },
    { from: 880, to: 990, at: 0.12, duration: 0.15, volume: 0.17 },
    { from: 1175, to: 1320, at: 0.26, duration: 0.24, volume: 0.15 },
  ];
  notes.forEach(({ at, ...note }) => playNote(ctx, now + at, note));
}

// Short two-tone chat ping used for chat messages.
export function playMessageSound(kind: "sent" | "received" = "received") {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const freqs = kind === "sent" ? [660, 880] : [880, 660];
  freqs.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    const start = now + i * 0.12;
    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.12);
  });
}
