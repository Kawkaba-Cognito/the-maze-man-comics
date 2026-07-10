import React, { useCallback, useMemo, useState } from 'react';
import {
  LIFE_DOMAINS, HABIT_PRESETS, SKIP_REASONS, GRACE_PER_MONTH,
  loadHabits, getTodayProgress, computeStreak, computeConsistency,
  getHeatmap, getNeverMissTwice, getHabitStatus, isHabitDone,
  toggleManual, markSkip, addHabit, toggleHabitActive,
  addPresetHabit, graceRemaining, habitTitle, habitRecipe,
  domainById, isReflectionDue, identityLabel,
  getAutomaticity, getStackChains, setHabitReminder, setHabitStack,
  setRemindersEnabled, exportHabitsData, importHabitsData, getActiveHabits,
  setMorningDigestEnabled, setMorningDigestTime,
} from './habitState';
import { syncHabitReminders } from './habitReminders';
import HabitLifeTab, { LIFE_TAB_CSS } from './HabitLifeTab';
import HabitReflectTab, { REFLECT_TAB_CSS } from './HabitReflectTab';
import HabitTemplatesTab, { TEMPLATES_TAB_CSS } from './HabitTemplatesTab';
import HabitInsightsTab, { INSIGHTS_TAB_CSS } from './HabitInsightsTab';

const INK = '#2d2210';
const SUB = '#8a7f6f';
const FAINT = '#b3a288';
const LINE = '#e3d6c4';
const CARD = '#fffdf8';
const GOLD = '#b9842f';
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Outfit', system-ui, sans-serif";

const HEAT = ['#efe6d6', '#c8e6c9', '#9fd4a3', '#6fae7a', '#3a7a48'];

function ProgressRing({ done, total, allDone }) {
  const R = 46;
  const SW = 10;
  const C = 2 * Math.PI * R;
  const frac = total ? done / total : 0;
  const off = C * (1 - Math.max(0, Math.min(1, frac)));
  return (
    <div className="hb-ring">
      <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#efe6d6" strokeWidth={SW} />
        <circle
          cx="60" cy="60" r={R} fill="none"
          stroke={allDone ? '#6fae7a' : 'url(#hbGrad)'} strokeWidth={SW} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off}
          transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset .45s ease' }}
        />
        <defs>
          <linearGradient id="hbGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd574" />
            <stop offset="100%" stopColor="#6fae7a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="hb-ring-center">
        {allDone ? <span className="hb-ring-check">✓</span> : <b>{done}<span>/{total}</span></b>}
      </div>
    </div>
  );
}

function Heatmap({ cells, isAr }) {
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return (
    <div className="hb-heat">
      <div className="hb-heat-grid">
        {weeks.map((wk, wi) => (
          <div key={wi} className="hb-heat-col">
            {wk.map((c) => (
              <div
                key={c.date}
                className="hb-heat-cell"
                style={c.total ? { background: HEAT[c.level] } : undefined}
                title={`${c.date}: ${c.done}/${c.total}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="hb-heat-legend">
        <span>{isAr ? 'أقل' : 'Less'}</span>
        {HEAT.map((c, i) => <span key={i} className="hb-heat-dot" style={{ background: c }} />)}
        <span>{isAr ? 'أكثر' : 'More'}</span>
      </div>
    </div>
  );
}

function SkipModal({ isAr, habit, graceLeft, onClose, onSkip }) {
  const [reason, setReason] = useState('busy');
  const [useGrace, setUseGrace] = useState(false);
  const t = {
    title: isAr ? 'تخطّي اليوم' : 'Skip today',
    sub: isAr ? 'كن صادقاً — التخطّي ليس فشلاً.' : 'Be honest — skipping isn\'t failure.',
    grace: isAr ? `استخدم يوم مرونة (${graceLeft}/${GRACE_PER_MONTH} متبقّي)` : `Use grace day (${graceLeft}/${GRACE_PER_MONTH} left)`,
    cancel: isAr ? 'إلغاء' : 'Cancel',
    confirm: isAr ? 'تخطّي' : 'Skip',
  };
  return (
    <div className="hb-modal-bg" onClick={onClose}>
      <div className="hb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hb-modal-title">{t.title}</div>
        <div className="hb-modal-sub">{habitTitle(habit, isAr)}</div>
        <p className="hb-modal-hint">{t.sub}</p>
        <div className="hb-reasons">
          {SKIP_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`hb-reason${reason === r.id ? ' on' : ''}`}
              onClick={() => setReason(r.id)}
            >
              {isAr ? r.ar : r.en}
            </button>
          ))}
        </div>
        {graceLeft > 0 && (
          <label className="hb-grace-check">
            <input type="checkbox" checked={useGrace} onChange={(e) => setUseGrace(e.target.checked)} />
            {t.grace}
          </label>
        )}
        <div className="hb-modal-actions">
          <button type="button" className="hb-btn-ghost" onClick={onClose}>{t.cancel}</button>
          <button type="button" className="hb-btn-primary" onClick={() => onSkip(reason, useGrace)}>{t.confirm}</button>
        </div>
      </div>
    </div>
  );
}

function AddHabitForm({ isAr, onClose, onSave, playSfx }) {
  const [domain, setDomain] = useState('mind');
  const [titleEn, setTitleEn] = useState('');
  const [anchorEn, setAnchorEn] = useState('');
  const [tinyEn, setTinyEn] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const t = {
    title: isAr ? 'عادة جديدة' : 'New habit',
    sub: isAr ? 'ابدأ صغيراً — ربط + خطوة صغيرة.' : 'Start tiny — anchor + smallest step.',
    name: isAr ? 'الاسم' : 'Name',
    anchor: isAr ? 'بعد أن… (الربط)' : 'After I… (anchor)',
    tiny: isAr ? 'سأ… (الخطوة الصغيرة)' : 'I will… (tiny step)',
    freq: isAr ? 'التكرار' : 'Frequency',
    daily: isAr ? 'يومي' : 'Daily',
    weekdays: isAr ? 'أيام الأسبوع' : 'Weekdays',
    save: isAr ? 'حفظ' : 'Save',
    cancel: isAr ? 'إلغاء' : 'Cancel',
    placeholderAnchor: isAr ? 'مثال: بعد أن أنهي الغداء' : 'e.g. After I finish lunch',
    placeholderTiny: isAr ? 'مثال: أشرب كوب ماء' : 'e.g. Drink one glass of water',
  };
  const canSave = titleEn.trim() && tinyEn.trim();
  return (
    <div className="hb-modal-bg" onClick={onClose}>
      <div className="hb-modal hb-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="hb-modal-title">{t.title}</div>
        <p className="hb-modal-hint">{t.sub}</p>
        <div className="hb-domains">
          {LIFE_DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`hb-domain${domain === d.id ? ' on' : ''}`}
              style={{ borderColor: domain === d.id ? d.color : LINE }}
              onClick={() => { playSfx?.('click'); setDomain(d.id); }}
            >
              {d.icon}
            </button>
          ))}
        </div>
        <label className="hb-field">
          <span>{t.name}</span>
          <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder={isAr ? 'عادة جديدة' : 'New habit'} />
        </label>
        <label className="hb-field">
          <span>{t.anchor}</span>
          <input value={anchorEn} onChange={(e) => setAnchorEn(e.target.value)} placeholder={t.placeholderAnchor} />
        </label>
        <label className="hb-field">
          <span>{t.tiny}</span>
          <input value={tinyEn} onChange={(e) => setTinyEn(e.target.value)} placeholder={t.placeholderTiny} />
        </label>
        <div className="hb-freq-row">
          <span>{t.freq}</span>
          <div className="hb-freq-btns">
            {['daily', 'weekdays'].map((f) => (
              <button
                key={f}
                type="button"
                className={`hb-freq${frequency === f ? ' on' : ''}`}
                onClick={() => setFrequency(f)}
              >
                {f === 'daily' ? t.daily : t.weekdays}
              </button>
            ))}
          </div>
        </div>
        <div className="hb-modal-actions">
          <button type="button" className="hb-btn-ghost" onClick={onClose}>{t.cancel}</button>
          <button
            type="button"
            className="hb-btn-primary"
            disabled={!canSave}
            onClick={() => onSave({ domain, titleEn, titleAr: titleEn, anchorEn, anchorAr: anchorEn, tinyEn, tinyAr: tinyEn, frequency })}
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyHabits({ isAr, playSfx, onBack, onOpenPractice }) {
  const [st, setSt] = useState(() => loadHabits());
  const [tab, setTab] = useState('today');
  const [panel, setPanel] = useState(null);
  const [skipTarget, setSkipTarget] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const refresh = useCallback(() => setSt(loadHabits()), []);
  const progress = useMemo(() => getTodayProgress(st), [st]);
  const streak = useMemo(() => computeStreak(st), [st]);
  const consistency = useMemo(() => computeConsistency(st), [st]);
  const heatmap = useMemo(() => getHeatmap(st), [st]);
  const nudge = useMemo(() => getNeverMissTwice(st), [st]);
  const graceLeft = useMemo(() => graceRemaining(st), [st]);
  const reflectDue = useMemo(() => isReflectionDue(st), [st]);
  const becoming = useMemo(() => identityLabel(st, isAr), [st, isAr]);

  const stacks = useMemo(() => getStackChains(st), [st]);
  const activeHabits = useMemo(() => getActiveHabits(st), [st]);
  const inactivePresets = useMemo(() => {
    const activeIds = new Set(st.habits.filter((h) => h.active).map((h) => h.presetId || h.id));
    return HABIT_PRESETS.filter((p) => !activeIds.has(p.id));
  }, [st]);

  const t = useMemo(() => ({
    title: isAr ? 'يومي' : 'Daily',
    tag: isAr ? 'عادات للحياة — خطوة صغيرة في كل مرة.' : 'Life habits — one tiny step at a time.',
    today: isAr ? 'اليوم' : 'Today',
    streak: isAr ? 'سلسلة' : 'Streak',
    days: isAr ? 'أيام' : 'days',
    consistency: isAr ? 'الثبات (30 يوم)' : 'Consistency (30d)',
    done: isAr ? 'تم!' : 'Done!',
    go: isAr ? 'ابدأ' : 'Go',
    auto: isAr ? 'تلقائي' : 'Auto',
    skip: isAr ? 'تخطّي' : 'Skip',
    manage: isAr ? 'إدارة العادات' : 'Manage habits',
    add: isAr ? '+ عادة جديدة' : '+ New habit',
    heatmap: isAr ? '12 أسبوعاً' : '12 weeks',
    nudge: isAr ? 'لا تفوّت مرتين — أكمل هذه العادة اليوم.' : 'Don\'t miss twice — finish this habit today.',
    note: isAr ? 'تأمل شخصي — ليس تشخيصاً.' : 'Personal reflection — not medical advice.',
    skipped: isAr ? 'متخطّى' : 'Skipped',
    presets: isAr ? 'إضافة من القوالب' : 'Add from templates',
    active: isAr ? 'نشطة' : 'Active',
    inactive: isAr ? 'غير نشطة' : 'Inactive',
    tabToday: isAr ? 'اليوم' : 'Today',
    tabLife: isAr ? 'الحياة' : 'Life',
    tabReflect: isAr ? 'تأمّل' : 'Reflect',
    tabLibrary: isAr ? 'مكتبة' : 'Library',
    tabInsights: isAr ? 'رؤى' : 'Insights',
    becoming: isAr ? 'أصبح' : 'Becoming',
    stacks: isAr ? 'سلسلة العادات' : 'Habit stacks',
    forming: isAr ? 'قيد التكوّن' : 'Forming',
    stable: isAr ? 'مستقرّة' : 'Stable',
    week: isAr ? 'أسبوع' : 'Week',
    reminder: isAr ? 'تذكير' : 'Reminder',
    stackAfter: isAr ? 'بعد عادة' : 'Stack after',
    none: isAr ? '— لا شيء —' : '— None —',
    export: isAr ? 'نسخ احتياطي' : 'Backup',
    importBtn: isAr ? 'استيراد' : 'Import',
    remindersOn: isAr ? 'التذكيرات مفعّلة' : 'Reminders on',
    morningOn: isAr ? 'ملخص الصباح' : 'Morning digest',
    morningAt: isAr ? 'وقت الملخص' : 'Digest time',
  }), [isAr]);

  const onToggle = (habit) => {
    if (habit.type === 'auto') return;
    playSfx?.('click');
    setSt(toggleManual(habit.id));
  };

  const onSkipConfirm = (reason, useGrace) => {
    if (!skipTarget) return;
    playSfx?.('click');
    setSt(markSkip(skipTarget.id, reason, useGrace));
    setSkipTarget(null);
  };

  const onAddSave = (fields) => {
    playSfx?.('collect');
    const next = addHabit(fields);
    setSt(next);
    syncHabitReminders(next, isAr ? 'ar' : 'en');
    setPanel(null);
  };

  const onReminderChange = (habitId, time) => {
    const next = setHabitReminder(habitId, time || null);
    setSt(next);
    syncHabitReminders(next, isAr ? 'ar' : 'en');
  };

  const onStackChange = (habitId, afterId) => {
    playSfx?.('click');
    setSt(setHabitStack(habitId, afterId || null));
  };

  const onExport = () => {
    playSfx?.('click');
    const data = exportHabitsData(st);
    try {
      navigator.clipboard.writeText(data);
    } catch {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      a.download = `maze-man-habits-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    }
  };

  const onImport = () => {
    const raw = window.prompt(isAr ? 'الصق JSON النسخ الاحتياطي:' : 'Paste backup JSON:');
    if (!raw) return;
    try {
      playSfx?.('collect');
      const next = importHabitsData(raw);
      setSt(next);
      syncHabitReminders(next, isAr ? 'ar' : 'en');
    } catch {
      window.alert(isAr ? 'ملف غير صالح.' : 'Invalid backup file.');
    }
  };

  return (
    <div className="rx-root" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      <div className="rx-app">
        <div className="header">
          {onBack && <button className="rx-back" onClick={onBack} aria-label="Back">‹</button>}
          <div style={{ paddingInlineStart: onBack ? 42 : 0 }}>
            <div className="header-sub" style={{ color: '#6fae7a' }}>{isAr ? 'عادات' : 'Habits'}</div>
            <div className="header-title serif">{t.title}</div>
            <div className="menu-tag">{becoming ? `${t.becoming}: ${becoming}` : t.tag}</div>
          </div>
        </div>

        <div className="hb-tabs">
          {[
            { id: 'today', label: t.tabToday },
            { id: 'life', label: t.tabLife },
            { id: 'reflect', label: t.tabReflect, dot: reflectDue },
            { id: 'library', label: t.tabLibrary },
            { id: 'insights', label: t.tabInsights },
          ].map((tb) => (
            <button
              key={tb.id}
              type="button"
              className={`hb-tab${tab === tb.id ? ' on' : ''}`}
              onClick={() => { playSfx?.('click'); setTab(tb.id); }}
            >
              {tb.label}
              {tb.dot && <span className="hb-tab-dot" />}
            </button>
          ))}
        </div>

        <div className="content">
          {tab === 'life' && (
            <HabitLifeTab isAr={isAr} st={st} setSt={setSt} playSfx={playSfx} />
          )}

          {tab === 'reflect' && (
            <HabitReflectTab isAr={isAr} st={st} setSt={setSt} playSfx={playSfx} />
          )}

          {tab === 'library' && (
            <HabitTemplatesTab isAr={isAr} st={st} setSt={setSt} playSfx={playSfx} />
          )}

          {tab === 'insights' && (
            <HabitInsightsTab isAr={isAr} st={st} />
          )}

          {tab === 'today' && (
          <>
          {stacks.length > 0 && (
            <div className="hb-stacks">
              <div className="hb-section-title">{t.stacks}</div>
              {stacks.map((chain, ci) => (
                <div key={ci} className="hb-stack-chain">
                  {chain.map((h, hi) => (
                    <React.Fragment key={h.id}>
                      {hi > 0 && <span className="hb-stack-arrow">→</span>}
                      <span className="hb-stack-item">{h.icon} {habitTitle(h, isAr)}</span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          )}
          {nudge.length > 0 && (
            <div className="hb-nudge">
              <div className="hb-nudge-title">⚠️ {t.nudge}</div>
              {nudge.map((h) => (
                <div key={h.id} className="hb-nudge-item">
                  {h.icon} {habitTitle(h, isAr)}
                </div>
              ))}
            </div>
          )}

          <div className="hb-hero">
            <ProgressRing done={progress.done} total={progress.total} allDone={progress.allDone} />
            <div className="hb-hero-meta">
              <div className="hb-hero-label">{t.today}</div>
              <div className="hb-hero-stat">
                🔥 {streak} {t.days}
                <span className="hb-hero-sub">{t.streak}</span>
              </div>
              <div className="hb-hero-consistency">
                {t.consistency}: <b>{consistency.pct}%</b>
              </div>
              {progress.allDone && <div className="hb-hero-done">{t.done}</div>}
            </div>
          </div>

          <div className="hb-list">
            {progress.habits.length === 0 && (
              <div className="hb-empty">
                {isAr ? 'لا عادات اليوم — أضف واحدة أو فعّل عادة.' : 'No habits due today — add one or activate a habit.'}
              </div>
            )}
            {progress.habits.map((habit) => {
              const status = getHabitStatus(habit, st);
              const done = isHabitDone(habit, st);
              const isAuto = habit.type === 'auto';
              const isSkip = status === 'skip';
              const dom = domainById(habit.domain);
              const open = expanded === habit.id;
              const auto = getAutomaticity(habit, st);
              const stackOptions = activeHabits.filter((h) => h.id !== habit.id);
              return (
                <div
                  key={habit.id}
                  className={`hb-item${done ? ' hb-item--done' : ''}${isSkip ? ' hb-item--skip' : ''}`}
                  style={{ borderColor: `${habit.color || dom.color}66` }}
                >
                  <button
                    type="button"
                    className={`hb-check${done ? ' on' : ''}`}
                    style={{ borderColor: habit.color || dom.color, background: done ? (habit.color || dom.color) : undefined }}
                    onClick={() => onToggle(habit)}
                    disabled={isAuto || isSkip}
                    aria-label={done ? (isAr ? 'مكتمل' : 'Done') : (isAr ? 'تحديد' : 'Mark done')}
                  >
                    {done ? '✓' : isSkip ? '—' : ''}
                  </button>
                  <button type="button" className="hb-body hb-body-btn" onClick={() => setExpanded(open ? null : habit.id)}>
                    <div className="hb-title">
                      <span>{habit.icon || dom.icon}</span>
                      {habitTitle(habit, isAr)}
                      <span className="hb-domain-tag" style={{ color: dom.color }}>{isAr ? dom.ar : dom.en}</span>
                      {isAuto && <span className="hb-auto">{t.auto}</span>}
                      {isSkip && <span className="hb-skip-tag">{t.skipped}</span>}
                      {auto.phase === 'forming' && auto.completedDays > 0 && (
                        <span className="hb-form-tag">{t.forming} · {t.week} {auto.week}</span>
                      )}
                      {auto.phase === 'stable' && (
                        <span className="hb-stable-tag">{t.stable}</span>
                      )}
                    </div>
                    <div className="hb-hint">{habitRecipe(habit, isAr)}</div>
                    {open && (
                      <div className="hb-recipe">
                        <div><b>{isAr ? 'بعد أن' : 'After'}</b> {isAr ? (habit.anchorAr || habit.anchorEn) : (habit.anchorEn || habit.anchorAr)}</div>
                        <div><b>{isAr ? 'سأ' : 'I will'}</b> {isAr ? (habit.tinyAr || habit.tinyEn) : (habit.tinyEn || habit.tinyAr)}</div>
                        {habit.type !== 'auto' && (
                          <>
                            <label className="hb-inline-field">
                              <span>{t.reminder}</span>
                              <input
                                type="time"
                                value={habit.reminderTime || ''}
                                onChange={(e) => onReminderChange(habit.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </label>
                            <label className="hb-inline-field">
                              <span>{t.stackAfter}</span>
                              <select
                                value={habit.stackAfter || ''}
                                onChange={(e) => onStackChange(habit.id, e.target.value || null)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">{t.none}</option>
                                {stackOptions.map((h) => (
                                  <option key={h.id} value={h.id}>{habitTitle(h, isAr)}</option>
                                ))}
                              </select>
                            </label>
                          </>
                        )}
                      </div>
                    )}
                  </button>
                  <div className="hb-actions">
                    {habit.type === 'link' && habit.practiceId && !done && (
                      <button
                        type="button"
                        className="hb-go"
                        style={{ color: habit.color, borderColor: `${habit.color}88` }}
                        onClick={() => { playSfx?.('click'); onOpenPractice?.(habit.practiceId); refresh(); }}
                      >
                        {t.go}
                      </button>
                    )}
                    {!done && !isAuto && (
                      <button type="button" className="hb-skip-btn" onClick={() => { playSfx?.('click'); setSkipTarget(habit); }}>
                        {t.skip}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hb-section">
            <div className="hb-section-title">{t.heatmap}</div>
            <Heatmap cells={heatmap} isAr={isAr} />
          </div>

          <button type="button" className="hb-add-btn" onClick={() => { playSfx?.('click'); setPanel('add'); }}>
            {t.add}
          </button>
          <button type="button" className="hb-edit-toggle" onClick={() => { playSfx?.('click'); setPanel(panel === 'manage' ? null : 'manage'); }}>
            {t.manage} {panel === 'manage' ? '▴' : '▾'}
          </button>

          {panel === 'manage' && (
            <div className="hb-manage">
              <label className="hb-remind-toggle">
                <input
                  type="checkbox"
                  checked={st.settings?.remindersEnabled !== false}
                  onChange={(e) => {
                    const next = setRemindersEnabled(e.target.checked);
                    setSt(next);
                    syncHabitReminders(next, isAr ? 'ar' : 'en');
                  }}
                />
                {t.remindersOn}
              </label>
              <label className="hb-remind-toggle">
                <input
                  type="checkbox"
                  checked={st.settings?.morningDigestEnabled !== false}
                  onChange={(e) => {
                    const next = setMorningDigestEnabled(e.target.checked);
                    setSt(next);
                    syncHabitReminders(next, isAr ? 'ar' : 'en');
                  }}
                />
                {t.morningOn}
              </label>
              {st.settings?.morningDigestEnabled !== false && (
                <label className="hb-inline-field">
                  <span>{t.morningAt}</span>
                  <input
                    type="time"
                    value={st.settings?.morningDigestTime || '08:00'}
                    onChange={(e) => {
                      const next = setMorningDigestTime(e.target.value);
                      setSt(next);
                      syncHabitReminders(next, isAr ? 'ar' : 'en');
                    }}
                  />
                </label>
              )}
              <div className="hb-backup-row">
                <button type="button" className="hb-backup-btn" onClick={onExport}>{t.export}</button>
                <button type="button" className="hb-backup-btn" onClick={onImport}>{t.importBtn}</button>
              </div>
              <div className="hb-manage-label">{t.active}</div>
              {st.habits.filter((h) => h.active).map((h) => (
                <div key={h.id} className="hb-manage-row">
                  <span>{h.icon} {habitTitle(h, isAr)}</span>
                  <button type="button" className="hb-manage-x" onClick={() => { playSfx?.('click'); setSt(toggleHabitActive(h.id)); }}>✕</button>
                </div>
              ))}
              {inactivePresets.length > 0 && (
                <>
                  <div className="hb-manage-label">{t.presets}</div>
                  {inactivePresets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="hb-manage-add"
                      onClick={() => { playSfx?.('click'); setSt(addPresetHabit(p.id)); }}
                    >
                      + {isAr ? p.ar : p.en}
                    </button>
                  ))}
                </>
              )}
              {st.habits.filter((h) => !h.active).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className="hb-manage-add"
                  onClick={() => { playSfx?.('click'); setSt(toggleHabitActive(h.id)); }}
                >
                  + {habitTitle(h, isAr)}
                </button>
              ))}
            </div>
          )}

          <p className="hb-note">{t.note}</p>
          </>
          )}

          {(tab === 'life' || tab === 'reflect' || tab === 'insights') && (
            <p className="hb-note">{t.note}</p>
          )}
        </div>
      </div>

      {skipTarget && (
        <SkipModal
          isAr={isAr}
          habit={skipTarget}
          graceLeft={graceLeft}
          onClose={() => setSkipTarget(null)}
          onSkip={onSkipConfirm}
        />
      )}
      {panel === 'add' && (
        <AddHabitForm
          isAr={isAr}
          playSfx={playSfx}
          onClose={() => setPanel(null)}
          onSave={onAddSave}
        />
      )}
    </div>
  );
}

const CSS = `
${LIFE_TAB_CSS}
${REFLECT_TAB_CSS}
${TEMPLATES_TAB_CSS}
${INSIGHTS_TAB_CSS}
.rx-root { position:fixed; inset:0; z-index:50; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--color-training-palette-surface,#fff7f2); color:${INK}; font-family:${SANS}; }
.hb-tabs { display:flex; gap:4px; padding:0 16px 12px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.hb-tab { flex:1; min-width:0; padding:10px 6px; border-radius:12px; border:2px solid ${LINE}; background:${CARD}; font-size:12px; font-weight:800; color:${SUB}; cursor:pointer; font-family:inherit; position:relative; white-space:nowrap; }
.hb-tab.on { border-color:${GOLD}; background:#fff8ef; color:${INK}; }
.hb-tab-dot { position:absolute; top:6px; inset-inline-end:8px; width:8px; height:8px; border-radius:50%; background:#c86f8f; }
.rx-root *, .rx-root *::before, .rx-root *::after { box-sizing:border-box; }
.rx-root .rx-app { max-width:480px; margin:0 auto; padding-bottom:80px; position:relative; }
.rx-root .rx-back { position:absolute; top:14px; left:12px; z-index:20; width:36px; height:36px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; color:#141210; font-size:22px; line-height:1; cursor:pointer; }
.rx-root .header { padding:24px 20px 18px; background:linear-gradient(180deg,#fffaf3 0%,var(--color-training-palette-surface,#fff7f2) 100%); }
.rx-root .header-sub { font-size:11px; letter-spacing:3px; text-transform:uppercase; margin-bottom:4px; font-weight:700; }
.rx-root .header-title { font-family:${SERIF}; font-size:34px; font-weight:600; line-height:1.04; color:${INK}; }
.rx-root .menu-tag { font-size:13px; color:${SUB}; margin-top:6px; }
.rx-root .content { padding:20px; }
.rx-root .serif { font-family:${SERIF}; }
.hb-nudge { background:#fff8ef; border:2px solid #e8c878; border-radius:14px; padding:12px 14px; margin-bottom:14px; }
.hb-nudge-title { font-size:13px; font-weight:800; color:#8a6010; margin-bottom:6px; }
.hb-nudge-item { font-size:13px; color:${INK}; padding:2px 0; }
.hb-hero { display:flex; align-items:center; gap:12px; background:${CARD}; border:2px solid ${LINE}; border-radius:18px; padding:16px; margin-bottom:18px; box-shadow:3px 3px 0 rgba(26,18,8,0.05); }
.hb-ring { position:relative; flex-shrink:0; }
.hb-ring-center { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; color:${INK}; }
.hb-ring-center span { font-size:18px; color:${SUB}; font-weight:700; }
.hb-ring-pct { font-size:26px; }
.hb-ring-pct span { font-size:14px; }
.hb-ring-check { font-size:34px; color:#6fae7a; }
.hb-hero-meta { flex:1; min-width:0; }
.hb-hero-label { font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${SUB}; margin-bottom:6px; }
.hb-hero-stat { font-size:22px; font-weight:800; color:${INK}; line-height:1.2; }
.hb-hero-sub { display:block; font-size:12px; font-weight:700; color:${FAINT}; margin-top:2px; }
.hb-hero-consistency { font-size:13px; color:${SUB}; margin-top:6px; }
.hb-hero-consistency b { color:#3a7a48; }
.hb-hero-done { margin-top:8px; display:inline-block; padding:4px 10px; border-radius:999px; background:#e8f5ea; color:#3a7a48; font-size:12px; font-weight:800; }
.hb-list { display:flex; flex-direction:column; gap:10px; margin-bottom:18px; }
.hb-empty { text-align:center; padding:24px; color:${SUB}; font-size:14px; background:${CARD}; border:2px dashed ${LINE}; border-radius:14px; }
.hb-item { display:flex; align-items:flex-start; gap:10px; background:${CARD}; border:2px solid ${LINE}; border-radius:14px; padding:12px; transition:opacity .2s; }
.hb-item--done { opacity:0.88; }
.hb-item--skip { opacity:0.75; background:#faf8f5; }
.hb-check { width:34px; height:34px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; color:#fff; font-size:16px; font-weight:900; flex-shrink:0; cursor:pointer; font-family:inherit; margin-top:2px; }
.hb-check:disabled { cursor:default; }
.hb-body { flex:1; min-width:0; text-align:start; }
.hb-body-btn { background:none; border:none; padding:0; cursor:pointer; font-family:inherit; color:inherit; width:100%; }
.hb-title { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:15px; font-weight:800; color:${INK}; margin-bottom:3px; }
.hb-hint { font-size:12px; color:${SUB}; line-height:1.45; }
.hb-domain-tag { font-size:10px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; }
.hb-auto { font-size:10px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:${FAINT}; background:#f3ece0; border-radius:999px; padding:2px 8px; }
.hb-skip-tag { font-size:10px; font-weight:800; color:#8a6010; background:#fff8ef; border-radius:999px; padding:2px 8px; }
.hb-form-tag { font-size:10px; font-weight:800; color:#5aa9c8; background:#e8f4fa; border-radius:999px; padding:2px 8px; }
.hb-stable-tag { font-size:10px; font-weight:800; color:#3a7a48; background:#e8f5ea; border-radius:999px; padding:2px 8px; }
.hb-stacks { margin-bottom:14px; }
.hb-stack-chain { display:flex; flex-wrap:wrap; align-items:center; gap:6px; padding:10px 12px; background:${CARD}; border:2px solid ${LINE}; border-radius:12px; margin-bottom:8px; font-size:13px; font-weight:700; }
.hb-stack-arrow { color:${GOLD}; font-weight:900; }
.hb-stack-item { white-space:nowrap; }
.hb-inline-field { display:block; margin-top:10px; }
.hb-inline-field span { display:block; font-size:11px; font-weight:800; color:${SUB}; margin-bottom:4px; text-transform:uppercase; }
.hb-inline-field input, .hb-inline-field select { width:100%; padding:8px 10px; border-radius:8px; border:2px solid ${LINE}; font-size:13px; font-family:inherit; background:#fff; }
.hb-remind-toggle { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; color:${INK}; margin-bottom:12px; cursor:pointer; }
.hb-backup-row { display:flex; gap:8px; margin-bottom:14px; }
.hb-backup-btn { flex:1; padding:10px; border-radius:10px; border:2px solid ${LINE}; background:#fffaf5; font-size:12px; font-weight:800; cursor:pointer; font-family:inherit; color:${SUB}; }
.hb-recipe { margin-top:8px; padding:8px 10px; background:#f9f4ec; border-radius:10px; font-size:12px; color:${INK}; line-height:1.5; }
.hb-recipe b { color:${GOLD}; margin-inline-end:4px; }
.hb-actions { display:flex; flex-direction:column; gap:6px; flex-shrink:0; }
.hb-go { padding:7px 10px; border-radius:10px; border:2px solid; background:#fffaf5; font-size:11px; font-weight:800; cursor:pointer; font-family:inherit; }
.hb-skip-btn { padding:6px 8px; border-radius:8px; border:none; background:transparent; color:${FAINT}; font-size:11px; font-weight:700; cursor:pointer; font-family:inherit; text-decoration:underline; }
.hb-section { margin-bottom:16px; }
.hb-section-title { font-size:12px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${SUB}; margin-bottom:10px; }
.hb-heat-grid { display:flex; gap:3px; overflow-x:auto; padding-bottom:4px; }
.hb-heat-col { display:flex; flex-direction:column; gap:3px; }
.hb-heat-cell { width:12px; height:12px; border-radius:3px; flex-shrink:0; background:#f5efe6; }
.hb-heat-legend { display:flex; align-items:center; gap:4px; margin-top:8px; font-size:10px; color:${FAINT}; }
.hb-heat-dot { width:10px; height:10px; border-radius:2px; }
.hb-add-btn { width:100%; padding:13px; border-radius:12px; border:2px solid #6fae7a; background:#e8f5ea; color:#3a7a48; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit; margin-bottom:10px; }
.hb-edit-toggle { width:100%; padding:11px; border-radius:12px; border:2px solid ${LINE}; background:#f3ece0; color:${SUB}; font-size:13px; font-weight:800; cursor:pointer; font-family:inherit; margin-bottom:10px; }
.hb-manage { background:${CARD}; border:2px solid ${LINE}; border-radius:14px; padding:12px; margin-bottom:14px; }
.hb-manage-label { font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:${FAINT}; margin:8px 0 6px; }
.hb-manage-label:first-child { margin-top:0; }
.hb-manage-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f0e8dc; font-size:14px; font-weight:700; }
.hb-manage-x { border:none; background:#f3ece0; color:${SUB}; width:28px; height:28px; border-radius:8px; cursor:pointer; font-weight:900; }
.hb-manage-add { display:block; width:100%; text-align:start; padding:10px 12px; margin-top:6px; border-radius:10px; border:2px dashed ${LINE}; background:#fffaf5; font-size:13px; font-weight:700; color:${SUB}; cursor:pointer; font-family:inherit; }
.hb-note { margin:8px 0 0; font-size:11.5px; color:${FAINT}; text-align:center; line-height:1.5; }
.hb-modal-bg { position:fixed; inset:0; z-index:60; background:rgba(26,18,8,0.45); display:flex; align-items:flex-end; justify-content:center; padding:20px; }
.hb-modal { width:100%; max-width:440px; background:${CARD}; border:2px solid ${LINE}; border-radius:18px 18px 14px 14px; padding:20px; box-shadow:0 -4px 24px rgba(26,18,8,0.12); max-height:90vh; overflow-y:auto; }
.hb-modal--wide { max-height:92vh; }
.hb-modal-title { font-family:${SERIF}; font-size:26px; font-weight:600; color:${INK}; margin-bottom:4px; }
.hb-modal-sub { font-size:15px; font-weight:800; color:${INK}; margin-bottom:8px; }
.hb-modal-hint { font-size:13px; color:${SUB}; margin:0 0 14px; line-height:1.45; }
.hb-reasons { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
.hb-reason { padding:8px 12px; border-radius:999px; border:2px solid ${LINE}; background:#fffaf5; font-size:12px; font-weight:700; color:${SUB}; cursor:pointer; font-family:inherit; }
.hb-reason.on { border-color:${GOLD}; background:#fff8ef; color:${INK}; }
.hb-grace-check { display:flex; align-items:center; gap:8px; font-size:13px; color:${SUB}; margin-bottom:14px; cursor:pointer; }
.hb-modal-actions { display:flex; gap:10px; justify-content:flex-end; }
.hb-btn-ghost { padding:10px 16px; border-radius:10px; border:2px solid ${LINE}; background:transparent; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; color:${SUB}; }
.hb-btn-primary { padding:10px 20px; border-radius:10px; border:none; background:linear-gradient(135deg,#c89a4a,${GOLD}); color:#fff; font-size:13px; font-weight:800; cursor:pointer; font-family:inherit; }
.hb-btn-primary:disabled { opacity:0.45; cursor:not-allowed; }
.hb-domains { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
.hb-domain { width:40px; height:40px; border-radius:10px; border:2px solid ${LINE}; background:#fffaf5; font-size:20px; cursor:pointer; }
.hb-domain.on { background:#fff8ef; box-shadow:0 0 0 2px ${GOLD}; }
.hb-field { display:block; margin-bottom:12px; }
.hb-field span { display:block; font-size:12px; font-weight:800; color:${SUB}; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px; }
.hb-field input { width:100%; padding:10px 12px; border-radius:10px; border:2px solid ${LINE}; background:#fff; font-size:14px; font-family:inherit; color:${INK}; }
.hb-freq-row { margin-bottom:16px; }
.hb-freq-row > span { display:block; font-size:12px; font-weight:800; color:${SUB}; margin-bottom:6px; text-transform:uppercase; }
.hb-freq-btns { display:flex; gap:8px; }
.hb-freq { padding:8px 14px; border-radius:999px; border:2px solid ${LINE}; background:#fffaf5; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; color:${SUB}; }
.hb-freq.on { border-color:${GOLD}; background:#fff8ef; color:${INK}; }

[data-home-theme='dark'] .rx-root { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .rx-back { background:#241c10; border-color:rgba(212,168,80,0.3); color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .header { background:linear-gradient(180deg,#1f1810 0%,var(--color-training-palette-surface) 100%); }
[data-home-theme='dark'] .rx-root .header-title { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .menu-tag { color:#c9b384; }
[data-home-theme='dark'] .hb-tab { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-tab.on { border-color:#e8ac4e; background:#332818; color:#f0e2c0; }
[data-home-theme='dark'] .hb-nudge { background:#332818; border-color:#8a6010; }
[data-home-theme='dark'] .hb-nudge-title { color:#e8ac4e; }
[data-home-theme='dark'] .hb-nudge-item { color:#f0e2c0; }
[data-home-theme='dark'] .hb-hero { background:#211a10; border-color:rgba(212,168,80,0.22); }
[data-home-theme='dark'] .hb-ring-center { color:#f0e2c0; }
[data-home-theme='dark'] .hb-ring-center span { color:#c9b384; }
[data-home-theme='dark'] .hb-hero-label { color:#c9b384; }
[data-home-theme='dark'] .hb-hero-stat { color:#f0e2c0; }
[data-home-theme='dark'] .hb-hero-sub { color:#8f7d58; }
[data-home-theme='dark'] .hb-hero-consistency { color:#c9b384; }
[data-home-theme='dark'] .hb-empty { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-item { background:#211a10; border-color:rgba(212,168,80,0.22); }
[data-home-theme='dark'] .hb-item--skip { background:#1a140c; }
[data-home-theme='dark'] .hb-check { background:#1a140c; border-color:rgba(212,168,80,0.3); }
[data-home-theme='dark'] .hb-title { color:#f0e2c0; }
[data-home-theme='dark'] .hb-hint { color:#c9b384; }
[data-home-theme='dark'] .hb-auto { color:#8f7d58; background:#332818; }
[data-home-theme='dark'] .hb-skip-tag { color:#e8ac4e; background:#332818; }
[data-home-theme='dark'] .hb-recipe { background:#1a140c; color:#f0e2c0; }
[data-home-theme='dark'] .hb-stacks .hb-stack-chain { background:#211a10; border-color:rgba(212,168,80,0.22); }
[data-home-theme='dark'] .hb-inline-field span { color:#c9b384; }
[data-home-theme='dark'] .hb-inline-field input, [data-home-theme='dark'] .hb-inline-field select { background:#1a140c; border-color:rgba(212,168,80,0.25); color:#f0e2c0; }
[data-home-theme='dark'] .hb-remind-toggle { color:#f0e2c0; }
[data-home-theme='dark'] .hb-backup-btn { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-section-title { color:#c9b384; }
[data-home-theme='dark'] .hb-add-btn { background:rgba(111,174,122,0.18); border-color:#6fae7a; color:#8fd49a; }
[data-home-theme='dark'] .hb-edit-toggle { background:#332818; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-manage { background:#211a10; border-color:rgba(212,168,80,0.22); }
[data-home-theme='dark'] .hb-manage-label { color:#8f7d58; }
[data-home-theme='dark'] .hb-manage-row { border-color:rgba(212,168,80,0.14); color:#f0e2c0; }
[data-home-theme='dark'] .hb-manage-x { background:#332818; color:#c9b384; }
[data-home-theme='dark'] .hb-manage-add { background:#1a140c; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-note { color:#8f7d58; }
[data-home-theme='dark'] .hb-modal-bg { background:rgba(0,0,0,0.6); }
[data-home-theme='dark'] .hb-modal { background:#211a10; border-color:rgba(212,168,80,0.25); }
[data-home-theme='dark'] .hb-modal-title { color:#f0e2c0; }
[data-home-theme='dark'] .hb-modal-sub { color:#f0e2c0; }
[data-home-theme='dark'] .hb-modal-hint { color:#c9b384; }
[data-home-theme='dark'] .hb-reason { background:#1a140c; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-reason.on { border-color:#e8ac4e; background:#332818; color:#f0e2c0; }
[data-home-theme='dark'] .hb-grace-check { color:#c9b384; }
[data-home-theme='dark'] .hb-btn-ghost { border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-domain { background:#1a140c; border-color:rgba(212,168,80,0.25); }
[data-home-theme='dark'] .hb-domain.on { background:#332818; }
[data-home-theme='dark'] .hb-field span { color:#c9b384; }
[data-home-theme='dark'] .hb-field input { background:#1a140c; border-color:rgba(212,168,80,0.25); color:#f0e2c0; }
[data-home-theme='dark'] .hb-freq { background:#1a140c; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .hb-freq.on { border-color:#e8ac4e; background:#332818; color:#f0e2c0; }
[data-home-theme='dark'] .hb-heat-cell { background:#2a2114; }
`;
