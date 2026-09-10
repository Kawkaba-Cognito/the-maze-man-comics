import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { trainingSnapshot } from '../personalization/trainingRecommendations.js';
import { DOMAINS_BY_ID } from '../training/registry.js';
import { loadPracticeLog } from '../relax/practiceLog.js';
import { RELAX_PRACTICES } from '../relax/practices.js';
import { getTodayProgress } from '../relax/habitState.js';
import './progressCard.css';

/*
 * A real-history counterpart to NeuralPanel's suggestions, on Home.
 *
 * NeuralPanel says "here's what to try next", built from a model that is
 * opt-in and gated until it has 3-4 examples to learn from — so for most
 * visits, most users, it says nothing useful yet. This card says "here's
 * what you actually did", built entirely from records every user already
 * has the moment they've played one game or logged one habit: no opt-in,
 * no cold start, no model. `profileData.streak` and `points` (both real,
 * persisted counters — NOT `globalXP`, which resets to 0 on every reload
 * and would silently lie to a returning user) plus whichever domain/practice
 * was last touched and today's habit count.
 *
 * Deliberately returns null rather than an empty shell for a genuinely new
 * user — same honesty as the "Your sky is empty" heading below it, which
 * only renders once there is a count to show.
 *
 * "Continue" buttons land on the TAB, not the specific game/practice —
 * matching HomeScreen's own onOpenDomain/onOpenPractice, which already do
 * this and say why: training and wellbeing have no pending-target seam, and
 * building two just for this card would be a bigger change than the card.
 */

const UI = {
  en: {
    title: 'Your progress',
    streak: (n) => `${n}-day streak`,
    points: (n) => `${n} points`,
    habitsToday: (done, total) => `${done}/${total} habits today`,
    continueLabel: 'Continue',
  },
  ar: {
    title: 'تقدّمك',
    streak: (n) => `سلسلة ${n} يوم`,
    points: (n) => `${n} نقطة`,
    habitsToday: (done, total) => `${done}/${total} عادات اليوم`,
    continueLabel: 'أكمل',
  },
};

const domainLabel = (id, isAr) => {
  const d = DOMAINS_BY_ID[id];
  return (isAr ? d?.nameAr : d?.name) || id;
};

function lastPlayedDomain() {
  const snap = trainingSnapshot().filter((s) => s.lastPlayed);
  if (!snap.length) return null;
  // 'YYYY-MM-DD' strings sort correctly lexicographically.
  snap.sort((a, b) => (a.lastPlayed < b.lastPlayed ? 1 : -1));
  return snap[0];
}

function lastPractice() {
  const sessions = loadPracticeLog().sessions;
  const last = sessions[sessions.length - 1];
  if (!last) return null;
  const practice = RELAX_PRACTICES.find((p) => p.id === last.p);
  return practice || null;
}

export default function ProgressCard({ isAr, playSfx, onOpenDomain, onOpenPractice, onOpenHabits }) {
  const { profileData, points } = useApp();
  const t = isAr ? UI.ar : UI.en;

  // Cheap enough to read on every render — each is one localStorage parse of
  // a small object, not a loop over history the way getInsightsSummary() is.
  const domain = useMemo(lastPlayedDomain, []);
  const practice = useMemo(lastPractice, []);
  const habitProgress = useMemo(() => getTodayProgress(), []);

  const streak = profileData?.streak || 0;
  const hasHabits = habitProgress.total > 0;
  const hasAnything = streak > 0 || points > 0 || hasHabits || domain || practice;
  if (!hasAnything) return null;

  return (
    <section className="pc" aria-label={t.title}>
      <div className="pc-stats">
        {streak > 0 && (
          <span className="pc-stat">
            <span className="pc-stat-glyph" aria-hidden="true">🔥</span>
            {t.streak(streak)}
          </span>
        )}
        {points > 0 && (
          <span className="pc-stat">
            <span className="pc-stat-glyph" aria-hidden="true">⚡</span>
            {t.points(points)}
          </span>
        )}
        {hasHabits && (
          <button type="button" className="pc-stat pc-stat--tap" onClick={() => { playSfx?.('click'); onOpenHabits?.(); }}>
            <span className="pc-stat-glyph" aria-hidden="true">✅</span>
            {t.habitsToday(habitProgress.done, habitProgress.total)}
          </button>
        )}
      </div>

      {(domain || practice) && (
        <div className="pc-continue-row">
          {domain && (
            <button
              type="button"
              className="pc-continue"
              onClick={() => { playSfx?.('click'); onOpenDomain?.(domain.domainId); }}
            >
              <span className="pc-continue-label">{t.continueLabel}</span>
              <span className="pc-continue-name">{domainLabel(domain.domainId, isAr)}</span>
            </button>
          )}
          {practice && (
            <button
              type="button"
              className="pc-continue"
              onClick={() => { playSfx?.('click'); onOpenPractice?.(practice.id); }}
            >
              <span className="pc-continue-label">{t.continueLabel}</span>
              <span className="pc-continue-name">{isAr ? practice.titleAr : practice.title}</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
