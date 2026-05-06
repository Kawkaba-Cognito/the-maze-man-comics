import React, { useState, useEffect } from 'react';
import MazeManAvatar from './MazeManAvatar';
import { IconBack } from './TrainingIcons';
import { PALETTE } from './trainingData';

const c = PALETTE;

const MAZE = [
  [0,0,0,1,0,0,0,0,0],
  [1,1,0,1,0,1,1,1,0],
  [0,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,0,1,0],
  [0,1,0,0,0,1,0,0,0],
  [0,0,0,1,0,1,1,1,0],
  [0,1,1,1,0,0,0,1,0],
  [1,1,0,0,0,1,0,1,0],
  [0,0,0,1,1,1,0,0,0],
  [0,1,1,1,0,0,0,1,0],
  [0,0,0,0,0,1,0,0,0],
];
const ROWS = MAZE.length, COLS = MAZE[0].length;
const START = [0, 0], END = [ROWS - 1, COLS - 1];

function StoneBackdrop() {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <pattern id="stoneBg" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M10 10v20M10 10l8 8-8 8" stroke={c.muted} strokeWidth="1" fill="none"/>
          <path d="M36 14l5 8-5 8M36 14v16" stroke={c.muted} strokeWidth="1" fill="none"/>
          <circle cx="50" cy="50" r="4" stroke={c.muted} strokeWidth="1" fill="none"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#stoneBg)"/>
    </svg>
  );
}

function StatChip({ label, value, accent }) {
  return (
    <div style={{
      padding: '5px 10px', borderRadius: 9,
      background: c.card, border: `1px solid ${c.cardBorder}`,
      textAlign: 'center', minWidth: 60,
    }}>
      <div style={{ fontSize: 8.5, letterSpacing: 1.2, color: c.muted, fontWeight: 700 }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 600,
        color: accent ? c.accent : c.text, lineHeight: 1.1,
      }}>{value}</div>
    </div>
  );
}

function MazeBoard({ pos, trail, showWalls, peeking }) {
  const cellSize = 30;
  const W = COLS * cellSize, H = ROWS * cellSize;
  return (
    <div style={{
      margin: '0 auto', width: W, height: H, position: 'relative',
      background: c.card,
      border: `2px solid ${c.accent}66`,
      borderRadius: 10, overflow: 'hidden',
      boxShadow: `0 4px 16px ${c.accent}22, 0 0 24px ${c.accent}15 inset`,
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {MAZE.map((row, r) => row.map((v, cc) => {
          if (v === 1) return null;
          return <rect key={`f${r}${cc}`} x={cc * cellSize + 1} y={r * cellSize + 1}
            width={cellSize - 2} height={cellSize - 2} fill={`${c.rune}08`}/>;
        }))}
        {trail.slice(0, -1).map(([r, cc], i) => (
          <rect key={`t${i}`} x={cc * cellSize + 6} y={r * cellSize + 6}
            width={cellSize - 12} height={cellSize - 12} rx={3}
            fill={c.rune} opacity={0.18 + (i / trail.length) * 0.25}/>
        ))}
        {showWalls && MAZE.map((row, r) => row.map((v, cc) => {
          if (v === 0) return null;
          return <rect key={`w${r}${cc}`} x={cc * cellSize} y={r * cellSize}
            width={cellSize} height={cellSize}
            fill={c.accent} opacity={peeking ? 0.55 : 0.85}
            stroke={c.accent} strokeOpacity="0.9" strokeWidth="0.5"/>;
        }))}
        <g transform={`translate(${END[1] * cellSize}, ${END[0] * cellSize})`}>
          <rect x={4} y={4} width={cellSize - 8} height={cellSize - 8} rx={4}
            fill="none" stroke={c.accent} strokeWidth="1.5" strokeDasharray="3 2"/>
          <circle cx={cellSize / 2} cy={cellSize / 2} r="3" fill={c.accent}/>
        </g>
        <g transform={`translate(${pos[1] * cellSize + cellSize / 2}, ${pos[0] * cellSize + cellSize / 2})`}>
          <circle r="11" fill={c.rune} opacity="0.25"/>
          <circle r="8" fill="#2d2820" stroke={c.rune} strokeWidth="1.5"/>
          <circle cx="-2.5" cy="-1" r="1.5" fill={c.accent}/>
          <circle cx="2.5" cy="-1" r="1.5" fill={c.accent}/>
        </g>
      </svg>
    </div>
  );
}

function DPad({ onMove }) {
  const btn = (label, dr, dc) => (
    <button onClick={() => onMove(dr, dc)} style={{
      width: 40, height: 40, borderRadius: 10,
      background: c.card, border: `1px solid ${c.cardBorder}`,
      color: c.text, fontSize: 16, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{label}</button>
  );
  return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gridAutoRows: '40px', gap: 5, placeItems: 'center' }}>
        <div/>{btn('▲', -1, 0)}<div/>
        {btn('◀', 0, -1)}
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${c.accent}22`, border: `1px solid ${c.accent}55` }}/>
        {btn('▶', 0, 1)}
        <div/>{btn('▼', 1, 0)}<div/>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={{ flex: 1, padding: '8px 6px', borderRadius: 10, background: `${c.accent}08`, border: `1px solid ${c.cardBorder}`, textAlign: 'center' }}>
      <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 600, color: accent ? c.accent : c.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: c.muted, marginTop: 3, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function WonPanel({ score, time, hits, onRetry, onBack }) {
  return (
    <div style={{ padding: '16px 14px', borderRadius: 16, background: c.card, border: `1px solid ${c.rune}55`, textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: 2.5, color: c.muted, fontWeight: 700 }}>MAZE COMPLETE</div>
      <div style={{ fontFamily: '"Cinzel", serif', fontSize: 32, color: c.accent, fontWeight: 600, margin: '4px 0 10px' }}>
        {score}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <MiniStat label="Time" value={`${time}s`}/>
        <MiniStat label="Bumps" value={hits}/>
        <MiniStat label="Runes" value={`+${Math.floor(score / 80)}`} accent/>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onBack} style={{
          flex: 1, padding: '10px', borderRadius: 10,
          background: 'transparent', border: `1px solid ${c.cardBorder}`,
          color: c.text, fontWeight: 600, fontSize: 12, cursor: 'pointer',
        }}>Back to hub</button>
        <button onClick={onRetry} style={{
          flex: 1, padding: '10px', borderRadius: 10,
          background: c.accent, border: 'none', color: '#fff',
          fontWeight: 700, fontSize: 12, letterSpacing: 1, cursor: 'pointer',
        }}>TRY AGAIN</button>
      </div>
    </div>
  );
}

function EchoIntro({ onStart }) {
  return (
    <div style={{ padding: '18px 16px', borderRadius: 18, background: c.card, border: `1px solid ${c.cardBorder}`, textAlign: 'center' }}>
      <div style={{ fontFamily: '"Cinzel", serif', fontSize: 18, color: c.text, fontWeight: 600, marginBottom: 6 }}>
        Echo Maze
      </div>
      <div style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.5, marginBottom: 12 }}>
        The maze glows for 3 seconds, then fades.<br/>
        Hold the route in mind and walk it from memory.<br/>
        One <span style={{ color: c.rune }}>peek</span> is allowed.
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 14, fontSize: 10, color: c.muted }}>
        <div><div style={{ color: c.accent, fontWeight: 700, fontSize: 13 }}>4 min</div>duration</div>
        <div><div style={{ color: c.accent, fontWeight: 700, fontSize: 13 }}>Memory</div>domain</div>
        <div><div style={{ color: c.accent, fontWeight: 700, fontSize: 13 }}>★★★☆☆</div>level 3</div>
      </div>
      <button onClick={onStart} style={{
        width: '100%', padding: '12px 20px', borderRadius: 12,
        background: c.accent, border: 'none', color: '#fff',
        fontFamily: '"Cinzel", serif', fontSize: 14, fontWeight: 700,
        letterSpacing: 1.5, cursor: 'pointer',
        boxShadow: `0 8px 24px ${c.accent}55`,
      }}>
        ENTER THE MAZE
      </button>
    </div>
  );
}

export default function EchoMazeGame({ onBack }) {
  const [phase, setPhase] = useState('intro');
  const [countdown, setCountdown] = useState(3);
  const [pos, setPos] = useState(START);
  const [trail, setTrail] = useState([START]);
  const [hits, setHits] = useState(0);
  const [time, setTime] = useState(0);
  const [peekUsed, setPeekUsed] = useState(false);
  const [peeking, setPeeking] = useState(false);

  const begin = () => {
    setPhase('preview');
    setCountdown(3);
    setPos(START); setTrail([START]); setHits(0); setTime(0); setPeekUsed(false);
  };

  useEffect(() => {
    if (phase !== 'preview') return;
    if (countdown <= 0) { setPhase('recall'); return; }
    const t = setTimeout(() => setCountdown(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== 'recall') return;
    const t = setInterval(() => setTime(x => x + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const move = (dr, dc) => {
    if (phase !== 'recall') return;
    const [r, cc] = pos;
    const nr = r + dr, nc = cc + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    if (MAZE[nr][nc] === 1) { setHits(h => h + 1); return; }
    const np = [nr, nc];
    setPos(np);
    setTrail(t => [...t, np]);
    if (nr === END[0] && nc === END[1]) setTimeout(() => setPhase('won'), 250);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowUp') move(-1, 0);
      else if (e.key === 'ArrowDown') move(1, 0);
      else if (e.key === 'ArrowLeft') move(0, -1);
      else if (e.key === 'ArrowRight') move(0, 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pos, phase]);

  const usePeek = () => {
    if (peekUsed || phase !== 'recall') return;
    setPeekUsed(true);
    setPeeking(true);
    setTimeout(() => setPeeking(false), 1200);
  };

  const mood = phase === 'won' ? 'proud' : phase === 'recall' ? 'focused' : 'ready';
  const showWalls = phase === 'preview' || phase === 'won' || peeking;
  const score = Math.max(0, 500 - hits * 40 - time * 4 - (peekUsed ? 80 : 0));

  return (
    <div style={{
      minHeight: '100%', background: c.bg, color: c.text,
      fontFamily: 'Inter, system-ui, sans-serif', position: 'relative',
      display: 'flex', flexDirection: 'column',
    }}>
      <StoneBackdrop/>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 18px 4px', position: 'relative', zIndex: 2, flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 34, height: 34, borderRadius: 11,
          border: `1px solid ${c.cardBorder}`, background: c.card,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: c.text, cursor: 'pointer',
        }}>
          <IconBack size={18} c={c.text}/>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, letterSpacing: 2.5, color: c.muted, fontWeight: 700 }}>
            MEMORY · WORKING MEMORY
          </div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 16, fontWeight: 600, letterSpacing: 1 }}>
            ECHO MAZE
          </div>
        </div>
        <div style={{ width: 34 }}/>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '4px 18px 0', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <StatChip label="Time" value={`${time}s`}/>
        <StatChip label="Bumps" value={hits}/>
        <StatChip label="Score" value={score} accent/>
      </div>

      {/* Character status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 4px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <MazeManAvatar size={54} mood={mood} glow/>
        <div style={{ flex: 1, fontSize: 12, color: c.muted, lineHeight: 1.4 }}>
          {phase === 'intro' && 'Study the maze. Then navigate it from memory.'}
          {phase === 'preview' && <span>Memorize the path… <span style={{ color: c.accent, fontWeight: 700 }}>{countdown}s</span></span>}
          {phase === 'recall' && (peeking ? <span style={{ color: c.rune }}>Peeking…</span> : 'Swipe or use arrows. Walls are hidden.')}
          {phase === 'won' && <span style={{ color: c.rune, fontWeight: 600 }}>The path was true. +{score}</span>}
        </div>
      </div>

      {/* Maze */}
      <div style={{ flex: 1, position: 'relative', zIndex: 2, padding: '6px 14px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {phase === 'intro' ? (
          <EchoIntro onStart={begin}/>
        ) : (
          <MazeBoard pos={pos} trail={trail} showWalls={showWalls} peeking={peeking}/>
        )}
      </div>

      {/* D-pad controls */}
      {phase === 'recall' && (
        <div style={{ padding: '0 18px 10px', position: 'relative', zIndex: 2, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={usePeek} disabled={peekUsed} style={{
            padding: '10px 12px', borderRadius: 12,
            background: peekUsed ? c.card : `${c.rune}1c`,
            border: `1px solid ${peekUsed ? c.cardBorder : c.rune + '66'}`,
            color: peekUsed ? c.muted : c.rune, fontSize: 11, fontWeight: 700,
            letterSpacing: 0.5, cursor: peekUsed ? 'default' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1, minWidth: 56,
          }}>
            <span style={{ fontSize: 15 }}>👁</span>
            <span style={{ fontSize: 9, marginTop: 2 }}>PEEK{peekUsed ? ' USED' : ''}</span>
          </button>
          <DPad onMove={move}/>
        </div>
      )}

      {phase === 'won' && (
        <div style={{ padding: '0 18px 14px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <WonPanel score={score} time={time} hits={hits} onRetry={begin} onBack={onBack}/>
        </div>
      )}
    </div>
  );
}
