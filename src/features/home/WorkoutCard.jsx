import React, { useMemo } from 'react';
import { loadWorkout, isDoneToday } from '../workout/workoutState.js';
import { assetUrl } from '../../lib/assetUrl.js';

/*
 * A direct, always-available way onto the Daily Workout tab from Home.
 * Features Captain Nayzak (the Father Coach) as the personal workout guide.
 */

const UI = {
  en: {
    notSetUp: { title: 'Daily Workout with Captain Nayzak', sub: 'Calibrated daily routine', cta: 'Set up' },
    ready: (n) => ({ title: 'Today’s Workout is Ready', sub: `${n} focused exercise${n === 1 ? '' : 's'}`, cta: 'Start' }),
    done: (streak) => ({
      title: 'Workout Complete!',
      sub: streak > 1 ? `${streak}-day workout streak with Captain Nayzak` : 'Splendid work today!',
      cta: 'Review',
    }),
  },
  ar: {
    notSetUp: { title: 'التمرين اليومي مع الكابتن نيزك', sub: 'جلسة تدريبية مُعدّة لمستواك', cta: 'إعداد' },
    ready: (n) => ({ title: 'تمرين اليوم جاهز للانطلاق', sub: `${n} تمارينات إدراكية`, cta: 'ابدأ' }),
    done: (streak) => ({
      title: 'اكتمل التمرين بنجاح!',
      sub: streak > 1 ? `سلسلة تمارين ${streak} يوم مع الكابتن نيزك` : 'أداء رائع ومتميّز!',
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
      {state.kind === 'done' ? (
        <span className="wc-glyph" aria-hidden="true">✅</span>
      ) : (
        <div style={{ position: 'relative', flexShrink: 0, width: 44, height: 44 }}>
          <img
            src={assetUrl('Assets/brand/characters/father-coach-avatar.jpg')}
            alt={isAr ? 'الكابتن نيزك' : 'Captain Nayzak'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 0 12px rgba(245, 166, 35, 0.45)',
              border: '1.5px solid #f5a623',
              display: 'block',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
            aria-hidden="true"
          >
            ⚡
          </span>
        </div>
      )}
      <span className="wc-text">
        <span className="wc-title">{state.copy.title}</span>
        <span className="wc-sub">{state.copy.sub}</span>
      </span>
      <span className="wc-cta">{state.copy.cta}</span>
    </button>
  );
}
