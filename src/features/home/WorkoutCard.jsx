import React, { useMemo } from 'react';
import { loadWorkout, isDoneToday } from '../workout/workoutState.js';

/*
 * A direct, always-available way onto the Daily Workout tab from Home.
 *
 * Before this, the ONLY entry point was ReminderBanner — which only appears
 * once a scheduled reminder time has passed and today isn't done yet
 * (workoutState.reminderDue). A user who opens the app earlier than their
 * reminder, or never set one, had no way to start the workout from Home at
 * all. This is the single highest-value addition to the dashboard: the
 * flagship one-press session gets a button that is just... there.
 */

const UI = {
  en: {
    notSetUp: { title: 'Daily workout', sub: 'A few minutes, tuned to you', cta: 'Set up' },
    ready: (n) => ({ title: 'Today’s workout is ready', sub: `${n} exercise${n === 1 ? '' : 's'}`, cta: 'Start' }),
    done: (streak) => ({
      title: 'Workout complete',
      sub: streak > 1 ? `${streak}-day workout streak` : 'Nice work',
      cta: 'Review',
    }),
  },
  ar: {
    notSetUp: { title: 'التمرين اليومي', sub: 'دقائق قليلة، مُعدّة لك', cta: 'إعداد' },
    ready: (n) => ({ title: 'تمرين اليوم جاهز', sub: `${n} تمرين${n === 1 ? '' : 'ات'}`, cta: 'ابدأ' }),
    done: (streak) => ({
      title: 'اكتمل التمرين',
      sub: streak > 1 ? `سلسلة تمارين ${streak} يوم` : 'أحسنت',
      cta: 'مراجعة',
    }),
  },
};

export default function WorkoutCard({ isAr, playSfx, onOpenWorkout }) {
  const t = isAr ? UI.ar : UI.en;

  const state = useMemo(() => {
    const st = loadWorkout();
    if (!st.prefs) return { kind: 'setup', copy: t.notSetUp };
    if (isDoneToday(st)) return { kind: 'done', copy: t.done(st.streak || 0) };
    const n = st.today?.exercises?.length || 0;
    return { kind: 'ready', copy: t.ready(n) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  return (
    <button
      type="button"
      className={`wc wc--${state.kind}`}
      onClick={() => { playSfx?.('click'); onOpenWorkout?.(); }}
    >
      <span className="wc-glyph" aria-hidden="true">{state.kind === 'done' ? '✅' : '🧠'}</span>
      <span className="wc-text">
        <span className="wc-title">{state.copy.title}</span>
        <span className="wc-sub">{state.copy.sub}</span>
      </span>
      <span className="wc-cta">{state.copy.cta}</span>
    </button>
  );
}
