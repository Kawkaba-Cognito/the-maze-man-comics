import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DOMAINS_BY_ID } from '../../features/training/registry';
import { adherenceStats, monthCalendar, progressSnapshot } from '../../features/workout/workoutStats';
import { allChecks } from '../../features/workout/workoutState';
import { RATED_GAMES, gameRating, ratingBand } from '../../features/training/rating';
import { DOMAIN_SCIENCE, METHODOLOGY, VALIDITY_NOTE, RELIABILITY_NOTE, REFERENCES } from '../../features/training/assessment/assessmentRefs';
import { NORM_DISCLAIMER, ordinal, reliableChangeRaw } from '../../features/training/assessment/assessmentNorms';
import { ANCHORS, typicalRange } from '../../features/training/assessment/paradigmAnchors';
import { gameDeepReport } from '../../features/training/shared/reportData';

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

      {/* ── TRAINING RATINGS (per-game skill, 0–1000) ── */}
      <div className="ws-card">
        <div className="ws-card-title">{L('Training ratings', 'تقييمات التدريب')}</div>
        {Object.entries(RATED_GAMES).map(([k, def]) => {
          const r = gameRating(k);
          const cfg = DOMAINS_BY_ID[def.domainId];
          const band = r ? ratingBand(r.rating) : null;
          return (
            <div key={k} className="ws-dom">
              <div className="ws-dom-head">
                <span className="ws-dom-glyph" style={{ color: cfg?.color }}>{cfg?.glyph}</span>
                <span className="ws-dom-name">{isAr ? def.ar : def.en}</span>
                {r ? (
                  <span className="ws-dom-band" style={{ background: `${band.color}22`, color: band.color }}>
                    {r.rating} · {isAr ? band.ar : band.en}
                    {r.status !== 'stable' && ` · ${r.status === 'provisional' ? L('provisional', 'مبدئي') : L('calibrating', 'معايرة')}`}
                  </span>
                ) : (
                  <span className="ws-dom-band">{L('unrated — play survival mode', 'غير مقيّم — العب وضع البقاء')}</span>
                )}
                <Sparkline data={(r?.hist || []).map((h) => h.r)} color={cfg?.color || '#e8ac4e'} w={70} h={24} min={0} max={1000} />
              </div>
              {r && <div className="ws-bar"><div className="ws-bar-fill" style={{ width: `${r.rating / 10}%`, background: band.color }} /></div>}
            </div>
          );
        })}
        <p className="ws-note">{L(
          'Ratings (0–1000) are a smoothed estimate of your free-run performance per exercise — your assessment seeds them, every completed free run refines them, and tomorrow\'s workout difficulty follows them.',
          'التقييمات (0–1000) تقدير مُنعَّم لأدائك في وضع البقاء لكل تمرين — يبدأ من تقييمك المعرفي، وتصقله كل جولة حرة مكتملة، وصعوبة تمرين الغد تتبعه.',
        )}</p>
      </div>

      {/* ── DEEP PERFORMANCE METRICS (per-trial psychometrics) ── */}
      {(() => {
        const ms = (v) => (v == null ? null : `${v}ms`);
        const extrasLine = (gk, ex) => {
          const p = [];
          if (gk === 'spatial-stroop') {
            if (ex.interferenceMs != null) p.push(`${L('interference', 'تداخل')} ${ms(ex.interferenceMs)}`);
            if (ex.switchCostMs != null) p.push(`${L('switch cost', 'كلفة تبديل')} ${ex.switchCostMs >= 0 ? '+' : ''}${ms(ex.switchCostMs)}`);
          } else if (gk === 'cancel-task') {
            if (ex.omissions != null) p.push(`${L('omissions', 'إغفالات')} ${ex.omissions}`);
            if (ex.commissions != null) p.push(`${L('false taps', 'نقرات خاطئة')} ${ex.commissions}`);
            if (ex.fatiguePct != null) p.push(`${L('run fatigue', 'إجهاد الجولة')} ${ex.fatiguePct > 0 ? '+' : ''}${ex.fatiguePct}%`);
          } else if (gk === 'memo-span') {
            if (ex.fwdSpan != null) p.push(`${L('span fwd', 'مدى أمامي')} ${ex.fwdSpan}`);
            if (ex.bwdSpan != null) p.push(`${L('bwd', 'عكسي')} ${ex.bwdSpan}`);
          } else if (gk === 'rush-hour') {
            if (ex.planMs != null) p.push(`${L('planning', 'تخطيط')} ${(ex.planMs / 1000).toFixed(1)}s`);
            if (ex.movesOverPar != null) p.push(`${ex.movesOverPar >= 0 ? '+' : ''}${ex.movesOverPar} ${L('over par', 'فوق الأمثل')}`);
          } else if (gk === 'wordle') {
            if (ex.words != null) p.push(`${ex.words} ${L('words', 'كلمة')}`);
            if (ex.wordGapMs != null) p.push(`${L('word gap', 'فاصل الكلمات')} ${(ex.wordGapMs / 1000).toFixed(1)}s`);
            if (ex.bestWordLen != null) p.push(`${L('longest', 'الأطول')} ${ex.bestWordLen}`);
          } else if (gk === 'speed-match') {
            if (ex.maxKey != null) p.push(`${L('key up to', 'مفتاح حتى')} ${ex.maxKey} ${L('symbols', 'رمزاً')}`);
          }
          return p.join(' · ');
        };
        const reports = Object.values(RATED_GAMES)
          .map((def) => ({ def, rep: gameDeepReport(def.gameKey) }))
          .filter((x) => x.rep);
        if (!reports.length) return null;
        return (
          <div className="ws-card">
            <div className="ws-card-title">{L('Deep performance metrics', 'مقاييس الأداء الدقيقة')}</div>
            {reports.map(({ def, rep }) => {
              const cfg = DOMAINS_BY_ID[def.domainId];
              const s = rep.summary;
              const core = [
                s.acc != null ? `${L('accuracy', 'الدقة')} ${Math.round(s.acc * 100)}%` : null,
                s.medianRt != null ? `${L('median RT', 'وسيط الاستجابة')} ${ms(s.medianRt)}` : null,
                s.sdRt != null ? `± ${ms(s.sdRt)}` : null,
                s.ies != null ? `IES ${s.ies}` : null,
                s.pes != null ? `${L('post-error', 'بعد الخطأ')} ${s.pes > 0 ? '+' : ''}${ms(s.pes)}` : null,
              ].filter(Boolean).join(' · ');
              const ex = extrasLine(def.gameKey, rep.extras || {});
              const excl = (s.anticipations || 0) + (s.outliers || 0);
              return (
                <div key={def.gameKey} className="ws-dom">
                  <div className="ws-dom-head">
                    <span className="ws-dom-glyph" style={{ color: cfg?.color }}>{cfg?.glyph}</span>
                    <span className="ws-dom-name">{isAr ? def.ar : def.en}</span>
                    <span className="ws-dom-band">
                      {rep.sessions} {L('runs', 'جولات')}
                    </span>
                    <Sparkline
                      data={rep.seriesKind === 'medianRt' ? rep.series.map((v) => -v) : rep.series}
                      color={cfg?.color || '#e8ac4e'}
                      w={70}
                      h={24}
                    />
                  </div>
                  {core && <p className="ws-note" style={{ marginTop: 2 }}>{core}</p>}
                  {ex && <p className="ws-note" style={{ marginTop: 0 }}>{ex}{excl > 0 ? ` · ${excl} ${L('trials excluded', 'محاولات مستبعدة')}` : ''}</p>}
                </div>
              );
            })}
            <p className="ws-note">{L(
              'Computed from your latest banked run\'s trial-by-trial data. RT stats use correct responses only, after excluding anticipations (<150ms) and statistical outliers (median ± 3·MAD). IES = RT ÷ accuracy (penalises guessing). Post-error = how much you slow down after a mistake (adaptive control). Sparkline: trend across runs (RT trends show faster as up).',
              'محسوبة من بيانات كل محاولة في آخر جولة مسجّلة. إحصاءات زمن الاستجابة تستخدم الإجابات الصحيحة فقط بعد استبعاد الاستباقات (<150م.ث) والقيم الشاذة (الوسيط ± 3·MAD). IES = الزمن ÷ الدقة (يعاقب التخمين). بعد الخطأ = مقدار تباطؤك بعد الغلط (تحكّم تكيفي). الخط: الاتجاه عبر الجولات (الأسرع للأعلى في اتجاهات الزمن).',
            )}</p>
          </div>
        );
      })()}

      {/* ── WEEKLY REACTION CHECKS ── */}
      {(() => {
        const checks = allChecks();
        if (!checks.length) return null;
        const lastC = checks[checks.length - 1];
        const prevC = checks.length > 1 ? checks[checks.length - 2] : null;
        const d = prevC ? lastC.ms - prevC.ms : null;
        // Reliable-change gate: a few ms of week-to-week wobble is measurement
        // noise — only flag faster/slower beyond the RCI threshold.
        const rc = reliableChangeRaw(d, ANCHORS.pvtMedianMs.sd, 0.8);
        const sig = rc?.reliable ?? false;
        const typ = typicalRange('pvtMedianMs');
        return (
          <div className="ws-card">
            <div className="ws-card-title">{L('Weekly reaction check', 'فحص رد الفعل الأسبوعي')}</div>
            <div className="ws-idx-row">
              <div className="ws-idx-big" style={{ color: sig && d < 0 ? '#5ec07a' : '#ffd066' }}>{lastC.ms}<span style={{ fontSize: '0.5em' }}> ms</span></div>
              <div className="ws-idx-meta">
                <div>{L('Latest check', 'آخر فحص')}: {lastC.date}</div>
                {typ && (
                  <div>{L('Typical alert range', 'النطاق المعتاد لليقظة')}: {typ[0]}–{typ[1]} ms</div>
                )}
                {prevC && (
                  <div>
                    {L('vs previous', 'مقارنة بالسابق')}:{' '}
                    {sig ? (
                      <b style={{ color: d < 0 ? '#5ec07a' : '#c0563f' }}>{d < 0 ? '▼' : '▲'}{Math.abs(d)} ms {d < 0 ? L('(reliably faster)', '(أسرع بشكل موثوق)') : L('(reliably slower)', '(أبطأ بشكل موثوق)')}</b>
                    ) : (
                      <span>{d === 0 ? '0 ms' : `${d < 0 ? '▼' : '▲'}${Math.abs(d)} ms`} {L('(within noise)', '(ضمن هامش الضوضاء)')}</span>
                    )}
                  </div>
                )}
                <div>{checks.length} {L('checks recorded', 'فحوصات مسجّلة')}</div>
              </div>
              <Sparkline data={checks.map((c) => -c.ms)} color="#ffd066" />
            </div>
            <p className="ws-note">{L(
              'A 5-trial reaction test about once a week. Lower is faster. Changes are flagged only beyond the reliable-change threshold (RCI ≥ 1.96) — smaller week-to-week swings are expected measurement noise (sleep, stress, time of day). Typical range from PVT literature (Basner & Dinges 2011); phone taps add motor latency.',
              'اختبار رد فعل من 5 محاولات مرة في الأسبوع تقريباً. الأقل أسرع. تُعلَّم التغيّرات فقط عندما تتجاوز عتبة التغيّر الموثوق (RCI ≥ 1.96) — التقلّبات الأسبوعية الأصغر ضوضاء قياس متوقعة (النوم، الإجهاد، وقت اليوم). النطاق المعتاد من أدبيات PVT (Basner & Dinges 2011)؛ واللمس على الهاتف يضيف زمناً حركياً.',
            )}</p>
          </div>
        );
      })()}

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
