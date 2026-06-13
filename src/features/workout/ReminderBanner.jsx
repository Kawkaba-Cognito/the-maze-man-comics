import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { loadWorkout, reminderDue, dismissReminder } from './workoutState';
import { fireWebNotification } from './reminders';

/*
 * Global in-app daily reminder. When the chosen time has passed and today's
 * workout isn't done, it slides in a nudge (and fires a system notification
 * once/day if permission is granted and the tab is alive). Re-checks on mount,
 * on tab focus, and every 30s. Hidden while already on the Workout tab.
 */
export default function ReminderBanner() {
  const { currentLang, activeTab, switchTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const [due, setDue] = useState(false);

  const check = useCallback(() => {
    const isDue = reminderDue(loadWorkout());
    setDue(isDue);
    if (isDue) fireWebNotification(isAr ? 'ar' : 'en');
  }, [isAr]);

  useEffect(() => {
    check();
    const id = setInterval(check, 30000);
    const onVis = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); };
  }, [check]);

  if (!due || activeTab === 'workout') return null;

  return (
    <div className="wk-reminder-banner" dir={isAr ? 'rtl' : 'ltr'} role="alert">
      <span className="wk-reminder-ic" aria-hidden="true">🧠</span>
      <div className="wk-reminder-body">
        <div className="wk-reminder-title">{isAr ? 'حان وقت تمرينك اليومي' : 'Time for your daily workout'}</div>
        <div className="wk-reminder-sub">{isAr ? 'بضع دقائق تحافظ على سلسلتك.' : 'A few minutes keeps your streak alive.'}</div>
      </div>
      <button className="wk-reminder-start" onClick={() => { playSfx('click'); setDue(false); switchTab('workout'); }}>
        {isAr ? 'ابدأ' : 'Start'}
      </button>
      <button className="wk-reminder-x" aria-label={isAr ? 'إغلاق' : 'Dismiss'} onClick={() => { playSfx('click'); dismissReminder(); setDue(false); }}>✕</button>
    </div>
  );
}
