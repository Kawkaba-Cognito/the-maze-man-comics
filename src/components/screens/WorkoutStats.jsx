import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DOMAINS_BY_ID } from '../../features/training/registry';
import { adherenceStats, monthCalendar, progressSnapshot } from '../../features/workout/workoutStats';
import { DOMAIN_SCIENCE, METHODOLOGY, VALIDITY_NOTE, RELIABILITY_NOTE, REFERENCES } from '../../features/training/assessment/assessmentRefs';
import { NORM_DISCLAIMER, ordinal } from '../../features/training/assessment/assessmentNorms';

const BAND_COLOR = { low: '#c0563f', below: '#d08a3a', average: '#5fa9d8', above: '#5ec07a', high: '#9be85a' };
const BAND_LABEL = {
  en: { low: 'Low', below: 'Below avg', average: 'Average', above: 'Above avg', high: 'High' },
  ar: { low: 'منخفض', below: 'دون المتوسط', average: 'متوسط', above: 'فوق المتوسط', high: 'مرتفع' },
};
const DOW = { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] };
const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/** Tiny SVG sparkline for a 0–100 (or standard-score) series. */
function Sparkline({ data, w = 92, h = 28, min, max, color = '#e8ac4e' }) {
  if (!data || data.length < 2) return <div className="ws-spark-empty">—</div>;
  const lo = min ?? Math.min(...data);
  const hi = max ?? Math.max(...data);
  const span = hi - lo || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - 4) + 2;
    const y = h - 2 - ((v - lo) / span) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const last = data[data.length - 1];
  const lx = w - 2, ly = h - 2 - ((last - lo) / span) * (h - 4);
  return (
    <svg className="ws-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.4" fill={color} />
    </svg>
  );
}

export default function WorkoutStats({ onBack }) {
  const { currentLang, switchTab } = useApp();
  const isAr = currentLang === 'ar';
  const L = (en, ar) => (isAr ? ar : en);

  const adh = adherenceStats();
  const snap = progressSnapshot();
  const [mref, setMref] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const cells = monthCalendar(mref.y, mref.m, adh.history);
  const shiftMonth = (d) => setMref((p) => { const dt = new Date(p.y, p.m + d, 1); return { y: dt.getFullYear(), m: dt.getMonth() }; });

  return (
    <div className="workout-screen ws-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <button className="workout-back" onClick={onBack}>‹ {L('Back', 'رجوع')}</button>
      <div className="workout-title">📊 {L('Progress', 'التقدّم')}</div>
      <p className="workout-sub">{L('Your training dose and your measured change over time.', 'جرعة تدريبك وتغيّرك المقاس عبر الزمن.')}</p>

      {/* ── ADHERENCE CALENDAR ── */}
      <div className="ws-card">
        <div className="ws-cal-head">
          <button className="ws-cal-nav" onClick={() => shiftMonth(-1)} aria-label="prev">‹</button>
          <span className="ws-cal-title">{MONTHS[isAr ? 'ar' : 'en'][mref.m]} {mref.y}</span>
          <button className="ws-cal-nav" onClick={() => shiftMonth(1)} aria-label="next">›</button>
        </div>
        <div className="ws-cal-dow">{DOW[isAr ? 'ar' : 'en'].map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="ws-cal-grid">
          {cells.map((c, i) => (
            <div key={i} className={`ws-cal-cell${!c ? ' is-empty' : c.full ? ' is-full' : c && c.done > 0 ? ' is-partial' : ''}`}>
              {c ? c.day : ''}
            </div>
          ))}
        </div>
        <div className="ws-stat-row">
          <div className="ws-stat"><div className="ws-stat-n">🔥 {adh.currentStreak}</div><div className="ws-stat-l">{L('Streak', 'سلسلة')}</div></div>
          <div className="ws-stat"><div className="ws-stat-n">{adh.longestStreak}</div><div className="ws-stat-l">{L('Best streak', 'أطول سلسلة')}</div></div>
          <div className="ws-stat"><div className="ws-stat-n">{adh.consistency28}%</div><div className="ws-stat-l">{L('28-day', 'آخر ٢٨ يوم')}</div></div>
          <div className="ws-stat"><div className="ws-stat-n">{adh.totalDays}</div><div className="ws-stat-l">{L('Total days', 'إجمالي الأيام')}</div></div>
        </div>
        <p className="ws-note">{L(
          'Spacing practice across days — not cramming — improves consolidation (Cepeda 2006; Bell 2022, PNAS). Consistency is the dose that matters.',
          'توزيع التدريب عبر الأيام — لا الحشو — يحسّن الترسيخ (Cepeda 2006؛ Bell 2022، PNAS). الانتظام هو الجرعة المهمة.',
        )}</p>
      </div>

      {/* ── COGNITIVE INDEX (outcome) ── */}
      {snap.hasData && snap.idxNow ? (
        <div className="ws-card">
          <div className="ws-card-title">{L('Cognitive Index', 'المؤشر المعرفي')}</div>
          <div className="ws-idx-row">
            <div className="ws-idx-big" style={{ color: BAND_COLOR[snap.idxNow.band] }}>{snap.idxNow.index}</div>
            <div className="ws-idx-meta">
              <div>{L('Standard score', 'درجة معيارية')} (μ100, σ15) · {L('CI', 'فاصل')} {snap.idxNow.ciLo}–{snap.idxNow.ciHi}</div>
              <div>{L('Age-group percentile', 'مئوية الفئة العمرية')}: <b>{ordinal(snap.idxNow.percentile)}</b> · {BAND_LABEL[isAr ? 'ar' : 'en'][snap.idxNow.band]}</div>
              {snap.idxBaseline && (
                <div>{L('Baseline', 'خط الأساس')}: {snap.idxBaseline.index} → {L('now', 'الآن')}: {snap.idxNow.index}
                  {snap.idxDelta != null && <b style={{ color: snap.idxDelta >= 0 ? '#5ec07a' : '#c0563f' }}> ({snap.idxDelta >= 0 ? '+' : ''}{snap.idxDelta})</b>}
                </div>
              )}
            </div>
            <Sparkline data={snap.overall} color="#ffd066" />
          </div>
        </div>
      ) : (
        <div className="ws-card ws-cta">
          <div className="ws-card-title">{L('Set your baseline', 'حدّد خط أساسك')}</div>
          <p className="ws-note">{L(
            'Take the cognitive assessment to establish a baseline. Re-take it periodically — your own change over time is the scientifically valid signal of improvement.',
            'أجرِ التقييم المعرفي لتحديد خط أساس. أعِده دورياً — تغيّرك مع الوقت هو الإشارة العلمية الصحيحة للتحسّن.',
          )}</p>
          <button className="workout-cta" onClick={() => switchTab('comics')}>{L('Go to Assessment', 'إلى التقييم')}</button>
        </div>
      )}

      {/* ── PER-DOMAIN + NORMATIVE ── */}
      {snap.hasData && (
        <div className="ws-card">
          <div className="ws-card-title">{L('By cognitive domain', 'حسب المجال المعرفي')}</div>
          {snap.domains.map((d) => {
            const cfg = DOMAINS_BY_ID[d.domain];
            const band = d.stats?.band;
            return (
              <div key={d.domain} className="ws-dom">
                <div className="ws-dom-head">
                  <span className="ws-dom-glyph" style={{ color: cfg?.color }}>{cfg?.glyph}</span>
                  <span className="ws-dom-name">{isAr ? cfg?.nameAr : cfg?.name}</span>
                  {band && <span className="ws-dom-band" style={{ background: `${BAND_COLOR[band]}22`, color: BAND_COLOR[band] }}>{BAND_LABEL[isAr ? 'ar' : 'en'][band]}</span>}
                  <Sparkline data={d.series} color={cfg?.color || '#e8ac4e'} w={70} h={24} />
                </div>
                {d.score != null ? (
                  <>
                    <div className="ws-bar"><div className="ws-bar-fill" style={{ width: `${d.score}%`, background: cfg?.color }} /></div>
                    <div className="ws-dom-meta">
                      <span>{L('Score', 'درجة')} {d.score}/100</span>
                      {d.stats && <span>SS {d.stats.standardScore}</span>}
                      {d.stats && <span>{ordinal(d.stats.percentile)} {L('pct', 'مئوية')}</span>}
                      {d.delta != null && (
                        <span style={{ color: d.delta >= 0 ? '#5ec07a' : '#c0563f' }}>
                          {L('vs base', 'مقابل الأساس')} {d.delta >= 0 ? '+' : ''}{d.delta}
                          {d.change?.reliable ? ' ✓' : ''}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="ws-dom-meta"><span>{L('Not yet assessed', 'لم يُقيَّم بعد')}</span></div>
                )}
              </div>
            );
          })}
          <p className="ws-note">{L(
            'SS = standard score (μ100, σ15). “✓” marks a change beyond measurement noise — a Reliable Change Index ≥1.96 (Jacobson & Truax 1991). ' + NORM_DISCLAIMER,
            'SS = درجة معيارية (متوسط 100، انحراف 15). تشير «✓» إلى تغيّر يتجاوز ضوضاء القياس وفق مؤشر التغيّر الموثوق ≥1.96 (Jacobson & Truax 1991).',
          )}</p>
        </div>
      )}

      {/* ── THE SCIENCE ── */}
      <div className="ws-card">
        <div className="ws-card-title">🧬 {L('The science', 'العِلم')}</div>
        <p className="ws-note ws-honest">{L(
          'Honest framing: brain games reliably improve the trained skill (practice effects) and similar tasks (near transfer); broad “make you smarter” claims (far transfer) are weakly supported (Simons 2016; Sala & Gobet 2019). So we track YOUR change vs YOUR baseline, age-referenced — not hype.',
          'إطار صادق: تحسّن ألعاب الدماغ المهارة المُدرَّبة (آثار التمرين) والمهام المشابهة (نقل قريب)؛ أما ادعاءات «زيادة الذكاء» العامة (نقل بعيد) فضعيفة الدعم (Simons 2016؛ Sala & Gobet 2019). لذا نتتبّع تغيّرك مقابل أساسك مقارنةً بالعمر — لا المبالغة.',
        )}</p>
        {Object.keys(DOMAIN_SCIENCE[isAr ? 'ar' : 'en']).map((d) => {
          const cfg = DOMAINS_BY_ID[d];
          const sci = DOMAIN_SCIENCE[isAr ? 'ar' : 'en'][d];
          return (
            <div key={d} className="ws-sci">
              <div className="ws-sci-name" style={{ color: cfg?.color }}>{cfg?.glyph} {isAr ? cfg?.nameAr : cfg?.name}</div>
              <div className="ws-sci-measures">{sci.measures}</div>
              <div className="ws-sci-cites">{sci.cites.join(' · ')}</div>
            </div>
          );
        })}
        <div className="ws-card-subtitle">{L('Methodology', 'المنهجية')}</div>
        <p className="ws-note">{METHODOLOGY[isAr ? 'ar' : 'en']}</p>
        <div className="ws-card-subtitle">{L('Validity', 'الصدق')}</div>
        <p className="ws-note">{VALIDITY_NOTE[isAr ? 'ar' : 'en']}</p>
        <div className="ws-card-subtitle">{L('Reliability', 'الموثوقية')}</div>
        <p className="ws-note">{RELIABILITY_NOTE[isAr ? 'ar' : 'en']}</p>
        <div className="ws-card-subtitle">{L('References', 'المراجع')}</div>
        <ul className="ws-refs">{REFERENCES.map((r, i) => <li key={i}>{r}</li>)}</ul>
      </div>
    </div>
  );
}
