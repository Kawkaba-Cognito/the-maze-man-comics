import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import GroupShell, { GroupHow } from '../_shared/GroupShell';
import GroupHandoff from '../_shared/GroupHandoff';
import { rnd } from '../_shared/groupTheme';
import { WAR_GAMES, launchPropsFor, placementPoints, warGameById } from './catalog';

const ACCENT = '#c45c26';
const TEAM_COLORS = ['#d46a6a', '#5a9fd4', '#49a078', '#e8ac4e', '#b696d4', '#5ec6a0'];

function defaultTeams(n) {
  return Array.from({ length: n }, (_, i) => (i === 0 ? 'Team A' : i === 1 ? 'Team B' : `Team ${String.fromCharCode(65 + i)}`));
}

function EngineHost({ gameId, launch, isAr, playSfx, onResult, onExit }) {
  const [Engine, setEngine] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    const meta = warGameById(gameId);
    if (!meta) { setErr('missing'); return undefined; }
    meta.loader()
      .then((E) => { if (alive) setEngine(() => E); })
      .catch((e) => { if (alive) setErr(String(e?.message || e)); });
    return () => { alive = false; };
  }, [gameId]);

  if (err) {
    return (
      <div className="gc-body gc-body--center">
        <div className="gc-tagline">{isAr ? 'تعذّر تحميل اللعبة' : 'Could not load game'}</div>
        <button type="button" className="gc-btn" onClick={onExit}>{isAr ? 'رجوع' : 'Back'}</button>
      </div>
    );
  }
  if (!Engine) {
    return (
      <div className="gc-body gc-body--center" style={{ minHeight: '40vh' }}>
        <div className="gc-tagline">{isAr ? '…جارٍ التحميل' : 'Loading…'}</div>
      </div>
    );
  }

  return (
    <Engine
      {...launch}
      isAr={isAr}
      playSfx={playSfx}
      awardPoints={() => {}}
      awardFreeRun={() => {}}
      onResult={(r) => onResult(Number(r?.score) || 0)}
      onExit={onExit}
    />
  );
}

export default function GroupWarGame({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('setup');
  // setup | handoff | play | roundResult | final
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState(() => defaultTeams(2));
  const [selected, setSelected] = useState(() => new Set(['mot', 'math-gates', 'trivia', 'brixton']));
  const [rounds, setRounds] = useState(1);
  const [diff, setDiff] = useState('hard');

  const [playlist, setPlaylist] = useState([]); // [{ gameId, seed }]
  const [matchIdx, setMatchIdx] = useState(0);
  const [teamIdx, setTeamIdx] = useState(0);
  const [rawScores, setRawScores] = useState([]); // per match: number[] by team
  const [totals, setTotals] = useState([]);
  const [lastPlacement, setLastPlacement] = useState(null);
  const settledRef = useRef(false);

  const t = useMemo(() => ({
    title: isAr ? 'حرب المجموعات' : 'Group War',
    tagline: isAr
      ? 'فرق تتنافس على ألعاب التدريب — نفس التحدي، أعلى نقاط تفوز.'
      : 'Teams duel on training games — same challenge, highest points win.',
    teamsL: isAr ? 'عدد الفرق' : 'Teams',
    namesL: isAr ? 'أسماء الفرق' : 'Team names',
    gamesL: isAr ? 'الألعاب' : 'Games',
    roundsL: isAr ? 'الجولات' : 'Rounds',
    roundsHint: isAr
      ? 'كل جولة تعيد قائمة الألعاب المختارة'
      : 'Each round replays your selected game list',
    diffL: isAr ? 'الصعوبة' : 'Difficulty',
    easy: isAr ? 'سهل' : 'Easy',
    med: isAr ? 'متوسط' : 'Medium',
    hard: isAr ? 'صعب' : 'Hard',
    start: isAr ? 'ابدأ الحرب' : 'Start war',
    needGames: isAr ? 'اختر لعبة واحدة على الأقل' : 'Pick at least one game',
    menu: isAr ? 'القائمة' : 'Menu',
    howTitle: isAr ? 'كيف تلعب' : 'How to play',
    how: isAr
      ? 'كل الفرق تلعب نفس اللعبة بنفس البذرة. بعد أن ينتهي الجميع، تُحسب نقاط الترتيب (الأول يحصل على الأكثر). مجموع النقاط يحدّد الفائز.'
      : 'Every team plays the same game on the same seed. After all finish, placement points are awarded (1st gets the most). Highest total wins.',
    passTo: isAr ? 'مرّر الهاتف إلى' : 'Pass the phone to',
    ready: isAr ? 'الفريق جاهز للعب' : 'Team ready to play',
    play: isAr ? 'ابدأ ›' : 'Play ›',
    roundDone: isAr ? 'انتهت اللعبة' : 'Game finished',
    raw: isAr ? 'نتيجة اللعبة' : 'Game score',
    pts: isAr ? 'نقاط الجولة' : 'Round points',
    total: isAr ? 'المجموع' : 'Total',
    next: isAr ? 'التالي ›' : 'Next ›',
    winner: isAr ? 'الفائز' : 'Winner',
    tie: isAr ? 'تعادل!' : "It's a tie!",
    again: isAr ? 'حرب جديدة' : 'New war',
    matchOf: (a, b) => (isAr ? `مباراة ${a} من ${b}` : `Match ${a} of ${b}`),
    addTeam: isAr ? '＋ فريق' : '＋ Team',
  }), [isAr]);

  useEffect(() => {
    setTeams((prev) => {
      const next = [...prev];
      while (next.length < teamCount) next.push(defaultTeams(teamCount)[next.length]);
      return next.slice(0, teamCount);
    });
  }, [teamCount]);

  const toggleGame = (id) => {
    playSfx?.('click');
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const buildPlaylist = useCallback(() => {
    const ids = WAR_GAMES.map((g) => g.id).filter((id) => selected.has(id));
    const list = [];
    for (let r = 0; r < rounds; r += 1) {
      for (const gameId of ids) {
        list.push({ gameId, seed: (Math.random() * 1e9) | 0, key: `${r}-${gameId}-${rnd(1e6)}` });
      }
    }
    return list;
  }, [selected, rounds]);

  const begin = () => {
    if (selected.size < 1) return;
    playSfx?.('click');
    const names = teams.map((n, i) => String(n || '').trim() || defaultTeams(teamCount)[i]);
    setTeams(names);
    const pl = buildPlaylist();
    setPlaylist(pl);
    setMatchIdx(0);
    setTeamIdx(0);
    setRawScores(pl.map(() => Array(names.length).fill(null)));
    setTotals(Array(names.length).fill(0));
    setLastPlacement(null);
    settledRef.current = false;
    setPhase('handoff');
  };

  const match = playlist[matchIdx];
  const gameMeta = match ? warGameById(match.gameId) : null;
  const launch = match && gameMeta ? launchPropsFor(gameMeta, diff, match.seed) : null;

  const onEngineResult = (score) => {
    if (settledRef.current) return;
    settledRef.current = true;
    playSfx?.('win');
    const row = [...(rawScores[matchIdx] || Array(teams.length).fill(null))];
    row[teamIdx] = score;
    setRawScores((prev) => {
      const next = prev.map((r) => [...r]);
      next[matchIdx] = row;
      return next;
    });
    const nextTeam = teamIdx + 1;
    if (nextTeam < teams.length) {
      setTeamIdx(nextTeam);
      settledRef.current = false;
      setPhase('handoff');
      return;
    }
    const entries = row.map((s, i) => ({ teamIdx: i, score: Number(s) || 0 }));
    const pts = placementPoints(entries, true);
    setLastPlacement({ raw: row, pts, gameId: match.gameId });
    setTotals((prev) => prev.map((v, i) => v + pts[i]));
    setPhase('roundResult');
  };

  const advanceAfterRound = () => {
    playSfx?.('click');
    const next = matchIdx + 1;
    if (next >= playlist.length) {
      setPhase('final');
      return;
    }
    setMatchIdx(next);
    setTeamIdx(0);
    setLastPlacement(null);
    settledRef.current = false;
    setPhase('handoff');
  };

  const winners = useMemo(() => {
    if (!totals.length) return [];
    const best = Math.max(...totals);
    return totals.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0);
  }, [totals]);

  // ── SETUP ──
  if (phase === 'setup') {
    return (
      <GroupShell isAr={isAr} title={t.title} accent={ACCENT} onBack={() => { playSfx?.('click'); onBack?.(); }} menuLabel={t.menu}>
        <div className="gc-hero">⚔️</div>
        <div className="gc-tagline">{t.tagline}</div>

        <div className="gc-section">
          <div className="gc-label">{t.teamsL}</div>
          <div className="gc-stepper">
            <button type="button" className="gc-step-btn" onClick={() => { playSfx?.('click'); setTeamCount((n) => Math.max(2, n - 1)); }}>−</button>
            <span className="gc-step-val">{teamCount}</span>
            <button type="button" className="gc-step-btn" onClick={() => { playSfx?.('click'); setTeamCount((n) => Math.min(6, n + 1)); }}>+</button>
          </div>
        </div>

        <div className="gc-section">
          <div className="gc-label">{t.namesL}</div>
          <div className="gc-players">
            {teams.map((name, i) => (
              <div className="gc-player-row" key={i}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: TEAM_COLORS[i % TEAM_COLORS.length],
                }} />
                <input
                  className="gc-player-input"
                  value={name}
                  maxLength={18}
                  onChange={(e) => setTeams((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                  aria-label={`${t.namesL} ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="gc-section">
          <div className="gc-label">{t.gamesL}</div>
          <div className="gc-packs">
            {WAR_GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`gc-pack${selected.has(g.id) ? ' on' : ''}`}
                style={{ '--pack-accent': g.accent }}
                onClick={() => toggleGame(g.id)}
              >
                {g.icon} {isAr ? g.ar : g.en}
              </button>
            ))}
          </div>
        </div>

        <div className="gc-section">
          <div className="gc-label">{t.roundsL}</div>
          <p className="gc-tip" style={{ textAlign: 'start', margin: 0 }}>{t.roundsHint}</p>
          <div className="gc-times">
            {[1, 2, 3].map((r) => (
              <button key={r} type="button" className={`gc-time${rounds === r ? ' on' : ''}`}
                onClick={() => { playSfx?.('click'); setRounds(r); }}>{r}</button>
            ))}
          </div>
        </div>

        <div className="gc-section">
          <div className="gc-label">{t.diffL}</div>
          <div className="gc-times">
            {[['easy', t.easy], ['med', t.med], ['hard', t.hard]].map(([k, lb]) => (
              <button key={k} type="button" className={`gc-time${diff === k ? ' on' : ''}`}
                onClick={() => { playSfx?.('click'); setDiff(k); }}>{lb}</button>
            ))}
          </div>
        </div>

        {selected.size < 1 && <div className="gc-tip">{t.needGames}</div>}
        <button type="button" className="gc-btn" disabled={selected.size < 1} style={{ opacity: selected.size < 1 ? 0.5 : 1 }} onClick={begin}>
          {t.start}
        </button>
        <GroupHow title={t.howTitle} text={t.how} />
      </GroupShell>
    );
  }

  // ── HANDOFF ──
  if (phase === 'handoff' && match && gameMeta) {
    return (
      <GroupShell
        isAr={isAr}
        title={t.title}
        accent={gameMeta.accent}
        onBack={() => { playSfx?.('click'); setPhase('setup'); }}
        menuLabel={t.menu}
        center
        chip={t.matchOf(matchIdx + 1, playlist.length)}
      >
        <GroupHandoff
          isAr={isAr}
          name={teams[teamIdx]}
          kicker={t.passTo}
          emoji={gameMeta.icon}
          body={`${isAr ? gameMeta.ar : gameMeta.en}`}
          sub={isAr ? gameMeta.blurb.ar : gameMeta.blurb.en}
          cta={t.play}
          onReady={() => { playSfx?.('click'); setPhase('play'); }}
          playSfx={playSfx}
        />
        <div className="gc-tip" style={{ marginTop: -8 }}>{t.ready}</div>
      </GroupShell>
    );
  }

  // ── PLAY (engine fullscreen; thin bar above) ──
  if (phase === 'play' && match && gameMeta && launch) {
    return (
      <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#0a0a0c' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 12px 8px',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.75), transparent)',
          color: '#f0e2c0', fontFamily: "'Outfit', system-ui, sans-serif", pointerEvents: 'none',
        }}>
          <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginInlineEnd: 6,
              background: TEAM_COLORS[teamIdx % TEAM_COLORS.length],
            }} />
            {teams[teamIdx]}
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.8rem', opacity: 0.9 }}>
            {gameMeta.icon} {isAr ? gameMeta.ar : gameMeta.en}
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.75rem', opacity: 0.75 }}>{t.matchOf(matchIdx + 1, playlist.length)}</span>
        </div>
        <Suspense fallback={<div style={{ color: '#f0e2c0', display: 'grid', placeItems: 'center', height: '100%' }}>…</div>}>
          <EngineHost
            key={`${match.key}-${teamIdx}`}
            gameId={match.gameId}
            launch={launch}
            isAr={isAr}
            playSfx={playSfx}
            onResult={onEngineResult}
            onExit={() => {
              // treat quit as score 0 so war can continue
              onEngineResult(0);
            }}
          />
        </Suspense>
      </div>
    );
  }

  // ── ROUND RESULT ──
  if (phase === 'roundResult' && lastPlacement && gameMeta) {
    return (
      <GroupShell isAr={isAr} title={t.title} accent={gameMeta.accent} onBack={() => setPhase('setup')} menuLabel={t.menu} center>
        <div className="gc-hero">{gameMeta.icon}</div>
        <div className="gc-handoff-kicker">{t.roundDone}</div>
        <div className="gc-handoff-name" style={{ fontSize: '1.8rem' }}>{isAr ? gameMeta.ar : gameMeta.en}</div>
        <div className="gc-card" style={{ width: '100%', maxWidth: 360, textAlign: 'start' }}>
          {teams.map((name, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < teams.length - 1 ? '1px solid #e3d6c4' : 'none',
              fontWeight: 700,
            }}>
              <span>
                <span style={{
                  display: 'inline-block', width: 10, height: 10, borderRadius: '50%', marginInlineEnd: 8,
                  background: TEAM_COLORS[i % TEAM_COLORS.length],
                }} />
                {name}
              </span>
              <span style={{ color: '#8a7f6f', fontSize: '0.9rem' }}>
                {t.raw} {lastPlacement.raw[i] ?? 0}
                <b style={{ color: '#2d2210', marginInlineStart: 10 }}>+{lastPlacement.pts[i]}</b>
              </span>
            </div>
          ))}
        </div>
        <div className="gc-card" style={{ width: '100%', maxWidth: 360 }}>
          <div className="gc-label">{t.total}</div>
          {teams.map((name, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, padding: '4px 0' }}>
              <span>{name}</span>
              <span style={{ color: TEAM_COLORS[i % TEAM_COLORS.length] }}>{totals[i]}</span>
            </div>
          ))}
        </div>
        <button type="button" className="gc-btn" onClick={advanceAfterRound}>{t.next}</button>
      </GroupShell>
    );
  }

  // ── FINAL ──
  if (phase === 'final') {
    const winLabel = winners.length > 1
      ? t.tie
      : `${t.winner}: ${teams[winners[0]]}`;
    return (
      <GroupShell isAr={isAr} title={t.title} accent={ACCENT} onBack={() => setPhase('setup')} menuLabel={t.menu} center>
        <div className="gc-hero">🏆</div>
        <div className="gc-handoff-name" style={{ fontSize: '2rem', color: ACCENT }}>{winLabel}</div>
        <div className="gc-card" style={{ width: '100%', maxWidth: 360 }}>
          {[...teams.map((name, i) => ({ name, i, pts: totals[i] }))]
            .sort((a, b) => b.pts - a.pts)
            .map((row, rank) => (
              <div key={row.i} style={{
                display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                borderBottom: rank < teams.length - 1 ? '1px solid #e3d6c4' : 'none',
                fontWeight: 800, fontSize: rank === 0 ? '1.15rem' : '1rem',
              }}>
                <span>#{rank + 1} {row.name}</span>
                <span style={{ color: TEAM_COLORS[row.i % TEAM_COLORS.length] }}>{row.pts}</span>
              </div>
            ))}
        </div>
        <div className="gc-btn-col">
          <button type="button" className="gc-btn" onClick={() => { playSfx?.('click'); setPhase('setup'); }}>{t.again}</button>
          <button type="button" className="gc-btn gc-btn--ghost" onClick={() => { playSfx?.('click'); onBack?.(); }}>{t.menu}</button>
        </div>
      </GroupShell>
    );
  }

  return null;
}
