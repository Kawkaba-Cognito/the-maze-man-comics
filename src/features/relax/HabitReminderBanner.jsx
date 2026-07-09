import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  loadHabits, getPendingReminders, dismissHabitReminder, habitTitle,
} from './habitState';
import { fireHabitWebNotification } from './habitReminders';

const OPEN_DAILY_KEY = 'rx_open_daily';

export default function HabitReminderBanner() {
  const { currentLang, activeTab, switchTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const [pending, setPending] = useState([]);

  const check = useCallback(() => {
    const st = loadHabits();
    const list = getPendingReminders(st);
    setPending(list);
    list.forEach((h) => fireHabitWebNotification(h, isAr ? 'ar' : 'en'));
  }, [isAr]);

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); };
  }, [check]);

  if (!pending.length || activeTab === 'relax' || activeTab === 'habits' || activeTab === 'wellbeing') return null;

  const first = pending[0];
  const more = pending.length - 1;

  return (
    <div className="hb-reminder-banner" dir={isAr ? 'rtl' : 'ltr'} role="alert">
      <span className="hb-reminder-ic" aria-hidden="true">{first.icon || '📋'}</span>
      <div className="hb-reminder-body">
        <div className="hb-reminder-title">
          {isAr ? `حان وقت: ${habitTitle(first, true)}` : `Time for: ${habitTitle(first, false)}`}
        </div>
        <div className="hb-reminder-sub">
          {more > 0
            ? (isAr ? `+${more} عادات أخرى` : `+${more} more habit${more > 1 ? 's' : ''}`)
            : (isAr ? 'خطوتك الصغيرة بانتظارك.' : 'Your tiny step is waiting.')}
        </div>
      </div>
      <button
        className="hb-reminder-start"
        onClick={() => {
          playSfx?.('click');
          try { sessionStorage.setItem(OPEN_DAILY_KEY, '1'); } catch { /* ignore */ }
          switchTab('habits');
        }}
      >
        {isAr ? 'اليوم' : 'Today'}
      </button>
      <button
        className="hb-reminder-x"
        aria-label={isAr ? 'إغلاق' : 'Dismiss'}
        onClick={() => {
          playSfx?.('click');
          pending.forEach((h) => dismissHabitReminder(h.id));
          setPending([]);
        }}
      >
        ✕
      </button>
    </div>
  );
}

export { OPEN_DAILY_KEY };
