/*
 * DAILY WORKOUT — layered reminder system.
 *
 * A pure web PWA can't reliably fire a notification at a set time when fully
 * closed, so we layer three mechanisms (best available wins):
 *   1. NATIVE (installed app): @capacitor/local-notifications schedules a true
 *      OS daily alarm at the chosen time — fires even when the app is closed.
 *   2. WEB NOTIFICATION (tab/Service Worker alive): a system Notification fired
 *      by an in-app timer when the chosen minute arrives.
 *   3. IN-APP BANNER (always): when the app is opened past the reminder time and
 *      today's workout isn't done, a banner nudges the user. (See ReminderBanner.)
 *
 * The plugin is loaded with a guarded dynamic import so the web bundle never
 * depends on it, and native calls are skipped unless actually running natively.
 */
import { Capacitor } from '@capacitor/core';

export const REMINDER_ID = 4242;
const ICON = `${import.meta.env.BASE_URL}Assets/guide-fox-sprite.webp`;

export const REMINDER_STRINGS = {
  en: { title: 'Time for your brain workout 🧠', body: 'A few minutes keeps your streak alive. Tap to start.' },
  ar: { title: 'حان وقت تمرين دماغك 🧠', body: 'بضع دقائق تحافظ على سلسلتك. اضغط للبدء.' },
};

const isNative = () => {
  try { return Capacitor?.isNativePlatform?.() === true; } catch { return false; }
};

export function webNotifSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Current permission: 'granted' | 'denied' | 'default' | 'unsupported'. */
export function notifPermission() {
  if (isNative()) return 'native';
  if (!webNotifSupported()) return 'unsupported';
  return Notification.permission;
}

/** Ask for permission (native or web). Resolves true when granted. */
export async function ensureNotifPermission() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const s = await LocalNotifications.checkPermissions();
      if (s.display === 'granted') return true;
      const r = await LocalNotifications.requestPermissions();
      return r.display === 'granted';
    } catch { return false; }
  }
  if (!webNotifSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try { return (await Notification.requestPermission()) === 'granted'; } catch { return false; }
}

/**
 * Reschedule (or cancel) the native daily alarm. No-op on web — there the
 * in-app timer + banner handle it. Safe to call whenever prefs change.
 */
export async function syncNativeReminder({ enabled, time, days }, lang = 'en') {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    // Clear the daily alarm + any per-weekday alarms from a previous setting.
    const ids = [REMINDER_ID, ...Array.from({ length: 7 }, (_, i) => REMINDER_ID + 1 + i)];
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    if (!enabled || !time) return;
    const [hour, minute] = time.split(':').map(Number);
    const s = REMINDER_STRINGS[lang] || REMINDER_STRINGS.en;
    const dayList = Array.isArray(days) && days.length ? days : [0, 1, 2, 3, 4, 5, 6];
    if (dayList.length >= 7) {
      // Every day → one simple repeating daily alarm.
      await LocalNotifications.schedule({
        notifications: [{
          id: REMINDER_ID, title: s.title, body: s.body,
          schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
        }],
      });
    } else {
      // Specific weekdays → one weekly-repeating alarm each (Capacitor weekday: 1=Sun).
      await LocalNotifications.schedule({
        notifications: dayList.map((d) => ({
          id: REMINDER_ID + 1 + d, title: s.title, body: s.body,
          schedule: { on: { weekday: d + 1, hour, minute }, repeats: true, allowWhileIdle: true },
        })),
      });
    }
  } catch { /* plugin missing or denied — fall back to web/in-app */ }
}

const NOTIFIED_KEY = 'mm_reminder_notified';
const todayStr = () => new Date().toISOString().slice(0, 10);

/** Has the web notification already fired today? (once-per-day guard) */
export function wasNotifiedToday() {
  try { return localStorage.getItem(NOTIFIED_KEY) === todayStr(); } catch { return false; }
}
function markNotifiedToday() {
  try { localStorage.setItem(NOTIFIED_KEY, todayStr()); } catch { /* ignore */ }
}

/** Fire a one-off system notification now (web, app alive). Returns true if shown. */
export function fireWebNotification(lang = 'en') {
  if (isNative() || !webNotifSupported() || Notification.permission !== 'granted') return false;
  if (wasNotifiedToday()) return false;
  const s = REMINDER_STRINGS[lang] || REMINDER_STRINGS.en;
  try {
    new Notification(s.title, { body: s.body, icon: ICON, badge: ICON, tag: 'mm-workout-reminder', renotify: false });
    markNotifiedToday();
    return true;
  } catch { return false; }
}

/** Parse "HH:MM" → minutes since midnight. */
export function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes-since-midnight for `date` (default now). */
export function nowMinutes(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes();
}

/** Pretty 12h label for a "HH:MM" string, respecting locale digits loosely. */
export function formatTimeLabel(t, isAr) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? (isAr ? 'ص' : 'AM') : (isAr ? 'م' : 'PM');
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
