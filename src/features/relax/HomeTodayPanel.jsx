import React, { useState, useCallback } from 'react';
import {
  loadHabits, getTodayProgress, getHabitStatus, isHabitDone,
  toggleManual, habitTitle, domainById,
} from './habitState';
import { OPEN_DAILY_KEY } from './HabitReminderBanner';

export default function HomeTodayPanel({ isAr, playSfx, switchTab, labelFont }) {
  const [st, setSt] = useState(() => loadHabits());
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => setSt(loadHabits()), []);
  const progress = getTodayProgress(st);

  if (progress.total === 0) return null;

  const openDaily = () => {
    playSfx('click');
    try { sessionStorage.setItem(OPEN_DAILY_KEY, '1'); } catch { /* ignore */ }
    switchTab('relax');
  };

  const onToggle = (habit) => {
    if (habit.type === 'auto') return;
    playSfx('click');
    setSt(toggleManual(habit.id));
  };

  const t = {
    today: isAr ? 'اليوم' : 'Today',
    seeAll: isAr ? 'عرض الكل' : 'See all',
  };

  return (
    <div className={`home-today-panel${open ? ' open' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
      <button
        type="button"
        className="home-today-head"
        style={labelFont}
        onClick={() => { playSfx('click'); setOpen((v) => !v); refresh(); }}
        aria-label={isAr ? `عادات اليوم ${progress.done}/${progress.total}` : `Today habits ${progress.done}/${progress.total}`}
      >
        <span className="home-today-summary">
          <span className="home-today-lbl">📋 {t.today}</span>
          <span className="home-today-count">
            {progress.allDone ? '✓' : `${progress.done}/${progress.total}`}
          </span>
        </span>
        <span className="home-today-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="home-today-body">
          {progress.habits.map((habit) => {
            const done = isHabitDone(habit, st);
            const isAuto = habit.type === 'auto';
            const isSkip = getHabitStatus(habit, st) === 'skip';
            const dom = domainById(habit.domain);
            return (
              <div key={habit.id} className={`home-today-row${done ? ' done' : ''}`}>
                <button
                  type="button"
                  className={`home-today-check${done ? ' on' : ''}`}
                  style={{ borderColor: dom.color, background: done ? dom.color : 'transparent' }}
                  disabled={isAuto || isSkip}
                  onClick={() => onToggle(habit)}
                >
                  {done ? '✓' : ''}
                </button>
                <span className="home-today-label">{habit.icon} {habitTitle(habit, isAr)}</span>
              </div>
            );
          })}
          <button type="button" className="home-today-all" style={labelFont} onClick={openDaily}>
            {t.seeAll} →
          </button>
        </div>
      )}
    </div>
  );
}
