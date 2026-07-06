import React, { useMemo, useState } from 'react';
import {
  LIFE_DOMAINS, IDENTITY_PRESETS, MAX_IDENTITIES, WHEEL_RECHECK_DAYS,
  getWheelScores, getLowDomains, getFocusSuggestions, wheelRecheckDue,
  saveWheelScores, setIdentities, addSuggestionAsHabit, wheelAverage,
  domainById,
} from './habitState';

const INK = '#2d2210';
const SUB = '#8a7f6f';
const FAINT = '#b3a288';
const LINE = '#e3d6c4';
const CARD = '#fffdf8';
const GOLD = '#b9842f';
const SERIF = "'Cormorant Garamond', Georgia, serif";

function WheelChart({ scores, size = 200 }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.38;
  const n = LIFE_DOMAINS.length;
  const pt = (i, r) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const gridLevels = [2, 4, 6, 8, 10];
  const dataPts = LIFE_DOMAINS.map((d, i) => {
    const val = scores[d.id] ?? 0;
    return pt(i, (val / 10) * R);
  });
  const poly = dataPts.map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="hb-wheel-svg" aria-hidden="true">
      {gridLevels.map((lv) => (
        <polygon
          key={lv}
          points={LIFE_DOMAINS.map((_, i) => { const p = pt(i, (lv / 10) * R); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="#e3d6c4" strokeWidth="1"
        />
      ))}
      {LIFE_DOMAINS.map((_, i) => {
        const p = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e3d6c4" strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(111,174,122,0.25)" stroke="#6fae7a" strokeWidth="2" />
      {LIFE_DOMAINS.map((d, i) => {
        const p = pt(i, R + 16);
        return <text key={d.id} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="14">{d.icon}</text>;
      })}
    </svg>
  );
}

export default function HabitLifeTab({ isAr, st, setSt, playSfx }) {
  const scores = useMemo(() => getWheelScores(st), [st]);
  const lowDomains = useMemo(() => getLowDomains(st, 2), [st]);
  const suggestions = useMemo(() => getFocusSuggestions(st), [st]);
  const recheckDue = useMemo(() => wheelRecheckDue(st), [st]);
  const avg = useMemo(() => wheelAverage(st), [st]);
  const hasWheel = Object.keys(scores).length > 0;

  const [draftScores, setDraftScores] = useState(() => {
    const d = {};
    LIFE_DOMAINS.forEach((dom) => { d[dom.id] = scores[dom.id] ?? 5; });
    return d;
  });
  const [editingWheel, setEditingWheel] = useState(!hasWheel || recheckDue);
  const [customId, setCustomId] = useState(st.life?.customIdentity || '');
  const selectedIds = st.life?.identities || [];

  const t = {
    identity: isAr ? 'من أصبح؟' : 'I am becoming…',
    identitySub: isAr ? 'اختر حتى هويتين — العادات أصوات لهذا الشخص.' : 'Pick up to 2 — habits are votes for this person.',
    custom: isAr ? 'أو اكتب بنفسك…' : 'Or write your own…',
    wheel: isAr ? 'عجلة الحياة' : 'Wheel of Life',
    wheelSub: isAr ? 'قيّم رضاك في كل مجال (1–10).' : 'Rate satisfaction in each area (1–10).',
    recheck: isAr ? `حان وقت المراجعة (كل ${WHEEL_RECHECK_DAYS} يوم)` : `Time to re-check (every ${WHEEL_RECHECK_DAYS} days)`,
    saveWheel: isAr ? 'حفظ العجلة' : 'Save wheel',
    editWheel: isAr ? 'تحديث العجلة' : 'Update wheel',
    focus: isAr ? 'مجالات للتركيز' : 'Focus areas',
    focusSub: isAr ? 'أقل المجالات — اقتراحات عادات صغيرة.' : 'Your lowest areas — tiny habit ideas.',
    addHabit: isAr ? 'إضافة' : 'Add',
    avg: isAr ? 'المتوسط' : 'Average',
    noWheel: isAr ? 'املأ العجلة لترى اقتراحات مخصّصة.' : 'Fill in the wheel to get personalized suggestions.',
  };

  const toggleIdentity = (id) => {
    playSfx?.('click');
    let next = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    if (next.length > MAX_IDENTITIES) next = next.slice(-MAX_IDENTITIES);
    setSt(setIdentities(next, customId));
  };

  const onSaveCustom = () => {
    setSt(setIdentities(selectedIds, customId));
  };

  const onSaveWheel = () => {
    playSfx?.('collect');
    setSt(saveWheelScores(draftScores));
    setEditingWheel(false);
  };

  const onAddSuggestion = (item) => {
    playSfx?.('collect');
    setSt(addSuggestionAsHabit(item));
  };

  return (
    <div className="hb-life">
      <section className="hb-life-section">
        <div className="hb-section-title">{t.identity}</div>
        <p className="hb-life-hint">{t.identitySub}</p>
        <div className="hb-id-grid">
          {IDENTITY_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`hb-id-chip${selectedIds.includes(p.id) ? ' on' : ''}`}
              onClick={() => toggleIdentity(p.id)}
            >
              {p.icon} {isAr ? p.ar : p.en}
            </button>
          ))}
        </div>
        <input
          className="hb-id-custom"
          value={customId}
          onChange={(e) => setCustomId(e.target.value)}
          onBlur={onSaveCustom}
          placeholder={t.custom}
        />
      </section>

      <section className="hb-life-section">
        <div className="hb-section-title">{t.wheel}</div>
        <p className="hb-life-hint">{t.wheelSub}</p>
        {recheckDue && hasWheel && !editingWheel && (
          <div className="hb-recheck-banner">{t.recheck}</div>
        )}
        {hasWheel && !editingWheel ? (
          <div className="hb-wheel-view">
            <WheelChart scores={scores} />
            {avg != null && <div className="hb-wheel-avg">{t.avg}: <b>{avg}</b>/10</div>}
            <button type="button" className="hb-btn-ghost hb-wheel-edit" onClick={() => setEditingWheel(true)}>{t.editWheel}</button>
          </div>
        ) : (
          <div className="hb-wheel-edit">
            {LIFE_DOMAINS.map((d) => (
              <label key={d.id} className="hb-wheel-row">
                <span className="hb-wheel-label">{d.icon} {isAr ? d.ar : d.en}</span>
                <input
                  type="range" min="1" max="10" step="1"
                  value={draftScores[d.id] ?? 5}
                  onChange={(e) => setDraftScores((s) => ({ ...s, [d.id]: Number(e.target.value) }))}
                />
                <span className="hb-wheel-val">{draftScores[d.id] ?? 5}</span>
              </label>
            ))}
            <button type="button" className="hb-btn-primary hb-wheel-save" onClick={onSaveWheel}>{t.saveWheel}</button>
          </div>
        )}
      </section>

      <section className="hb-life-section">
        <div className="hb-section-title">{t.focus}</div>
        <p className="hb-life-hint">{t.focusSub}</p>
        {!hasWheel && <p className="hb-life-empty">{t.noWheel}</p>}
        {lowDomains.length > 0 && (
          <div className="hb-low-tags">
            {lowDomains.map((d) => (
              <span key={d.id} className="hb-low-tag" style={{ borderColor: d.color, color: d.color }}>
                {d.icon} {isAr ? d.ar : d.en}: {d.score}/10
              </span>
            ))}
          </div>
        )}
        <div className="hb-suggest-list">
          {suggestions.map((item) => {
            const dom = domainById(item.domain);
            const title = isAr ? (item.titleAr || item.ar || item.en) : (item.titleEn || item.en);
            const tiny = isAr ? (item.tinyAr || item.tinyEn) : (item.tinyEn || item.en);
            return (
              <div key={item.id} className="hb-suggest-card" style={{ borderColor: `${dom.color}55` }}>
                <div className="hb-suggest-body">
                  <div className="hb-suggest-title">{dom.icon} {title}</div>
                  <div className="hb-suggest-tiny">{tiny}</div>
                </div>
                <button type="button" className="hb-suggest-add" style={{ color: dom.color }} onClick={() => onAddSuggestion(item)}>
                  + {t.addHabit}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export const LIFE_TAB_CSS = `
.hb-life-section { margin-bottom:22px; }
.hb-life-hint { font-size:13px; color:${SUB}; margin:0 0 12px; line-height:1.45; }
.hb-id-grid { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
.hb-id-chip { padding:10px 12px; border-radius:12px; border:2px solid ${LINE}; background:${CARD}; font-size:12px; font-weight:700; color:${SUB}; cursor:pointer; font-family:inherit; text-align:start; }
.hb-id-chip.on { border-color:${GOLD}; background:#fff8ef; color:${INK}; }
.hb-id-custom { width:100%; padding:10px 12px; border-radius:10px; border:2px solid ${LINE}; background:#fff; font-size:14px; font-family:inherit; color:${INK}; }
.hb-recheck-banner { background:#fff8ef; border:2px solid #e8c878; border-radius:10px; padding:10px 12px; font-size:12px; font-weight:700; color:#8a6010; margin-bottom:12px; }
.hb-wheel-view { display:flex; flex-direction:column; align-items:center; gap:8px; background:${CARD}; border:2px solid ${LINE}; border-radius:16px; padding:16px; }
.hb-wheel-svg { display:block; }
.hb-wheel-avg { font-size:14px; color:${SUB}; }
.hb-wheel-avg b { color:#3a7a48; font-size:18px; }
.hb-wheel-edit { margin-top:4px; }
.hb-wheel-row { display:grid; grid-template-columns:1fr 1fr auto; gap:8px; align-items:center; margin-bottom:10px; font-size:13px; }
.hb-wheel-label { font-weight:700; color:${INK}; }
.hb-wheel-val { font-weight:800; color:${GOLD}; min-width:24px; text-align:center; }
.hb-wheel-save { width:100%; margin-top:8px; }
.hb-low-tags { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
.hb-low-tag { font-size:12px; font-weight:800; padding:6px 10px; border-radius:999px; border:2px solid; background:${CARD}; }
.hb-life-empty { font-size:13px; color:${FAINT}; font-style:italic; margin-bottom:10px; }
.hb-suggest-list { display:flex; flex-direction:column; gap:8px; }
.hb-suggest-card { display:flex; align-items:center; gap:10px; background:${CARD}; border:2px solid ${LINE}; border-radius:12px; padding:12px; }
.hb-suggest-body { flex:1; min-width:0; }
.hb-suggest-title { font-size:14px; font-weight:800; color:${INK}; margin-bottom:3px; }
.hb-suggest-tiny { font-size:12px; color:${SUB}; }
.hb-suggest-add { flex-shrink:0; padding:8px 12px; border-radius:10px; border:2px solid currentColor; background:#fffaf5; font-size:12px; font-weight:800; cursor:pointer; font-family:inherit; }
.hb-section-title { font-size:12px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${SUB}; margin-bottom:6px; }
.hb-btn-ghost { padding:10px 16px; border-radius:10px; border:2px solid ${LINE}; background:transparent; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; color:${SUB}; }
.hb-btn-primary { padding:10px 20px; border-radius:10px; border:none; background:linear-gradient(135deg,#c89a4a,${GOLD}); color:#fff; font-size:13px; font-weight:800; cursor:pointer; font-family:inherit; }
`;
