import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../../../context/AppContext';
import { rnd } from '../_shared/groupTheme';
import { SPECTRA } from './spectra';
import GroupShell, { GroupHow } from '../_shared/GroupShell';
import GroupHandoff from '../_shared/GroupHandoff';
import GroupPlayerSetup, { useGroupPlayers } from '../_shared/GroupPlayerSetup';
import { createDrawer } from '../_shared/drawWithoutRepeat';

const ACCENT = '#5a9fd4';
const spectrumDrawer = createDrawer('mm_group_wavelength_spectra_v1', { maxRecent: 180 });

export default function WavelengthGame({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('setup'); // setup | handoff | clue | guess | reveal
  const [players, setPlayers, commitPlayers] = useGroupPlayers(2, 10);
  const [names, setNames] = useState(players);
  const [spectrum, setSpectrum] = useState(SPECTRA[0]);
  const [target, setTarget] = useState(50);
  const [guess, setGuess] = useState(50);
  const [psychicIdx, setPsychicIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [lastPts, setLastPts] = useState(0);

  const t = useMemo(() => ({
    title: isAr ? 'على المقياس' : 'On a Scale',
    tagline: isAr ? 'دليل واحد… والمجموعة تخمّن الموضع.' : 'One clue… the group guesses the spot.',
    how: isAr
      ? 'هدف مخفي يقع بين نقيضين. يرى «قارئ الأفكار» الهدف ويعطي دليلاً من كلمة واحدة يربط المفهوم بالمقياس. تتناقش المجموعة وتحرّك المؤشّر إلى المكان المتوقّع، ثم نكشف ونحسب القرب.'
      : 'A hidden target sits between two opposites. The Psychic sees it and gives a one-word clue linking a concept to the scale. The group discusses, moves the dial to their guess, then reveals — closer = more points.',
    start: isAr ? 'ابدأ' : 'Start',
    psychicL: isAr ? 'قارئ الأفكار' : 'Psychic',
    onlyYou: isAr ? 'أنت وحدك ترى الهدف' : 'Only you can see the target',
    clueInstr: isAr ? 'أعطِ دليلاً من كلمة واحدة بصوت عالٍ' : 'Say a one-word clue out loud',
    hidePass: isAr ? 'أخفِ ومرّر' : 'Hide & pass',
    dialInstr: isAr ? 'حرّكوا المؤشّر معاً إلى تخمينكم' : 'Move the dial together to your guess',
    lockIn: isAr ? 'ثبّتوا التخمين' : 'Lock it in',
    bull: isAr ? 'إصابة مباشرة!' : 'Bullseye!',
    great: isAr ? 'رائع!' : 'Great!',
    close: isAr ? 'قريب' : 'Close',
    missed: isAr ? 'بعيد' : 'Missed',
    pts: isAr ? 'نقاط' : 'pts',
    scoreL: isAr ? 'المجموع' : 'Score',
    nextRound: isAr ? 'جولة جديدة' : 'Next round',
    reset: isAr ? 'صفّر النقاط' : 'Reset score',
    menu: isAr ? 'القائمة' : 'Menu',
    howTitle: isAr ? 'كيف تلعب' : 'How to play',
    ready: isAr ? 'انظر الهدف سراً' : 'See the target in secret',
  }), [isAr]);

  const psychicName = names[psychicIdx % names.length] || `Player ${(psychicIdx % Math.max(names.length, 1)) + 1}`;

  const beginClue = useCallback(() => {
    const picked = spectrumDrawer.draw(SPECTRA, (s) => s.id || `${s.l.en}|${s.r.en}`);
    setSpectrum(picked || SPECTRA[rnd(SPECTRA.length)]);
    setTarget(12 + rnd(77));
    setGuess(50);
    setPhase('clue');
    playSfx?.('click');
  }, [playSfx]);

  const lockIn = useCallback(() => {
    const d = Math.abs(guess - target);
    const pts = d <= 5 ? 4 : d <= 11 ? 3 : d <= 18 ? 2 : 0;
    setLastPts(pts);
    setScore((s) => s + pts);
    playSfx?.(pts >= 3 ? 'win' : pts > 0 ? 'click' : 'error');
    setPhase('reveal');
  }, [guess, target, playSfx]);

  const bandLabel = lastPts === 4 ? t.bull : lastPts === 3 ? t.great : lastPts === 2 ? t.close : t.missed;
  const L = isAr ? spectrum.l.ar : spectrum.l.en;
  const R = isAr ? spectrum.r.ar : spectrum.r.en;

  const Bar = ({ showTarget, showGuess }) => (
    <div style={{ width: '100%', maxWidth: 360 }}>
      <div style={{
        position: 'relative', height: 46, borderRadius: 12, overflow: 'hidden', border: '2px solid #e3d6c4',
        background: 'linear-gradient(90deg, #dce6ee 0%, #eef2f0 50%, #f4e6d6 100%)',
      }}>
        {showTarget && (
          <>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${target - 18}%`, width: '36%', background: 'rgba(90,159,212,0.20)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${target - 11}%`, width: '22%', background: 'rgba(90,159,212,0.38)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${target - 5}%`, width: '10%', background: 'rgba(232,172,78,0.75)' }} />
            <div style={{ position: 'absolute', top: -3, bottom: -3, left: `${target}%`, width: 3, background: '#b9842f', transform: 'translateX(-50%)' }} />
          </>
        )}
        {showGuess && (
          <div style={{ position: 'absolute', top: -6, bottom: -6, left: `${guess}%`, width: 4, background: '#c0433d', transform: 'translateX(-50%)' }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, fontWeight: 800, color: '#8a7f6f' }}>
        <span>◄ {L}</span><span>{R} ►</span>
      </div>
    </div>
  );

  return (
    <GroupShell
      isAr={isAr}
      title={t.title}
      accent={ACCENT}
      onBack={() => { playSfx?.('click'); onBack?.(); }}
      menuLabel={t.menu}
      center={phase !== 'setup'}
      chip={`${t.scoreL}: ${score}`}
    >
      {phase === 'setup' && (
        <>
          <div className="gc-hero">🎯</div>
          <div className="gc-tagline">{t.tagline}</div>
          <GroupPlayerSetup
            isAr={isAr}
            playSfx={playSfx}
            players={players}
            onPlayersChange={setPlayers}
            min={2}
            max={10}
          />
          <button
            type="button"
            className="gc-btn"
            onClick={() => {
              const list = commitPlayers(players);
              setNames(list);
              setPsychicIdx(0);
              setScore(0);
              setPhase('handoff');
              playSfx?.('click');
            }}
          >
            {t.start}
          </button>
          <GroupHow title={t.howTitle} text={t.how} />
        </>
      )}

      {phase === 'handoff' && (
        <GroupHandoff
          isAr={isAr}
          name={psychicName}
          kicker={t.psychicL}
          emoji="🔒"
          body={t.ready}
          sub={t.onlyYou}
          cta={`${t.start} ›`}
          onReady={beginClue}
          playSfx={playSfx}
        />
      )}

      {phase === 'clue' && (
        <>
          <div className="gc-handoff-kicker">{t.psychicL}: {psychicName}</div>
          <div style={{ color: '#b5453f', fontWeight: 800 }}>🔒 {t.onlyYou}</div>
          <Bar showTarget showGuess={false} />
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t.clueInstr}</div>
          <button type="button" className="gc-btn" onClick={() => { playSfx?.('click'); setPhase('guess'); }}>{t.hidePass} ›</button>
        </>
      )}

      {phase === 'guess' && (
        <>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{t.dialInstr}</div>
          <Bar showTarget={false} showGuess />
          <input
            type="range"
            min="0"
            max="100"
            value={guess}
            onChange={(e) => setGuess(Number(e.target.value))}
            style={{ width: '100%', maxWidth: 360, height: 34, accentColor: ACCENT }}
          />
          <button type="button" className="gc-btn" onClick={lockIn}>{t.lockIn}</button>
        </>
      )}

      {phase === 'reveal' && (
        <>
          <div className="gc-handoff-name" style={{
            fontSize: '2.1rem',
            color: lastPts >= 3 ? '#2e8b57' : lastPts === 0 ? '#c0433d' : '#8a7f6f',
          }}>{bandLabel}</div>
          <div style={{ fontWeight: 800 }}>+{lastPts} {t.pts}</div>
          <Bar showTarget showGuess />
          <div className="gc-btn-col">
            <button
              type="button"
              className="gc-btn"
              onClick={() => {
                setPsychicIdx((i) => i + 1);
                setPhase('handoff');
              }}
            >
              {t.nextRound}
            </button>
            <button
              type="button"
              className="gc-btn gc-btn--ghost"
              onClick={() => {
                playSfx?.('click');
                setScore(0);
                setPsychicIdx(0);
                setPhase('setup');
              }}
            >
              {t.reset}
            </button>
          </div>
        </>
      )}
    </GroupShell>
  );
}
