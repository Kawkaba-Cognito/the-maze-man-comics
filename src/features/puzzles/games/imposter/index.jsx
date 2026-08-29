import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../../../context/AppContext';
import { PACKS, rnd, fmt, shuffle, packById, randomPack } from '../_shared/groupTheme';
import GroupShell, { GroupHow, GroupPackChips } from '../_shared/GroupShell';
import GroupPlayerSetup, { useGroupPlayers } from '../_shared/GroupPlayerSetup';
import { createDrawer } from '../_shared/drawWithoutRepeat';

const ACCENT = '#d46a6a';
const wordDrawer = createDrawer('mm_group_imposter_words_v1', { maxRecent: 500 });

export default function ImposterGame({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('setup');
  const [players, setPlayers, commitPlayers] = useGroupPlayers(3, 10);
  const [imposters, setImposters] = useState(1);
  const [packId, setPackId] = useState('random');
  const [round, setRound] = useState(null);
  const [revealIdx, setRevealIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [secs, setSecs] = useState(120);
  const [timerOn, setTimerOn] = useState(false);
  const [starter, setStarter] = useState(0);

  /* How often each seat has been the imposter, and who it was last round.
     Refs, not state: they steer the NEXT draw and must never trigger a render
     (see the rotation note in startRound). Reset when the roster changes,
     because seat 3 is a different person once the players do. */
  const recentImpRef = useRef({});
  const lastImpRef = useRef([]);

  /*
   * Does the imposter get told the CATEGORY? On by default, and that default is
   * the single biggest thing making this game fun.
   *
   * Knowing neither word nor category, the imposter has nothing to say on their
   * first turn — any noun they invent is either off-category and instantly
   * damning, or a lucky guess. They are caught on turn one, every time, and the
   * round is over before the bluffing that the game is FOR ever starts. Given
   * the category they can say something plausible, the table has to actually
   * listen, and the imposter has a chance worth playing for. The old blind mode
   * is still here for groups who want it brutal.
   */
  const [impSeesCat, setImpSeesCat] = useState(true);

  const n = players.length;
  const maxImp = Math.max(1, Math.min(4, n - 2));
  useEffect(() => { if (imposters > maxImp) setImposters(maxImp); }, [imposters, maxImp]);

  /* A different roster means seat i is a different person, so the rotation
     memory above is meaningless — clear it rather than carry it over. */
  useEffect(() => { recentImpRef.current = {}; lastImpRef.current = []; }, [n]);

  const t = useMemo(() => ({
    title: isAr ? 'الدخيل' : 'Imposter',
    tagline: isAr ? 'الجميع يعرف الكلمة… إلا واحد.' : 'Everyone knows the word… except one.',
    impostersL: isAr ? 'عدد الدخلاء' : 'Imposters',
    packL: isAr ? 'الفئة' : 'Category',
    random: isAr ? 'عشوائي' : 'Random',
    start: isAr ? 'ابدأ الجولة' : 'Start round',
    passTo: isAr ? 'مرّر الهاتف إلى' : 'Pass the phone to',
    tapReveal: isAr ? 'اضغط لرؤية دورك' : 'Tap to see your role',
    youAreImp: isAr ? 'أنت الدخيل!' : "You're the Imposter!",
    impNoWord: isAr ? 'لا تعرف الكلمة ولا الفئة.' : "You don't know the word — or the category.",
    impKnowsCat: isAr ? 'تعرف الفئة فقط — لا الكلمة.' : 'You know the category — not the word.',
    impBlend: isAr ? 'اندمج ولا تنكشف.' : "Blend in — don't get caught.",
    hintL: isAr ? 'الدخيل يرى الفئة' : 'Imposter sees the category',
    hintOn: isAr ? 'أسهل وأمتع' : 'Fairer, more fun',
    hintOff: isAr ? 'وضع قاسٍ' : 'Brutal mode',
    yourWord: isAr ? 'كلمتك السرية' : 'Your secret word',
    hidePass: isAr ? 'أخفِ ومرّر' : 'Hide & pass',
    allSeen: isAr ? 'رأى الجميع بطاقاتهم' : 'Everyone has seen their card',
    discuss: isAr ? 'ناقشوا وصوّتوا' : 'Discuss & vote',
    startsFirst: isAr ? 'يبدأ الكلام' : 'Speaks first',
    reveal: isAr ? 'اكشف الدخيل' : 'Reveal the imposter',
    timer: isAr ? 'مؤقّت النقاش' : 'Discussion timer',
    theImp: isAr ? 'الدخيل كان' : 'The imposter was',
    theImpPl: isAr ? 'الدخلاء كانوا' : 'The imposters were',
    findLabel: isAr ? 'اعثروا على الدخلاء' : 'Find the imposters',
    theWord: isAr ? 'الكلمة كانت' : 'The word was',
    newRound: isAr ? 'جولة جديدة' : 'New round',
    newGame: isAr ? 'إعدادات جديدة' : 'New setup',
    menu: isAr ? 'القائمة' : 'Menu',
    howTitle: isAr ? 'كيف تلعب' : 'How to play',
    how: isAr
      ? 'يحصل كل لاعب على نفس الكلمة السرية عدا الدخيل (أو الدخلاء). افتراضياً يرى الدخيل الفئة فقط، فيستطيع المخادعة — ويمكنكم إطفاء ذلك. مرّروا الهاتف ليرى كلٌّ بطاقته سراً، ثم قولوا بالتناوب كلمة واحدة عن الكلمة. صوّتوا على المشتبه بهم ثم اكشفوا.'
      : 'Everyone gets the same secret word except the imposter(s). By default the imposter is told the category but not the word, so they have something to bluff with — you can switch that off. Pass the phone so each player reads their card in secret, then take turns saying one word about it. Vote out the suspect(s), then reveal.',
  }), [isAr]);

  const nameOf = (i) => players[i] || `Player ${i + 1}`;

  const startRound = useCallback(() => {
    const names = commitPlayers(players);
    const pack = packId === 'random' ? randomPack() : packById(packId) || randomPack();
    /* ⚠ `base`, NOT `words` — see the header of groupPacks.js. `words` carries
       the acted-out variants that Charades wants, so this used to hand out
       secrets like "Broken Lion" and "Giant Elephant": two words, not a thing,
       and impossible to give a one-word clue about. */
    const items = pack.base.map((word) => ({ id: `${pack.id}:${word.en}`, word, pack }));
    const picked = wordDrawer.draw(items);
    const w = picked.word;

    /*
     * ⚠ WHO IS THE IMPOSTER IS DRAWN WITHOUT REPLACEMENT, not sampled fresh.
     * A uniform shuffle each round is "random" and feels broken: over six
     * rounds with five players somebody is picked three times and somebody
     * never, and the table stops believing the phone. Players who have not been
     * the imposter recently are drawn first, and the previous round's imposters
     * are excluded outright whenever the group is big enough to allow it — so
     * the one thing a player would actually notice, being it twice in a row,
     * cannot happen.
     */
    const need = Math.min(imposters, Math.max(1, names.length - 2));
    const recent = recentImpRef.current;
    const lastRound = lastImpRef.current;
    const eligible = [...Array(names.length).keys()]
      .filter((i) => !lastRound.includes(i));
    const pool = eligible.length >= need ? eligible : [...Array(names.length).keys()];
    // fewest recent turns first, ties broken randomly so it never becomes a rota
    const impSet = shuffle(pool)
      .sort((a, b) => (recent[a] || 0) - (recent[b] || 0))
      .slice(0, need);
    impSet.forEach((i) => { recent[i] = (recent[i] || 0) + 1; });
    lastImpRef.current = impSet;

    setRound({
      word: isAr ? w.ar : w.en,
      category: isAr ? pack.ar : pack.en,
      accent: pack.accent || ACCENT,
      imposterSet: impSet,
      /* Frozen into the round, not read live: flipping the setting mid-handoff
         would otherwise change what later players are shown. */
      hintCategory: impSeesCat,
      names,
    });
    setRevealIdx(0);
    setShown(false);
    setStarter(rnd(names.length));
    setSecs(120);
    setTimerOn(false);
    setPhase('reveal');
    playSfx?.('click');
  }, [packId, players, imposters, isAr, playSfx, commitPlayers, impSeesCat]);

  const nextReveal = useCallback(() => {
    playSfx?.('click');
    if (revealIdx + 1 >= (round?.names?.length || n)) { setPhase('discuss'); return; }
    setRevealIdx((i) => i + 1);
    setShown(false);
  }, [revealIdx, round, n, playSfx]);

  useEffect(() => {
    if (!timerOn) return undefined;
    if (secs <= 0) { setTimerOn(false); playSfx?.('collect'); return undefined; }
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timerOn, secs, playSfx]);

  const names = round?.names || players;

  return (
    <GroupShell
      isAr={isAr}
      title={t.title}
      accent={ACCENT}
      onBack={() => { playSfx?.('click'); onBack?.(); }}
      menuLabel={t.menu}
      center={phase !== 'setup'}
      chip={phase === 'discuss' || phase === 'result' ? `${names.length}` : null}
    >
      {phase === 'setup' && (
        <>
          <div className="gc-hero">🕵️</div>
          <div className="gc-tagline">{t.tagline}</div>

          <GroupPlayerSetup
            isAr={isAr}
            playSfx={playSfx}
            players={players}
            onPlayersChange={setPlayers}
            min={3}
            max={10}
          />

          <div className="gc-section">
            <div className="gc-label">{t.impostersL}</div>
            <div className="gc-stepper">
              <button type="button" className="gc-step-btn" onClick={() => { playSfx?.('click'); setImposters((v) => Math.max(1, v - 1)); }}>−</button>
              <span className="gc-step-val">{imposters}</span>
              <button type="button" className="gc-step-btn" onClick={() => { playSfx?.('click'); setImposters((v) => Math.min(maxImp, v + 1)); }}>+</button>
            </div>
          </div>

          <div className="gc-section">
            <div className="gc-label">{t.hintL}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                type="button"
                className={`gc-pill${impSeesCat ? ' on' : ''}`}
                aria-pressed={impSeesCat}
                onClick={() => { playSfx?.('click'); setImpSeesCat(true); }}
              >
                {t.hintOn}
              </button>
              <button
                type="button"
                className={`gc-pill${!impSeesCat ? ' on' : ''}`}
                aria-pressed={!impSeesCat}
                onClick={() => { playSfx?.('click'); setImpSeesCat(false); }}
              >
                {t.hintOff}
              </button>
            </div>
          </div>

          <div className="gc-section">
            <div className="gc-label">{t.packL}</div>
            <GroupPackChips
              packs={PACKS}
              packId={packId}
              onPick={setPackId}
              isAr={isAr}
              randomLabel={t.random}
              playSfx={playSfx}
            />
          </div>

          <button type="button" className="gc-btn" onClick={startRound}>{t.start}</button>
          <GroupHow title={t.howTitle} text={t.how} />
        </>
      )}

      {phase === 'reveal' && round && (
        <>
          <div className="gc-handoff-kicker">{t.passTo}</div>
          <div className="gc-handoff-name">{nameOf(revealIdx)}</div>

          {!shown ? (
            <button
              type="button"
              className="gc-handoff-card gc-handoff-card--secret"
              style={{ cursor: 'pointer', border: 'none', background: 'linear-gradient(150deg,#2c2418,#443624)', color: '#f0e2c0', minHeight: 220 }}
              onClick={() => { playSfx?.('click'); setShown(true); }}
            >
              <div style={{ fontSize: '3rem' }}>👁️</div>
              <div style={{ fontWeight: 700 }}>{t.tapReveal}</div>
            </button>
          ) : (
            <div
              className="gc-handoff-card"
              style={{
                minHeight: 220,
                borderColor: round.imposterSet.includes(revealIdx) ? '#e2a9a4' : '#e3d6c4',
                background: round.imposterSet.includes(revealIdx)
                  ? 'linear-gradient(150deg,#fbeeee,#f6dede)'
                  : 'linear-gradient(150deg,#fffdf8,#f6efe1)',
              }}
            >
              {round.imposterSet.includes(revealIdx) ? (
                <>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c0433d' }}>🕵️ {t.youAreImp}</div>
                  {round.hintCategory ? (
                    <>
                      <div style={{ color: '#8a5a52', fontWeight: 600 }}>{t.impKnowsCat}</div>
                      <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800, color: round.accent }}>{round.category}</div>
                    </>
                  ) : (
                    <div style={{ color: '#8a5a52', fontWeight: 600 }}>{t.impNoWord}</div>
                  )}
                  <div style={{ fontSize: '0.85rem', color: 'var(--pz-muted, #5b687d)' }}>{t.impBlend}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800, color: round.accent }}>{round.category}</div>
                  <div className="gc-word" style={{ padding: 0 }}>{round.word}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--pz-muted, #5b687d)' }}>{t.yourWord}</div>
                </>
              )}
            </div>
          )}

          {shown && (
            <button type="button" className="gc-btn" onClick={nextReveal}>{t.hidePass} ›</button>
          )}
          <div style={{ display: 'flex', gap: 7 }}>
            {names.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: i < revealIdx ? ACCENT : i === revealIdx ? '#b9842f' : '#e3d6c4',
                  transform: i === revealIdx ? 'scale(1.25)' : undefined,
                }}
              />
            ))}
          </div>
        </>
      )}

      {phase === 'discuss' && round && (
        <>
          <div style={{ color: '#2e8b57', fontWeight: 800 }}>✓ {t.allSeen}</div>
          <div className="gc-handoff-name" style={{ fontSize: '2rem' }}>{t.discuss}</div>
          <div style={{ color: 'var(--pz-muted, #5b687d)' }}>👉 {t.startsFirst}: <b style={{ color: 'var(--pz-ink, #17243d)' }}>{nameOf(starter)}</b></div>
          <div style={{ color: 'var(--pz-muted, #5b687d)' }}>🕵️ {t.findLabel}: <b style={{ color: '#a94f4b' }}>{round.imposterSet.length}</b></div>

          <div className="gc-card" style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: '2.8rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmt(secs)}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              {[60, 120, 180].map((s) => (
                <button key={s} type="button" className={`gc-pill${secs === s && !timerOn ? ' on' : ''}`} style={{ flex: '0 0 auto', padding: '7px 12px' }}
                  onClick={() => { playSfx?.('click'); setTimerOn(false); setSecs(s); }}>{s / 60}m</button>
              ))}
              <button type="button" className="gc-btn" style={{ width: 'auto', padding: '7px 14px', boxShadow: 'none' }}
                onClick={() => { playSfx?.('click'); setTimerOn((v) => !v); }}>{timerOn ? '⏸' : '▶'}</button>
            </div>
            <div className="gc-tip" style={{ marginTop: 8 }}>{t.timer}</div>
          </div>

          <button type="button" className="gc-btn gc-btn--danger" onClick={() => { playSfx?.('click'); setPhase('result'); }}>{t.reveal}</button>
        </>
      )}

      {phase === 'result' && round && (
        <>
          <div className="gc-hero">🕵️</div>
          <div className="gc-handoff-kicker">{round.imposterSet.length > 1 ? t.theImpPl : t.theImp}</div>
          <div className="gc-handoff-name" style={{ color: '#c0433d' }}>
            {round.imposterSet.map((i) => nameOf(i)).join(isAr ? '، ' : ', ')}
          </div>
          <div className="gc-card" style={{ width: '100%', maxWidth: 320 }}>
            <div className="gc-label">{t.theWord}</div>
            <div className="gc-word" style={{ fontSize: '2rem', padding: '4px 0' }}>{round.word}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: round.accent }}>{round.category}</div>
          </div>
          <div className="gc-btn-col">
            <button type="button" className="gc-btn" onClick={startRound}>{t.newRound}</button>
            <button type="button" className="gc-btn gc-btn--ghost" onClick={() => { playSfx?.('click'); setPhase('setup'); }}>{t.newGame}</button>
          </div>
        </>
      )}
    </GroupShell>
  );
}
