/**
 * Shared alert utilities for admin pages.
 * Extracted from /admin/operations to reuse across dashboard and other admin pages.
 */

const ALERT_STORAGE_KEY = "admin_ops_alert_enabled";

export function isAlertEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(ALERT_STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

export function setAlertEnabled(enabled: boolean): void {
  localStorage.setItem(ALERT_STORAGE_KEY, String(enabled));
}

export function playAlertBeep(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "square";
    gain.gain.value = 0.15;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1100;
      osc2.type = "square";
      gain2.gain.value = 0.15;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.2);
      setTimeout(() => ctx.close(), 300);
    }, 180);
  } catch {
    /* Web Audio not supported */
  }
}

export function triggerVibration(): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    /* Vibration API not supported */
  }
}
