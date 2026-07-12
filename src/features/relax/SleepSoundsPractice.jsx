import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { SUB, FAINT } from './PracticeShell';
import { assetUrl } from '../../lib/assetUrl';

/*
 * Sleep Sounds — a looping ambient track to play while winding down.
 * Only one track for now (Rain); more can be added to TRACKS later.
 */

const ACCENT = '#7b86c8';

const TRACKS = [
  { id: 'rain', icon: '🌧️', en: 'Rain', ar: 'مطر', src: 'Assets/sounds/rain.mp3' },
];

export default function SleepSoundsPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const audioRef = useRef(null);
  const [track, setTrack] = useState(TRACKS[0].id);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const t = useMemo(() => ({
    title: isAr ? 'أصوات النوم' : 'Sleep Sounds',
    intro: isAr ? 'شغّل صوتاً هادئاً في الخلفية بينما تسترخي أو تستعد للنوم.'
      : 'Play a calm ambient sound in the background while you unwind or drift off.',
    play: isAr ? 'تشغيل' : 'Play',
    pause: isAr ? 'إيقاف' : 'Pause',
    volume: isAr ? 'مستوى الصوت' : 'Volume',
    back: isAr ? 'رجوع' : 'Back',
    credit: isAr ? 'تسجيل مطر — ملكية عامة (Wikimedia Commons).' : 'Rain recording — public domain (Wikimedia Commons).',
  }), [isAr]);

  const current = TRACKS.find((tr) => tr.id === track) ?? TRACKS[0];

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, track]);

  // Stop playback when leaving the practice.
  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  const toggle = () => { playSfx?.('click'); setPlaying((p) => !p); };

  return (
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>
      <audio ref={audioRef} src={assetUrl(current.src)} loop preload="none" />

      <div className="rxp-body rxp-center">
        <div className="rxp-hero">{current.icon}</div>
        <div className="slp-intro">{t.intro}</div>

        <div className="slp-tracks">
          {TRACKS.map((tr) => (
            <button
              key={tr.id}
              className={`slp-track${tr.id === track ? ' on' : ''}`}
              onClick={() => { playSfx?.('click'); setTrack(tr.id); }}
            >
              <span className="slp-track-ic">{tr.icon}</span>
              <span>{isAr ? tr.ar : tr.en}</span>
            </button>
          ))}
        </div>

        <button className="slp-play" onClick={toggle} aria-label={playing ? t.pause : t.play}>
          {playing ? '⏸' : '▶'}
        </button>
        <div className="slp-playLabel">{playing ? t.pause : t.play}</div>

        <div className="slp-volume">
          <span className="slp-volIc">🔉</span>
          <input
            type="range" min="0" max="1" step="0.01" value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label={t.volume}
          />
          <span className="slp-volIc">🔊</span>
        </div>

        <div className="rxp-tip">{t.credit}</div>
      </div>
    </PracticeShell>
  );
}

const CSS = `
.slp-intro { font-size:15px; color:${SUB}; line-height:1.7; max-width:340px; }
.slp-tracks { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
.slp-track { display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:999px; border:2px solid #d8dbf0; background:#fff; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
.slp-track.on { border-color:${ACCENT}; background:#eef0fb; color:#2d2f52; }
.slp-track-ic { font-size:18px; }
.slp-play { width:84px; height:84px; border-radius:50%; border:none; background:${ACCENT}; color:#fff; font-size:30px; cursor:pointer; box-shadow:3px 3px 0 rgba(26,18,8,0.14); margin-top:6px; }
.slp-playLabel { font-size:13px; font-weight:700; color:${SUB}; margin-top:-8px; }
.slp-volume { display:flex; align-items:center; gap:10px; width:100%; max-width:280px; margin-top:8px; }
.slp-volume input[type="range"] { flex:1; }
.slp-volIc { font-size:15px; }

[data-home-theme='dark'] .slp-track { background:#211a10; border-color:rgba(123,134,200,0.3); color:#c9b384; }
[data-home-theme='dark'] .slp-track.on { background:#2a2d4a; color:#e4e6fa; }
`;
