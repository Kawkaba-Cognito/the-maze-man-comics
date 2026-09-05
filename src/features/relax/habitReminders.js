/**
 * Habit reminders — native OS alarms + web notification + in-app banner.
 * Mirrors the workout reminder layer in reminders.js.
 */
import { Capacitor } from '@capacitor/core';
import { loadHabits, getTodayProgress, getMorningDigestText, habitTitle, todayKey } from './habitState';

export const HABIT_NOTIF_BASE = 5100;
export const HABIT_MORNING_ID = 5099;
/*
 * ⚠ THIS WAS A FOX (2026-09-05). `Assets/guide-fox-sprite.webp` is the retired
 * Maze Man guide, a different animal from the app's mascot — so a wellbeing
 * reminder arrived on the lock screen wearing a character that appears nowhere
 * in the product any more. It is the same class of mistake as the quizzes
 * drawing the old sprite: art that nothing checks, on a surface nobody revisits.
 *
 * A notification icon is the one place the mascot appears OUTSIDE the app, so it
 * is the last place it should disagree with what is inside it.
 */
const ICON = `${import.meta.env.BASE_URL}Assets/characters/kawkab/kawkab-planet.webp`;
const NOTIFIED_KEY = 'rx_habit_notified';

export const HABIT_REMINDER_STRINGS = {
  en: (name) => ({ title: `Habit reminder · ${name}`, body: 'Your tiny step is waiting. Tap to check in.' }),
  ar: (name) => ({ title: `تذكير عادة · ${name}`, body: 'خطوتك الصغيرة بانتظارك. اضغط للتسجيل.' }),
};

const isNative = () => {
  try { return Capacitor?.isNativePlatform?.() === true; } catch { return false; }
};

function habitNotifId(st, habitId) {
  const i = st.habits.findIndex((h) => h.id === habitId);
  return HABIT_NOTIF_BASE + Math.max(0, i);
}

export async function syncNativeHabitReminders(st = loadHabits(), lang = 'en') {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const ids = st.habits.map((_, i) => HABIT_NOTIF_BASE + i);
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
    if (!st.settings?.remindersEnabled) return;
    const notifications = [];
    for (const h of st.habits) {
      if (!h.active || !h.reminderTime) continue;
      const [hour, minute] = h.reminderTime.split(':').map(Number);
      const s = (HABIT_REMINDER_STRINGS[lang] || HABIT_REMINDER_STRINGS.en)(habitTitle(h, lang === 'ar'));
      const days = h.frequency === 'weekdays' ? [1, 2, 3, 4, 5] : (h.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
      const nid = habitNotifId(st, h.id);
      if (h.frequency === 'daily' || days.length >= 7) {
        notifications.push({
          id: nid, title: s.title, body: s.body,
          schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
        });
      } else {
        for (const d of days) {
          notifications.push({
            id: nid + d, title: s.title, body: s.body,
            schedule: { on: { weekday: d + 1, hour, minute }, repeats: true, allowWhileIdle: true },
          });
        }
      }
    }
    if (notifications.length) await LocalNotifications.schedule({ notifications });
  } catch { /* fall back to in-app */ }
}

export async function syncMorningDigest(st = loadHabits(), lang = 'en') {
  if (!isNative()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: HABIT_MORNING_ID }] });
    if (st.settings?.morningDigestEnabled === false) return;
    const progress = getTodayProgress(st);
    if (!progress.total) return;
    const time = st.settings?.morningDigestTime || '08:00';
    const [hour, minute] = time.split(':').map(Number);
    const s = getMorningDigestText(st, lang);
    await LocalNotifications.schedule({
      notifications: [{
        id: HABIT_MORNING_ID,
        title: s.title,
        body: s.body,
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
      }],
    });
  } catch { /* ignore */ }
}

function notifiedKey(habitId) {
  return `${NOTIFIED_KEY}_${habitId}_${todayKey()}`;
}

export function wasHabitNotifiedToday(habitId) {
  try { return localStorage.getItem(notifiedKey(habitId)) === '1'; } catch { return false; }
}

function markHabitNotifiedToday(habitId) {
  try { localStorage.setItem(notifiedKey(habitId), '1'); } catch { /* ignore */ }
}

export function fireHabitWebNotification(habit, lang = 'en') {
  if (isNative() || typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  if (wasHabitNotifiedToday(habit.id)) return false;
  const isAr = lang === 'ar';
  const s = (HABIT_REMINDER_STRINGS[lang] || HABIT_REMINDER_STRINGS.en)(habitTitle(habit, isAr));
  try {
    new Notification(s.title, { body: s.body, icon: ICON, tag: `habit-${habit.id}`, renotify: false });
    markHabitNotifiedToday(habit.id);
    return true;
  } catch { return false; }
}

/** Reschedule native alarms after habit/reminder changes. */
export function syncHabitReminders(st = loadHabits(), lang = 'en') {
  syncNativeHabitReminders(st, lang);
  syncMorningDigest(st, lang);
}
