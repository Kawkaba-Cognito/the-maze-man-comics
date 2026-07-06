import React, { useMemo } from 'react';
import {
  getInsightsSummary, habitTitle, domainById,
} from './habitState';

const INK = '#2d2210';
const SUB = '#8a7f6f';
const FAINT = '#b3a288';
const LINE = '#e3d6c4';
const CARD = '#fffdf8';
const GOLD = '#b9842f';
const SERIF = "'Cormorant Garamond', Georgia, serif";

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="hb-ins-stat" style={{ borderColor: `${accent || GOLD}55` }}>
      <div className="hb-ins-stat-val" style={{ color: accent || INK }}>{value}</div>
      <div className="hb-ins-stat-label">{label}</div>
      {sub && <div className="hb-ins-stat-sub">{sub}</div>}
    </div>
  );
}

function BarRow({ label, pct, color, right }) {
  return (
    <div className="hb-ins-bar-row">
      <div className="hb-ins-bar-head">
        <span className="hb-ins-bar-label">{label}</span>
        <span className="hb-ins-bar-pct">{right ?? `${pct}%`}</span>
      </div>
      <div className="hb-ins-bar-track">
        <div className="hb-ins-bar-fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color || '#6fae7a' }} />
      </div>
    </div>
  );
}

export default function HabitInsightsTab({ isAr, st }) {
  const data = useMemo(() => getInsightsSummary(st), [st]);

  const t = {
    title: isAr ? 'رؤى' : 'Insights',
    sub: isAr ? 'ثباتك الحقيقي — بدون ضغط، فقط بيانات.' : 'Your real consistency — no guilt, just data.',
    streak: isAr ? 'سلسلة أيام' : 'Day streak',
    consistency: isAr ? 'ثبات 30 يوم' : '30-day consistency',
    grace: isAr ? 'أيام سماح' : 'Grace days left',
    forming: isAr ? 'قيد التكوّن' : 'Forming',
    stable: isAr ? 'مستقرّة' : 'Stable',
    weekly: isAr ? '4 أسابيع' : '4 weeks',
    habits: isAr ? 'كل عادة' : 'Each habit',
    domains: isAr ? 'حسب المجال' : 'By domain',
    skips: isAr ? 'أسباب التخطّي' : 'Skip reasons',
    coach: isAr ? 'ملاحظة' : 'Coach note',
    noData: isAr ? 'ابدأ بتسجيل العادات لرؤية الرؤى.' : 'Start logging habits to see insights.',
    best: isAr ? 'الأقوى' : 'Strongest',
    focus: isAr ? 'ركّز هنا' : 'Focus here',
  };

  const coachNote = useMemo(() => {
    if (!data.habitStats.length) return null;
    if (data.weakest && data.weakest.pct != null && data.weakest.pct < 50) {
      const name = habitTitle(data.weakest.habit, isAr);
      return isAr
        ? `${name} تحتاج لطفاً — جرّب تصغير الخطوة أو تغيير الوقت.`
        : `${name} needs gentleness — try a smaller step or a new anchor.`;
    }
    if (data.consistency.pct >= 80) {
      return isAr
        ? 'ثباتك ممتاز. حافظ على الخطوات الصغيرة — لا تكبّرها بعد.'
        : 'Solid consistency. Keep steps tiny — resist the urge to scale up yet.';
    }
    if (data.forming > 0) {
      return isAr
        ? `${data.forming} عادة ما زالت تتشكّل. الصبر جزء من العملية.`
        : `${data.forming} habit${data.forming > 1 ? 's are' : ' is'} still forming. Patience is part of the process.`;
    }
    return isAr
      ? 'راجع عجلة الحياة — أضف عادة واحدة في المجال الأضعف.'
      : 'Check your Wheel of Life — add one habit in your lowest domain.';
  }, [data, isAr]);

  if (!data.activeCount) {
    return (
      <div className="hb-insights">
        <div className="hb-section-title">{t.title}</div>
        <p className="hb-life-hint">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="hb-insights">
      <div className="hb-ins-head">
        <div className="hb-ins-title serif">{t.title}</div>
        <p className="hb-ins-sub">{t.sub}</p>
      </div>

      <div className="hb-ins-stats">
        <StatCard label={t.streak} value={data.streak} sub={isAr ? 'أيام كاملة' : 'full days'} accent="#e8ac4e" />
        <StatCard label={t.consistency} value={`${data.consistency.pct}%`} sub={`${data.consistency.completed}/${data.consistency.expected}`} accent="#6fae7a" />
        <StatCard label={t.grace} value={data.graceLeft} accent="#5aa9c8" />
      </div>

      <div className="hb-ins-pills">
        <span className="hb-ins-pill">🌱 {t.forming}: {data.forming}</span>
        <span className="hb-ins-pill">✓ {t.stable}: {data.stable}</span>
      </div>

      {coachNote && (
        <div className="hb-ins-coach">
          <div className="hb-ins-coach-label">{t.coach}</div>
          <p>{coachNote}</p>
        </div>
      )}

      {data.weeklyTrend.some((w) => w.expected > 0) && (
        <div className="hb-ins-block">
          <div className="hb-section-title">{t.weekly}</div>
          <div className="hb-ins-weeks">
            {data.weeklyTrend.map((w) => (
              <div key={w.label} className="hb-ins-week-col">
                <div className="hb-ins-week-bar" style={{ height: `${Math.max(8, w.pct)}%` }} title={`${w.pct}%`} />
                <span className="hb-ins-week-lbl">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.habitStats.length > 0 && (
        <div className="hb-ins-block">
          <div className="hb-section-title">{t.habits}</div>
          {data.habitStats.map((row, i) => {
            const h = row.habit;
            const tag = i === 0 && data.habitStats.length > 1 ? t.best : (i === data.habitStats.length - 1 && row.pct < 70 ? t.focus : null);
            return (
              <BarRow
                key={h.id}
                label={`${h.icon} ${habitTitle(h, isAr)}${tag ? ` · ${tag}` : ''}`}
                pct={row.pct ?? 0}
                color={h.color}
                right={`${row.pct ?? 0}%`}
              />
            );
          })}
        </div>
      )}

      {data.domainStats.length > 0 && (
        <div className="hb-ins-block">
          <div className="hb-section-title">{t.domains}</div>
          {data.domainStats.map((row) => {
            const dom = domainById(row.domain.id);
            return (
              <BarRow
                key={dom.id}
                label={`${dom.icon} ${isAr ? dom.ar : dom.en}`}
                pct={row.pct ?? 0}
                color={dom.color}
              />
            );
          })}
        </div>
      )}

      {data.skipBreakdown.length > 0 && (
        <div className="hb-ins-block">
          <div className="hb-section-title">{t.skips}</div>
          {data.skipBreakdown.map(({ reason, count }) => (
            <div key={reason.id} className="hb-ins-skip-row">
              <span>{isAr ? reason.ar : reason.en}</span>
              <b>{count}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const INSIGHTS_TAB_CSS = `
.hb-ins-head { margin-bottom:14px; }
.hb-ins-title { font-family:${SERIF}; font-size:28px; font-weight:600; color:${INK}; margin-bottom:4px; }
.hb-ins-sub { font-size:13px; color:${SUB}; margin:0; line-height:1.45; }
.hb-ins-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
.hb-ins-stat { background:${CARD}; border:2px solid ${LINE}; border-radius:12px; padding:10px 8px; text-align:center; }
.hb-ins-stat-val { font-size:22px; font-weight:900; line-height:1.1; }
.hb-ins-stat-label { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:${SUB}; margin-top:4px; }
.hb-ins-stat-sub { font-size:10px; color:${FAINT}; margin-top:2px; }
.hb-ins-pills { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
.hb-ins-pill { font-size:12px; font-weight:800; padding:6px 10px; border-radius:999px; background:#f3ece0; color:${INK}; }
.hb-ins-coach { background:#fff8ef; border:2px solid #e8c878; border-radius:14px; padding:12px 14px; margin-bottom:16px; }
.hb-ins-coach-label { font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#8a6010; margin-bottom:4px; }
.hb-ins-coach p { margin:0; font-size:13px; color:${INK}; line-height:1.5; }
.hb-ins-block { margin-bottom:18px; }
.hb-ins-weeks { display:flex; align-items:flex-end; gap:10px; height:100px; padding:8px 4px 0; background:${CARD}; border:2px solid ${LINE}; border-radius:12px; }
.hb-ins-week-col { flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; gap:6px; }
.hb-ins-week-bar { width:100%; max-width:36px; min-height:8px; background:linear-gradient(180deg,#9fd4a3,#6fae7a); border-radius:6px 6px 2px 2px; transition:height .3s ease; }
.hb-ins-week-lbl { font-size:9px; font-weight:800; color:${FAINT}; }
.hb-ins-bar-row { margin-bottom:10px; }
.hb-ins-bar-head { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px; }
.hb-ins-bar-label { font-size:13px; font-weight:700; color:${INK}; min-width:0; }
.hb-ins-bar-pct { font-size:12px; font-weight:800; color:${SUB}; flex-shrink:0; }
.hb-ins-bar-track { height:8px; background:#efe6d6; border-radius:999px; overflow:hidden; }
.hb-ins-bar-fill { height:100%; border-radius:999px; transition:width .35s ease; }
.hb-ins-skip-row { display:flex; justify-content:space-between; padding:8px 10px; background:${CARD}; border:2px solid ${LINE}; border-radius:10px; margin-bottom:6px; font-size:13px; color:${INK}; }
.hb-ins-skip-row b { color:${GOLD}; }
.serif { font-family:${SERIF}; }
`;
