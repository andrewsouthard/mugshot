"use client";

// The countdown alarm: a beep through Web Audio plus vibration where the
// browser supports it (iOS Safari doesn't). Browsers only let audio start
// after a user gesture, so call unlockAudio() from a tap before you need it.

let context: AudioContext | undefined;

export function unlockAudio() {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
  } catch {
    // No Web Audio; the vibration and flash still fire.
  }
}

export function soundAlarm() {
  navigator.vibrate?.([200, 100, 200, 100, 200]);
  if (!context) return;
  const start = context.currentTime;
  for (let beep = 0; beep < 3; beep++) {
    const at = start + beep * 0.3;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.4, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.2);
  }
}
