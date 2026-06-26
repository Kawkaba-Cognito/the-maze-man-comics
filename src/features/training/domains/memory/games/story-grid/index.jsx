import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { createTrialLog } from '../../../../shared/trialLog';
import CosmosCharacter from '../../../../../character/CosmosCharacter';

/*
 * Story Time — a story-sequencing memory game (the comic-app take on temporal
 * working memory / the classic Picture-Arrangement task).
 *
 * A short illustrated STORY plays one panel at a time — Sam eats, his parents
 * arrive, he's told to study … The panels are then shuffled into a tray and the
 * player rebuilds the story IN ORDER. To do that you must hold the SEQUENCE you
 * just watched (temporal-order memory; hippocampus + prefrontal cortex), not the
 * spatial layout. Harder rounds add more panels, faster telling, and decoy
 * scenes that never happened (filtering).
 *
 * Wrapped in the shared 3-mode flow (Survival / Levels / Pass n Play).
 */

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const CHAL_TRIALS = 5;
const SURV_LIVES = 3;

// The story stars KAWKAB — the planet mascot (CosmosCharacter) — doing everyday
// things. Each panel = Kawkab + a prop (the action) + a short caption. The
// recurring character makes the panels read as ONE story; the prop/caption is
// what the player actually has to sequence. Language-free (prop carries it).
// `mood` tints Kawkab's eyes so scenes feel emotionally distinct.
const KAWKAB = { en: 'Kawkab', ar: 'كوكب' };
// `anim` picks one of the shared motion primitives below — during the WATCH
// phase Kawkab actually performs the action (sways to dance, tilts to sleep,
// bobs to eat …). The choices/grid use the same scenes as clean static poses.
const SCENES = [
  { e: '🪩', en: 'dances', ar: 'يرقص', mood: 'proud', anim: 'sway', perform: 'dance' },
  { e: '😴', en: 'sleeps', ar: 'ينام', mood: 'tired', anim: 'sleep', perform: 'sleep' },
  { e: '🍽️', en: 'eats', ar: 'يأكل', mood: 'ready', anim: 'eat', perform: 'eat' },
  { e: '📚', en: 'studies', ar: 'يدرس', mood: 'focused', anim: 'study' },
  { e: '⚽', en: 'plays ball', ar: 'يلعب الكرة', mood: 'ready', anim: 'bounce', perform: 'play' },
  { e: '🛁', en: 'takes a bath', ar: 'يستحمّ', mood: 'ready', anim: 'sway' },
  { e: '🦷', en: 'brushes teeth', ar: 'يفرّش أسنانه', mood: 'ready', anim: 'bounce' },
  { e: '🚌', en: 'rides the bus', ar: 'يركب الحافلة', mood: 'ready', anim: 'sway' },
  { e: '🎨', en: 'paints', ar: 'يرسم', mood: 'proud', anim: 'study' },
  { e: '🐕', en: 'walks the dog', ar: 'يمشّي الكلب', mood: 'ready', anim: 'bounce' },
  { e: '🛒', en: 'goes shopping', ar: 'يتسوّق', mood: 'ready', anim: 'sway' },
  { e: '🎮', en: 'plays games', ar: 'يلعب ألعاباً', mood: 'ready', anim: 'bounce' },
  { e: '🚲', en: 'rides a bike', ar: 'يركب الدراجة', mood: 'ready', anim: 'sway' },
  { e: '🍿', en: 'watches a movie', ar: 'يشاهد فيلماً', mood: 'ready', anim: 'eat' },
  { e: '🎂', en: 'has cake', ar: 'يأكل الكعكة', mood: 'proud', anim: 'eat' },
  { e: '☂️', en: 'walks in rain', ar: 'يمشي تحت المطر', mood: 'tired', anim: 'sway' },
  { e: '🏊', en: 'swims', ar: 'يسبح', mood: 'ready', anim: 'sway' },
  { e: '🎵', en: 'listens to music', ar: 'يستمع للموسيقى', mood: 'proud', anim: 'sway' },
  { e: '✏️', en: 'does homework', ar: 'يحل واجبه', mood: 'focused', anim: 'study' },
  { e: '🧹', en: 'cleans up', ar: 'ينظّف', mood: 'focused', anim: 'sway' },
  { e: '🌱', en: 'plants a seed', ar: 'يزرع بذرة', mood: 'ready', anim: 'study', perform: 'plant' },
  { e: '🎁', en: 'gets a gift', ar: 'يتلقّى هدية', mood: 'proud', anim: 'spin' },
  { e: '🍳', en: 'cooks', ar: 'يطبخ', mood: 'focused', anim: 'study' },
];

// Shared motion primitives (transform/opacity only — cheap, no mobile jank).
const ANIM = {
  bounce: { char: 'sg-bounce', dur: '0.7s', prop: 'sg-pop', pdur: '0.7s' },
  sway:   { char: 'sg-sway',   dur: '1.1s', prop: 'sg-pop', pdur: '1.1s' },
  sleep:  { char: 'sg-sleep',  dur: '2.6s', prop: 'sg-float', pdur: '2.6s' },
  eat:    { char: 'sg-eat',    dur: '0.55s', prop: 'sg-pop', pdur: '0.55s' },
  study:  { char: 'sg-study',  dur: '1.6s', prop: 'sg-pop', pdur: '1.6s' },
  spin:   { char: 'sg-spin',   dur: '1.2s', prop: 'sg-pop', pdur: '0.8s' },
};
const ANIM_CSS = `
@keyframes sg-bounce {0%,100%{transform:translateY(0)}30%{transform:translateY(-15%)}55%{transform:translateY(0)}}
@keyframes sg-sway {0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
@keyframes sg-sleep {0%,100%{transform:rotate(9deg) scale(1)}50%{transform:rotate(9deg) scale(1.05)}}
@keyframes sg-eat {0%,100%{transform:translateY(0)}50%{transform:translateY(9%)}}
@keyframes sg-study {0%,100%{transform:rotate(-7deg) translateY(0)}50%{transform:rotate(-4deg) translateY(4%)}}
@keyframes sg-spin {0%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.06)}100%{transform:rotate(-8deg) scale(1)}}
@keyframes sg-pop {0%,100%{transform:scale(1)}50%{transform:scale(1.22)}}
@keyframes sg-float {0%{transform:translateY(20%);opacity:.3}40%{opacity:1}100%{transform:translateY(-75%);opacity:0}}
@keyframes sg-food {0%{transform:translate(26px,40px) scale(1);opacity:0}15%{opacity:1}60%{transform:translate(0,8px) scale(0.62);opacity:1}80%{transform:translate(0,8px) scale(0.12);opacity:0}100%{opacity:0}}
@keyframes sg-seed {0%{transform:translate(-50%,-8px) scale(1);opacity:0}12%{opacity:1}48%{transform:translate(-50%,52px) scale(0.85);opacity:1}58%{opacity:0}100%{opacity:0}}
@keyframes sg-sprout {0%,48%{transform:translateX(-50%) scaleY(0);opacity:0}58%{opacity:1}92%{transform:translateX(-50%) scaleY(1);opacity:1}100%{transform:translateX(-50%) scaleY(1);opacity:0}}
@keyframes sg-note {0%{transform:translate(0,8px) rotate(-12deg);opacity:0}25%{opacity:1}100%{transform:translate(0,-46px) rotate(12deg);opacity:0}}
@keyframes sg-ball {0%,100%{transform:translateX(-50%) translateY(-46px)}50%{transform:translateX(-50%) translateY(-2px)}}
`;

// PROOF scope (survival only): the actions with hand-made choreography. Survival
// draws from these so you actually SEE Kawkab perform. Expand this set, then drop
// the survival-pool restriction, once the look is approved.
const PERFORM_IDS = SCENES.map((s, i) => (s.perform ? i : -1)).filter((i) => i >= 0);

// Kawkab PERFORMING one scene — character + animated scene elements choreographed
// so the action actually reads (food to mouth, seed → sprout, notes for dancing…).
function KawkabStage({ scene, size = 116 }) {
  const box = { position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const baseChar = (anim) => (
    <div style={{ animation: anim, transformOrigin: 'center bottom' }}>
      <CosmosCharacter faceOnly size={size} mood={scene.mood} glow />
    </div>
  );
  const el = (emoji, st) => <span style={{ position: 'absolute', fontSize: 30, lineHeight: 1, pointerEvents: 'none', ...st }}>{emoji}</span>;
  switch (scene.perform) {
    case 'eat':
      return <div style={box}>{baseChar('sg-eat 0.55s ease-in-out infinite')}{el('🍔', { insetInlineEnd: 4, bottom: 0, animation: 'sg-food 0.95s ease-in-out infinite' })}</div>;
    case 'sleep':
      return <div style={box}>{baseChar('sg-sleep 2.6s ease-in-out infinite')}{el('💤', { insetInlineEnd: 8, top: 4, animation: 'sg-float 2.4s ease-in-out infinite' })}{el('💤', { insetInlineEnd: 22, top: 12, fontSize: 20, animation: 'sg-float 2.4s ease-in-out 1.1s infinite' })}</div>;
    case 'plant':
      return <div style={box}>{baseChar('sg-study 1.8s ease-in-out infinite')}{el('🌰', { insetInlineStart: '50%', top: 6, animation: 'sg-seed 2.2s ease-in-out infinite' })}{el('🌱', { insetInlineStart: '50%', bottom: -4, transformOrigin: 'bottom center', animation: 'sg-sprout 2.2s ease-in-out infinite' })}</div>;
    case 'dance':
      return <div style={box}>{baseChar('sg-sway 0.9s ease-in-out infinite')}{el('🎵', { insetInlineStart: 2, bottom: 22, animation: 'sg-note 1.4s ease-in-out infinite' })}{el('🎶', { insetInlineEnd: 2, bottom: 16, animation: 'sg-note 1.4s ease-in-out 0.7s infinite' })}</div>;
    case 'play':
      return <div style={box}>{baseChar('sg-bounce 0.7s ease-in-out infinite')}{el('⚽', { insetInlineStart: '50%', top: 0, animation: 'sg-ball 0.7s ease-in-out infinite' })}</div>;
    default: {
      const a = ANIM[scene.anim] || ANIM.bounce;
      return <div style={box}>{baseChar(`${a.char} ${a.dur} ease-in-out infinite`)}{el(scene.e, { insetInlineEnd: -4, bottom: -4, fontSize: 34 })}</div>;
    }
  }
}

// Difficulty = STORY LENGTH (panels to order) + how fast it's told + DECOY
// scenes mixed into the tray. Endpoints stay distinct across tiers.
const BASE = {
  easy: { l0: 3, l1: 4, d0: 0, d1: 0, spd0: 1200, spd1: 1000 },
  med:  { l0: 4, l1: 6, d0: 0, d1: 1, spd0: 1100, spd1: 850 },
  hard: { l0: 5, l1: 8, d0: 1, d1: 2, spd0: 1000, spd1: 720 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = Math.pow(clamp(((level || 1) - 1) / 99, 0, 1), 0.85);
  return {
    L: Math.round(lerp(b.l0, b.l1, f)),
    decoys: Math.round(lerp(b.d0, b.d1, f)),
    speed: Math.round(lerp(b.spd0, b.spd1, f)),
  };
}
function survivalCfg(boardIdx) {
  return {
    L: Math.min(8, 3 + Math.floor(boardIdx / 2)),
    decoys: Math.min(2, Math.floor(boardIdx / 4)),
    // Survival shows Kawkab performing each beat, so hold each panel long enough
    // for the motion to read; still ramps faster as you climb.
    speed: Math.max(900, 1450 - boardIdx * 32),
  };
}
function passCfgFor() { return { L: 5, decoys: 1, speed: 950 }; }

function buildRound(cfg, rng, pool0) {
  const pool = (pool0 ? [...pool0] : SCENES.map((_, i) => i));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const L = Math.min(cfg.L, pool.length);
  const dn = Math.min(cfg.decoys || 0, Math.max(0, pool.length - L));
  const order = pool.slice(0, L);                       // the story, in order
  const decoys = pool.slice(L, L + dn);
  const tray = [...order, ...decoys];
  for (let i = tray.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [tray[i], tray[j]] = [tray[j], tray[i]]; }
  return { cfg: { ...cfg, L, decoys: dn }, order, decoys, tray };
}

function StoryEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const isSurvival = mode === 'free';
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? CHAL_TRIALS) : 0;

  const [phase, setPhase] = useState('watch');     // watch · place · reveal
  const [watchIdx, setWatchIdx] = useState(0);     // current panel during watch
  const [round, setRound] = useState(null);
  const [placed, setPlaced] = useState([]);        // sceneIds the player has slotted, in order
  const [correctCount, setCorrectCount] = useState(0);

  const [lives, setLives] = useState(SURV_LIVES);
  const [score, setScore] = useState(0);
  const [boards, setBoards] = useState(0);
  const [over, setOver] = useState(null);

  const roundRef = useRef(null);
  const timersRef = useRef([]);
  const placeStartRef = useRef(0);
  const trialLogRef = useRef(null);
  const livesRef = useRef(SURV_LIVES);
  const scoreRef = useRef(0);
  const boardsRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppHitRef = useRef(0);
  const endedRef = useRef(false);

  const push = (id) => { timersRef.current.push(id); return id; };
  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = []; }, []);

  const cfgFor = useCallback(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return passCfgFor();
    return survivalCfg(boardsRef.current);
  }, [mode, diff, level]);

  const startRound = useCallback(() => {
    clearTimers();
    const cfg = cfgFor();
    // Survival (the animated proof) draws from the hand-choreographed actions.
    const r = buildRound(cfg, rng, isSurvival ? PERFORM_IDS : null);
    roundRef.current = r;
    setRound(r);
    setPlaced([]);
    setCorrectCount(0);
    setWatchIdx(0);
    setPhase('watch');
    const len = r.cfg.L;
    // Tell the story: reveal one panel at a time, then hand the deck to the player.
    let i = 0;
    const step = () => {
      setWatchIdx(i);
      playSfx?.('click');
      i += 1;
      if (i < len) push(setTimeout(step, cfg.speed));
      else push(setTimeout(() => { placeStartRef.current = performance.now(); setPhase('place'); }, cfg.speed));
    };
    push(setTimeout(step, 650));
  }, [cfgFor, rng, clearTimers, playSfx]);

  const finishSurvival = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    clearTimers();
    trialLogRef.current?.finish({ boards: boardsRef.current, score: scoreRef.current });
    setOver({ score: scoreRef.current, boards: boardsRef.current });
    playSfx?.('lose');
  }, [clearTimers, playSfx]);

  const finishRound = useCallback((won, nCorrect) => {
    const r = roundRef.current;
    if (!r) return;
    if (mode === 'levels') {
      endedRef.current = true;
      const sc = won ? Math.max(40, 220 - Math.round((performance.now() - placeStartRef.current) / 80)) : nCorrect * 20;
      trialLogRef.current?.finish({ won, len: r.cfg.L, correct: nCorrect });
      onResult({ won, score: sc, summary: won
        ? (isAr ? `قصة من ${r.cfg.L} لوحات ✓` : `${r.cfg.L}-panel story ✓`)
        : (isAr ? `${nCorrect}/${r.cfg.L} في مكانها` : `${nCorrect}/${r.cfg.L} in place`) });
      return;
    }
    if (mode === 'passplay') {
      ppDoneRef.current += 1;
      if (won) ppHitRef.current += 1;
      if (ppDoneRef.current >= ppTrials) {
        endedRef.current = true;
        trialLogRef.current?.finish({ hits: ppHitRef.current, trials: ppTrials });
        onResult({ score: ppHitRef.current });
        return;
      }
      startRound();
      return;
    }
    // survival
    if (won) {
      awardPoints?.(3);
      scoreRef.current += 10 + r.cfg.L * 3; setScore(scoreRef.current);
      boardsRef.current += 1; setBoards(boardsRef.current);
      startRound();
    } else {
      livesRef.current = Math.max(0, livesRef.current - 1); setLives(livesRef.current);
      if (livesRef.current <= 0) finishSurvival();
      else startRound();
    }
  }, [mode, ppTrials, onResult, isAr, startRound, awardPoints, finishSurvival]);

  const check = useCallback(() => {
    if (phase !== 'place') return;
    const r = roundRef.current;
    if (!r || placed.length !== r.cfg.L) return;
    let n = 0;
    for (let i = 0; i < r.order.length; i++) if (placed[i] === r.order[i]) n += 1;
    const won = n === r.order.length;
    setCorrectCount(n);
    setPhase('reveal');
    playSfx?.(won ? 'win' : 'error');
    trialLogRef.current?.trial({ ok: won, len: r.cfg.L, correct: n, rt: Math.round(performance.now() - placeStartRef.current) });
    push(setTimeout(() => finishRound(won, n), 1900));
  }, [phase, placed, playSfx, finishRound]);

  const place = (id) => { if (phase === 'place' && placed.length < roundRef.current.cfg.L && !placed.includes(id)) { playSfx?.('click'); setPlaced((p) => [...p, id]); } };
  const unplace = (idx) => { if (phase === 'place') { playSfx?.('click'); setPlaced((p) => p.filter((_, i) => i !== idx)); } };

  const boot = useCallback(() => {
    endedRef.current = false;
    livesRef.current = SURV_LIVES; scoreRef.current = 0; boardsRef.current = 0;
    ppDoneRef.current = 0; ppHitRef.current = 0;
    setLives(SURV_LIVES); setScore(0); setBoards(0); setOver(null);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'story-grid', mode, meta: { diff, level } });
    startRound();
  }, [mode, diff, level, startRound]);

  useEffect(() => {
    boot();
    return () => { clearTimers(); trialLogRef.current?.discard(); trialLogRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const S = styles;

  if (over && isSurvival) {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={S.overWrap}>
          <h2 style={S.overTitle}>{isAr ? 'انتهت المحاولة!' : 'Run ended!'}</h2>
          <p style={S.overSub}>{isAr ? `${over.boards} قصة · ${over.score} نقطة` : `${over.boards} stories · ${over.score} pts`}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <button type="button" style={S.overBtn} onClick={() => { playSfx?.('click'); boot(); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
            <button type="button" style={S.overBtnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!round) return <div style={S.root} dir={isAr ? 'rtl' : 'ltr'} />;
  const cfg = round.cfg;
  const cap = (s) => (isAr ? s.ar : s.en);

  const headerSub = mode === 'passplay'
    ? `${isAr ? 'قصة' : 'Story'} ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials}`
    : isSurvival ? `${isAr ? 'قصص' : 'Stories'} ${boards}` : `${isAr ? 'مستوى' : 'Lvl'} ${level}`;

  // Panel card — Kawkab (the planet mascot) acting out one scene + its prop.
  // When `animate` is set (the survival watch phase, for now), Kawkab PERFORMS
  // the action; otherwise he holds a clean static pose for the choices/grid.
  const Panel = ({ sceneId, size = 'md', badge, style, animate = false }) => {
    const sc = SCENES[sceneId];
    const big = size === 'lg';
    const live = animate && big;
    return (
      <div style={{ ...(big ? S.panelLg : S.panel), ...style }}>
        {badge != null && <span style={S.panelBadge}>{badge}</span>}
        {live ? (
          <KawkabStage scene={sc} size={116} />
        ) : (
          <div style={S.charWrap}>
            <CosmosCharacter faceOnly size={big ? 116 : 46} mood={sc.mood} glow={big} />
            <span style={big ? S.propLg : S.prop}>{sc.e}</span>
          </div>
        )}
        <span style={big ? S.captionLg : S.caption}>{big ? `${isAr ? KAWKAB.ar : KAWKAB.en} ${cap(sc)}` : cap(sc)}</span>
      </div>
    );
  };

  const trayRemaining = round.tray.filter((id) => !placed.includes(id));

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'وقت القصة' : 'Story Time'}</div>
          <div className="ct-training-play-sub">{headerSub}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div style={S.statusRow}>
        <span style={S.phaseTag}>
          {phase === 'watch'
            ? (isAr ? '📖 شاهد القصة…' : '📖 Watch the story…')
            : phase === 'place'
              ? (isAr ? '🔢 رتّب اللوحات بالترتيب' : '🔢 Put the panels in order')
              : correctCount === cfg.L
                ? (isAr ? 'صحيح! ✓' : 'Correct! ✓')
                : (isAr ? `${correctCount}/${cfg.L} صحيحة` : `${correctCount}/${cfg.L} right`)}
        </span>
        {isSurvival && (
          <span style={S.lives} aria-label={`${lives} lives`}>
            {'♥'.repeat(Math.max(0, lives))}<span style={{ opacity: 0.25 }}>{'♥'.repeat(Math.max(0, SURV_LIVES - lives))}</span>
          </span>
        )}
        {!isSurvival && <span style={S.lenTag}>{cfg.L} {isAr ? 'لوحات' : 'panels'}</span>}
      </div>

      <style>{ANIM_CSS}</style>

      {/* ── WATCH ── */}
      {phase === 'watch' && (
        <div style={S.stage}>
          {/* Animated performance is survival-only for now — flip `animateWatch`
              to `true` to enable it in every mode once approved. */}
          <Panel sceneId={round.order[watchIdx]} size="lg" badge={watchIdx + 1} animate={isSurvival} />
          <div style={S.filmstrip}>
            {round.order.map((id, i) => (
              <div key={i} style={{ ...S.dot, ...(i <= watchIdx ? S.dotOn : null) }}>{i + 1}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── PLACE / REVEAL ── */}
      {(phase === 'place' || phase === 'reveal') && (
        <div style={S.stage}>
          {/* Answer row: the story you're rebuilding. */}
          <div style={S.slotRow}>
            {Array.from({ length: cfg.L }).map((_, i) => {
              const id = placed[i];
              const filled = id != null;
              const ok = phase === 'reveal' && id === round.order[i];
              const bad = phase === 'reveal' && filled && id !== round.order[i];
              return (
                <div key={i} style={{ ...S.slot, ...(ok ? S.slotOk : null), ...(bad ? S.slotBad : null) }}
                  onClick={() => phase === 'place' && filled && unplace(i)}>
                  {filled
                    ? <Panel sceneId={id} badge={i + 1} />
                    : <span style={S.slotNum}>{i + 1}</span>}
                </div>
              );
            })}
          </div>

          {phase === 'reveal' && correctCount !== cfg.L && (
            <>
              <div style={S.revealLabel}>{isAr ? 'الترتيب الصحيح:' : 'Correct order:'}</div>
              <div style={S.slotRow}>
                {round.order.map((id, i) => <Panel key={i} sceneId={id} badge={i + 1} />)}
              </div>
            </>
          )}

          {phase === 'place' && (
            <>
              <div style={S.trayLabel}>{isAr ? 'اضغط اللوحات بالترتيب' : 'Tap the panels in order'}</div>
              <div style={S.tray}>
                {trayRemaining.map((id) => (
                  <button key={id} type="button" style={S.trayBtn} onClick={() => place(id)}>
                    <Panel sceneId={id} />
                  </button>
                ))}
              </div>
              <button type="button" style={{ ...S.checkBtn, ...(placed.length === cfg.L ? null : S.checkBtnOff) }}
                disabled={placed.length !== cfg.L} onClick={check}>
                {isAr ? '✓ تحقّق' : '✓ Check'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoryGridGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_memory_storygrid"
      scienceId="story-grid"
      title={{ en: 'Story Time', ar: 'وقت القصة' }}
      hints={{
        free: { en: 'Endless · 3 lives · stories grow', ar: 'لا ينتهي · ٣ أرواح · قصص أطول' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same stories for all · most in order wins', ar: 'نفس القصص للجميع · الأكثر ترتيباً يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: CHAL_TRIALS, scoreLabel: { en: 'solved', ar: 'محلولة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <StoryEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const card = { borderRadius: 14, border: '2px solid #e3d6c4', background: '#fffdf8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' };
const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 2px', fontSize: 14, fontWeight: 800, color: '#3a3a3a' },
  phaseTag: { fontWeight: 900 },
  lives: { fontSize: 16, color: '#d23b3b', letterSpacing: 1 },
  lenTag: { color: '#7a5a1e', fontWeight: 800 },
  stage: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '8px 14px 16px', overflowY: 'auto' },
  panel: { ...card, width: 'clamp(66px, 21vw, 94px)', height: 'clamp(78px, 24vw, 108px)', boxShadow: '2px 2px 0 rgba(26,18,8,0.18)', gap: 2 },
  panelLg: { ...card, width: 'min(58vw, 230px)', height: 'min(42vh, 240px)', boxShadow: '4px 4px 0 rgba(26,18,8,0.22)', borderColor: '#cdbfa6', gap: 6 },
  charWrap: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  prop: { position: 'absolute', insetInlineEnd: -4, bottom: -4, fontSize: 18, lineHeight: 1, width: 26, height: 26, borderRadius: '50%', background: '#fffdf8', border: '2px solid #e3d6c4', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '1px 1px 0 rgba(0,0,0,0.15)' },
  propLg: { position: 'absolute', insetInlineEnd: 2, bottom: 2, fontSize: 40, lineHeight: 1, width: 60, height: 60, borderRadius: '50%', background: '#fffdf8', border: '3px solid #cdbfa6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 0 rgba(0,0,0,0.18)' },
  caption: { fontSize: 'clamp(9px, 2.6vw, 12px)', fontWeight: 700, color: '#6a5a40', textAlign: 'center', padding: '0 3px', lineHeight: 1.15 },
  captionLg: { fontSize: 'clamp(14px, 4vw, 19px)', fontWeight: 800, color: '#4a3c28', textAlign: 'center', padding: '0 6px' },
  panelBadge: { position: 'absolute', top: -8, insetInlineStart: -8, width: 22, height: 22, borderRadius: '50%', background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8' },
  filmstrip: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 24, height: 24, borderRadius: '50%', border: '2px solid #d8cab4', color: '#b3a288', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dotOn: { background: '#b9842f', color: '#fff', borderColor: '#b9842f' },
  slotRow: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 560 },
  slot: { ...card, width: 'clamp(64px, 20vw, 90px)', height: 'clamp(64px, 20vw, 90px)', borderStyle: 'dashed', background: '#fbf5ec' },
  slotNum: { fontSize: 22, fontWeight: 900, color: '#cbb893' },
  slotOk: { borderColor: '#2e8b57', borderStyle: 'solid', boxShadow: '0 0 0 2px rgba(46,139,87,0.25)' },
  slotBad: { borderColor: '#d23b3b', borderStyle: 'solid', boxShadow: '0 0 0 2px rgba(210,59,59,0.2)' },
  revealLabel: { fontWeight: 800, fontSize: 13, color: '#2e8b57' },
  trayLabel: { fontWeight: 800, fontSize: 13, color: '#7a6a52', marginTop: 4 },
  tray: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 560 },
  trayBtn: { padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' },
  checkBtn: { marginTop: 6, padding: '12px 26px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  checkBtnOff: { background: '#c9bfae', borderColor: '#a89a82', boxShadow: 'none', cursor: 'default', color: '#fff' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' },
  overTitle: { margin: '0 0 8px', fontWeight: 900, fontSize: 24 },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  overBtn: { padding: '12px 20px', borderRadius: 12, border: '2px solid #1a1208', background: '#b9842f', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  overBtnGhost: { padding: '12px 20px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, cursor: 'pointer' },
};
