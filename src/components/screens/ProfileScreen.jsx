import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { DOMAINS_BY_ID } from '../../features/training/registry';
import {
  ASSESS_DOMAINS,
  loadAssessSessions,
  loadAssessProfile,
  scoreBand,
} from '../../features/training/assessment/assessmentProfile';
import { getCampaignFloor, resetToGate, isGateBossBeaten, hasEnteredLabyrinth } from '../../features/campaign/campaignProgress';

/* ─────────────────────────────────────────────────────────────
 * PROFILE — full-bleed page in the amber/stone "world map" style.
 * Centrepiece is the 6-domain Cognitive Profile (radar + index)
 * built from saved assessment sessions, alongside XP / streak /
 * activity stats, badges and membership.
 * ──────────────────────────────────────────────────────────── */

const XP_PER_LEVEL = 200;
const AVATARS = ['🧠', '🕵️', '🦊', '🌀', '🔮', '👁️'];

const L = {
  bg: tokens.bg,
  text: tokens.text,
  textMuted: tokens.textMuted,
  amber: tokens.amber,
  paper: tokens.stone,
};

const DOMAIN_DISPLAY = {
  attention:   { en: 'Attention', ar: 'انتباه' },
  speed:       { en: 'Speed',     ar: 'سرعة' },
  memory:      { en: 'Memory',    ar: 'ذاكرة' },
  language:    { en: 'Language',  ar: 'لغة' },
  reasoning:   { en: 'Logic',     ar: 'تفكير' },
  flexibility: { en: 'Flex',      ar: 'مرونة' },
};

const BAND = {
  high: { col: tokens.runeSage, en: 'Strong', ar: 'قوي' },
  mid:  { col: tokens.amber,    en: 'Steady', ar: 'متوسط' },
  low:  { col: '#d4694a',       en: 'Growing', ar: 'ينمو' },
};

const getLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
const xpToNext = (xp) => XP_PER_LEVEL - (xp % XP_PER_LEVEL);

/* ── Shared bits ──────────────────────────────────────────── */

function SectionDivider({ label, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(232,172,78,0.28)' }} />
      <div style={{ fontSize: 10, letterSpacing: 3, color: accent || L.amber, fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: 'rgba(232,172,78,0.28)' }} />
    </div>
  );
}

const stoneCard = {
  background: 'linear-gradient(180deg, rgba(31,22,12,0.92) 0%, rgba(21,14,8,0.92) 100%)',
  border: '1px solid rgba(232,172,78,0.22)',
  borderRadius: 14,
  boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
};

/* ── Cognitive radar ──────────────────────────────────────── */

const R = 96, CX = 150, CY = 142;
const axisPt = (i, frac) => {
  const ang = ((-90 + i * 60) * Math.PI) / 180;
  return [CX + Math.cos(ang) * R * frac, CY + Math.sin(ang) * R * frac];
};

function CognitiveRadar({ scores, index, isAr }) {
  const rings = [0.25, 0.5, 0.75, 1];
  const hasData = index != null;
  const polyPoints = ASSESS_DOMAINS
    .map((d, i) => axisPt(i, Math.max(0, Math.min(100, scores[d] ?? 0)) / 100))
    .map((p) => p.join(','))
    .join(' ');

  return (
    <svg width="100%" viewBox="0 0 300 300" style={{ display: 'block', maxWidth: 320, margin: '0 auto' }}>
      {/* grid rings */}
      {rings.map((f, ri) => (
        <polygon
          key={ri}
          points={ASSESS_DOMAINS.map((_, i) => axisPt(i, f).join(',')).join(' ')}
          fill="none"
          stroke="rgba(232,172,78,0.16)"
          strokeWidth="1"
        />
      ))}
      {/* spokes */}
      {ASSESS_DOMAINS.map((d, i) => {
        const [x, y] = axisPt(i, 1);
        return <line key={d} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(232,172,78,0.16)" strokeWidth="1" />;
      })}

      {/* score polygon */}
      {hasData && (
        <>
          <polygon points={polyPoints} fill="rgba(232,172,78,0.22)" stroke={L.amber} strokeWidth="1.8" strokeLinejoin="round" />
          {ASSESS_DOMAINS.map((d, i) => {
            const [x, y] = axisPt(i, Math.max(0, Math.min(100, scores[d] ?? 0)) / 100);
            const col = DOMAINS_BY_ID[d]?.color ?? L.amber;
            return <circle key={d} cx={x} cy={y} r="3.4" fill={col} stroke="#150e08" strokeWidth="1" />;
          })}
        </>
      )}

      {/* axis labels */}
      {ASSESS_DOMAINS.map((d, i) => {
        const ang = ((-90 + i * 60) * Math.PI) / 180;
        const lx = CX + Math.cos(ang) * (R + 24);
        const ly = CY + Math.sin(ang) * (R + 24);
        const cos = Math.cos(ang);
        const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
        const col = DOMAINS_BY_ID[d]?.color ?? L.amber;
        return (
          <text
            key={d}
            x={lx}
            y={ly + 3}
            textAnchor={anchor}
            fill={col}
            style={{ fontSize: 11, fontWeight: 700, fontFamily: isAr ? "'Cairo',sans-serif" : "'Nunito',sans-serif" }}
          >
            {isAr ? DOMAIN_DISPLAY[d].ar : DOMAIN_DISPLAY[d].en}
          </text>
        );
      })}

      {/* centre index */}
      <text x={CX} y={CY - 4} textAnchor="middle" fill={hasData ? '#fff' : L.textMuted}
        style={{ fontSize: 34, fontWeight: 400, fontFamily: "'Fredoka One', cursive" }}>
        {hasData ? index : '—'}
      </text>
      <text x={CX} y={CY + 14} textAnchor="middle" fill={L.textMuted}
        style={{ fontSize: 8.5, letterSpacing: 2, fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}>
        {isAr ? 'المؤشر' : 'INDEX'}
      </text>
    </svg>
  );
}

/* ── Component ────────────────────────────────────────────── */

export default function ProfileScreen() {
  const { globalXP, profileData, setProfileData, saveProfile, playSfx, switchTab, toggleLang, currentLang, openPaywall } = useApp();
  const [gateDone, setGateDone] = useState(() => isGateBossBeaten());
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const [showPicker, setShowPicker] = useState(false);

  const lv = getLevel(globalXP);
  const pct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  const sessions = loadAssessSessions();
  const latest = sessions.length ? sessions[sessions.length - 1] : null;
  const prev = sessions.length > 1 ? sessions[sessions.length - 2] : null;
  const scores = latest?.scores ?? {};
  const index = latest?.overall ?? null;
  const trend = latest && prev && latest.overall != null && prev.overall != null ? latest.overall - prev.overall : null;
  const assessProfile = loadAssessProfile();

  const lastDate = latest ? new Date(latest.ts).toLocaleDateString(isAr ? 'ar' : 'en', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  function setAvatar(emoji) {
    playSfx('click');
    const updated = { ...profileData, avatar: emoji };
    setProfileData(updated);
    saveProfile(updated, globalXP);
    setShowPicker(false);
  }

  const badges = [
    { id: 'explorer', icon: '🗺️', en: 'Explorer', ar: 'مستكشف', unlocked: globalXP >= 50 },
    { id: 'maze', icon: '🌀', en: 'Maze Runner', ar: 'عدّاء المتاهة', unlocked: globalXP >= 100 },
    { id: 'master', icon: '🧠', en: 'Mind Master', ar: 'سيّد العقل', unlocked: globalXP >= 300 },
    { id: 'assessed', icon: '📡', en: 'Assessed', ar: 'تم التقييم', unlocked: !!latest },
  ];

  const statCells = [
    { glyph: '🔥', val: profileData.streak ?? 0, label: isAr ? 'سلسلة' : 'streak', accent: true },
    { glyph: '★', val: lv, label: isAr ? 'مستوى' : 'level', accent: true },
    { glyph: '⚡', val: globalXP, label: isAr ? 'نقاط' : 'xp' },
    { glyph: '◆', val: Math.floor(globalXP / 10), label: isAr ? 'شظايا' : 'shards' },
  ];

  const activity = [
    { val: sessions.length, label: isAr ? 'تدريب' : 'training' },
    { val: profileData.puzzlesSolved || 0, label: isAr ? 'ألغاز' : 'puzzles' },
  ];

  return (
    <div
      className={`app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}
      style={{
        position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
        ...chrome.shell, fontFamily: 'Outfit, system-ui, sans-serif', isolation: 'isolate',
      }}
    >
      <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 110 }}>
        <AtmosphericBackground strength="panel" photo={false} />

        {/* Top bar */}
        <div className="app-chrome-bar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '64px 18px 8px', position: 'relative', zIndex: 5,
        }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <button type="button" style={chrome.chromeBtn} onClick={() => { playSfx('click'); switchTab('other'); }} aria-label={isAr ? 'رجوع' : 'Back'}>
              <IconBack size={18} c={chrome.text} />
            </button>
          </div>
          <div style={{ ...chrome.title, fontSize: isAr ? 24 : 22 }}>
            {isAr ? 'الملف' : 'Profile'}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" style={chrome.langBtn} onClick={() => { playSfx('click'); toggleLang(); }}>
              {isAr ? 'EN' : 'عر'}
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 4, maxWidth: 460, margin: '0 auto', padding: '0 16px' }}>

          {/* Identity */}
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <button type="button" onClick={() => { playSfx('click'); setShowPicker((v) => !v); }} style={{
              position: 'relative', width: 96, height: 96, borderRadius: '50%', cursor: 'pointer',
              border: '2px solid rgba(232,172,78,0.6)', background: 'radial-gradient(circle at 50% 35%, rgba(232,172,78,0.22), rgba(20,12,6,0.9))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, margin: '0 auto',
              boxShadow: '0 0 26px rgba(232,172,78,0.35), inset 0 2px 6px rgba(0,0,0,0.5)',
            }}>
              {profileData.avatar}
              <span style={{
                position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(170deg, #5e2a0c, #3e1a06)', border: '1.5px solid #9a6828',
                color: L.amber, fontFamily: "'Bangers', cursive", fontSize: 12, letterSpacing: 1,
                padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
              }}>{isAr ? `مستوى ${lv}` : `LVL ${lv}`}</span>
            </button>

            {showPicker && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {AVATARS.map((e) => (
                  <button key={e} type="button" onClick={() => setAvatar(e)} style={{
                    fontSize: 24, width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
                    background: profileData.avatar === e ? 'rgba(232,172,78,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${profileData.avatar === e ? L.amber : 'rgba(232,172,78,0.25)'}`,
                  }}>{e}</button>
                ))}
              </div>
            )}

            <div style={{
              marginTop: 18, fontFamily: isAr ? "'Cairo',sans-serif" : "'Outfit', system-ui, sans-serif",
              fontSize: 22, fontWeight: 800, color: chrome.text,
            }}>{profileData.username}</div>
            {assessProfile.age != null && (
              <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2 }}>
                {isAr ? `العمر ${assessProfile.age}` : `Age ${assessProfile.age}`}
              </div>
            )}

            {/* XP bar */}
            <div style={{ maxWidth: 300, margin: '14px auto 0' }}>
              <div style={{ height: 8, borderRadius: 6, background: 'rgba(0,0,0,0.5)', boxShadow: 'inset 0 0 0 1px rgba(232,172,78,0.25)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(4, pct)}%`, height: '100%', background: `linear-gradient(90deg, ${L.amber}, #ffd47e)`, boxShadow: '0 0 10px rgba(232,172,78,0.7)' }} />
              </div>
              <div style={{ fontSize: 10.5, color: L.textMuted, marginTop: 6, letterSpacing: 0.5 }}>
                {globalXP % XP_PER_LEVEL} / {XP_PER_LEVEL} XP · {xpToNext(globalXP)} {isAr ? `للمستوى ${lv + 1}` : `to level ${lv + 1}`}
              </div>
            </div>
          </div>

          {/* Stat scroll */}
          <div style={{
            display: 'flex', alignItems: 'stretch', gap: 8, padding: '12px 10px', borderRadius: 8, marginTop: 22,
            background: 'linear-gradient(170deg, #3e1a06 0%, #5e2a0c 50%, #3e1a06 100%)',
            border: '1.5px solid #9a6828',
            boxShadow: 'inset 0 1px 0 rgba(220,170,70,0.35), inset 0 -1px 0 rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.6)',
          }}>
            {statCells.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div style={{ width: 2, background: 'rgba(220,170,70,0.28)', borderRadius: 1 }} />}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Fredoka One', sans-serif", fontSize: 16, color: s.accent ? L.amber : L.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, lineHeight: 1 }}>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>{s.glyph}</span>{s.val}
                  </div>
                  <div style={{ fontSize: 8, color: L.textMuted, letterSpacing: 1.3, marginTop: 4, textTransform: 'uppercase', fontWeight: 800 }}>{s.label}</div>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Cognitive profile */}
          <div style={{ marginTop: 28 }}>
            <SectionDivider label={isAr ? 'الملف الإدراكي' : 'Cognitive Profile'} accent={chrome.accent} />
            <div style={{ ...stoneCard, padding: '14px 14px 18px' }}>
              <CognitiveRadar scores={scores} index={index} isAr={isAr} />

              {latest ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {ASSESS_DOMAINS.map((d) => {
                      const v = scores[d];
                      const has = typeof v === 'number';
                      const band = BAND[scoreBand(v)];
                      const col = DOMAINS_BY_ID[d]?.color ?? L.amber;
                      return (
                        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `${col}22`, border: `1px solid ${col}66`, color: col, fontSize: 13, fontWeight: 700,
                          }}>{DOMAINS_BY_ID[d]?.glyph ?? '•'}</span>
                          <span style={{ width: 78, flexShrink: 0, fontSize: 12, color: L.text, fontFamily: isAr ? "'Cairo',sans-serif" : 'inherit' }}>
                            {isAr ? DOMAIN_DISPLAY[d].ar : DOMAIN_DISPLAY[d].en}
                          </span>
                          <span style={{ flex: 1, height: 6, borderRadius: 4, background: 'rgba(0,0,0,0.45)', overflow: 'hidden' }}>
                            <span style={{ display: 'block', width: `${has ? v : 0}%`, height: '100%', background: col, boxShadow: `0 0 8px ${col}` }} />
                          </span>
                          <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700, color: has ? '#fff' : L.textMuted }}>{has ? v : '—'}</span>
                          <span style={{ width: 52, textAlign: 'right', fontSize: 9, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: has ? band.col : L.textMuted }}>
                            {has ? (isAr ? band.ar : band.en) : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 10.5, color: L.textMuted }}>
                    <span>{isAr ? `آخر تقييم · ${lastDate}` : `Last assessed · ${lastDate}`}</span>
                    {trend != null && trend !== 0 && (
                      <span style={{ color: trend > 0 ? tokens.runeSage : '#d4694a', fontWeight: 800 }}>
                        {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '4px 8px 6px' }}>
                  <div style={{ fontSize: 13, color: L.text, fontWeight: 600, marginBottom: 6 }}>
                    {isAr ? 'لا يوجد تقييم بعد' : 'No assessment yet'}
                  </div>
                  <div style={{ fontSize: 11.5, color: L.textMuted, lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
                    {isAr
                      ? 'افتح التدريب وابدأ التقييم لكشف ملفك الإدراكي عبر الميادين الستة.'
                      : 'Open Training and start the assessment to reveal your six-domain cognitive profile.'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div style={{ marginTop: 28 }}>
            <SectionDivider label={isAr ? 'النشاط' : 'Activity'} accent={chrome.accent} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {activity.map((a) => (
                <div key={a.label} style={{ ...stoneCard, padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 24, color: L.amber, lineHeight: 1 }}>{a.val}</div>
                  <div style={{ fontSize: 9, color: L.textMuted, letterSpacing: 1.3, marginTop: 6, textTransform: 'uppercase', fontWeight: 800 }}>{a.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div style={{ marginTop: 28 }}>
            <SectionDivider label={isAr ? 'الأوسمة' : 'Badges'} accent={chrome.accent} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {badges.map((b) => (
                <div key={b.id} style={{
                  ...stoneCard, padding: '12px 4px', textAlign: 'center',
                  opacity: b.unlocked ? 1 : 0.4, filter: b.unlocked ? 'none' : 'grayscale(1)',
                }}>
                  <div style={{ fontSize: 26, lineHeight: 1 }}>{b.unlocked ? b.icon : '🔒'}</div>
                  <div style={{ fontSize: 8.5, color: L.text, letterSpacing: 0.5, marginTop: 6, fontWeight: 700, fontFamily: isAr ? "'Cairo',sans-serif" : 'inherit' }}>
                    {isAr ? b.ar : b.en}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Labyrinth campaign */}
          <div style={{ marginTop: 28 }}>
            <SectionDivider label={isAr ? 'المتاهة' : 'Labyrinth'} />
            <div style={{ ...stoneCard, padding: 16 }}>
              <div style={{ fontSize: 13, color: L.text, lineHeight: 1.6, marginBottom: 12 }}>
                {hasEnteredLabyrinth()
                  ? (isAr ? '✓ دخلت المتاهة الكبيرة' : '✓ Entered the big labyrinth')
                  : gateDone
                    ? (isAr ? '● البوابة مفتوحة — ادخل من البوابة' : '● Gate open — use the portal')
                    : (isAr ? '● ابدأ من البوابة الخارجية (الغرفة الصغيرة)' : '● Start at the Outer Gate (small room)')}
              </div>
              <button
                type="button"
                onClick={() => {
                  playSfx('click');
                  resetToGate();
                  setGateDone(false);
                }}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10, cursor: 'pointer',
                  border: '1.5px solid rgba(232,172,78,0.35)', background: 'rgba(0,0,0,0.25)',
                  color: L.amber, fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers', cursive",
                  fontSize: isAr ? 13 : 15, letterSpacing: isAr ? 0 : 1,
                }}
              >
                {isAr ? '↺ إعادة البوابة الخارجية' : '↺ Replay Outer Gate'}
              </button>
            </div>
          </div>

          {/* Membership */}
          <div style={{ marginTop: 28 }}>
            <SectionDivider label={isAr ? 'العضوية' : 'Membership'} accent={chrome.accent} />
            <div style={{ ...stoneCard, padding: 16 }}>
              <div style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers', cursive", fontSize: isAr ? 16 : 18, letterSpacing: isAr ? 0 : 1.5, color: L.amber }}>
                {isAr ? 'مستكشف مجاني' : 'Free Explorer'}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 16px', fontSize: 12.5, color: L.text, lineHeight: 2 }}>
                <li>✅ {isAr ? '٤ إصدارات كوميكس مجانية' : '4 free comic issues'}</li>
                <li>✅ {isAr ? 'الحلقة الأولى' : 'Video episode 1'}</li>
                <li>✅ {isAr ? 'الوصول للمتاهة' : 'Maze game access'}</li>
                <li style={{ color: L.textMuted }}>🔒 {isAr ? 'كوميكس مميّزة (٥–٨)' : 'Premium comics (vol. 5–8)'}</li>
                <li style={{ color: L.textMuted }}>🔒 {isAr ? 'فيديوهات حصرية' : 'Exclusive videos & interviews'}</li>
              </ul>
              <button type="button" onClick={openPaywall} style={{
                width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
                border: '1.5px solid #9a6828', background: `linear-gradient(170deg, ${L.amber}, #c98a2e)`,
                color: '#2a1a06', fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers', cursive",
                fontSize: isAr ? 14 : 16, letterSpacing: isAr ? 0 : 1.5, fontWeight: isAr ? 800 : 400,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}>
                ⭐ {isAr ? 'الترقية — $4.99/شهر' : 'Go Premium — $4.99/mo'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
