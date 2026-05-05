import React from 'react';
import { useApp } from '../../context/AppContext';

const XP_PER_LEVEL = 200;

function getLevel(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
function xpToNext(xp) { return XP_PER_LEVEL - (xp % XP_PER_LEVEL); }

export default function ProfileScreen() {
  const { globalXP, profileData, comicsRead, openPaywall } = useApp();

  const lv = getLevel(globalXP);
  const pct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  const badges = [
    { id: 'reader',   icon: '📖', name: 'FIRST READ',  unlocked: comicsRead >= 1 },
    { id: 'explorer', icon: '🗺️', name: 'EXPLORER',    unlocked: globalXP >= 50 },
    { id: 'scholar',  icon: '🎓', name: 'SCHOLAR',     unlocked: comicsRead >= 3 },
    { id: 'maze',     icon: '🌀', name: 'MAZE RUNNER', unlocked: globalXP >= 100 },
    { id: 'social',   icon: '🤝', name: 'SOCIAL',      unlocked: comicsRead >= 6 },
    { id: 'master',   icon: '🧠', name: 'MIND MASTER', unlocked: globalXP >= 300 },
  ];

  return (
    <div>
      {/* Avatar & XP display — editing is in Settings */}
      <div className="profile-top">
        <div className="profile-avatar-ring" style={{ cursor: 'default' }}>
          {profileData.avatar}
          <div className="profile-level-badge">LVL {lv}</div>
        </div>
        <div className="profile-username">{profileData.username}</div>
        <div className="xp-bar-wrap" style={{ maxWidth: '320px' }}>
          <div className="xp-bar-fill" style={{ width: Math.max(5, pct) + '%' }}></div>
          <span className="xp-bar-label">{globalXP % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
        </div>
        <div className="xp-subtext">{xpToNext(globalXP)} XP to Level {lv + 1}</div>
      </div>

      <div className="streak-card">
        <div style={{ fontSize: '2.5em' }}>🔥</div>
        <div className="streak-info">
          <div className="streak-title">DAILY STREAK</div>
          <div className="streak-num">{profileData.streak}</div>
          <div className="streak-sub">Day{profileData.streak !== 1 ? 's' : ''} in a row!</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.8em' }}>⚡</div>
          <div style={{ fontFamily: "'Bangers'", fontSize: '1.1em', color: '#000' }}>{globalXP} XP</div>
        </div>
      </div>

      <div className="section-heading">📊 STATS</div>
      <div className="profile-stats">
        <div className="stat-box"><div className="stat-num">{comicsRead}</div><div className="stat-label">COMICS READ</div></div>
        <div className="stat-box"><div className="stat-num">{profileData.videosWatched || 0}</div><div className="stat-label">VIDEOS WATCHED</div></div>
        <div className="stat-box"><div className="stat-num">{Math.floor(globalXP / 10)}</div><div className="stat-label">FRAGMENTS</div></div>
        <div className="stat-box"><div className="stat-num">{profileData.puzzlesSolved || 0}</div><div className="stat-label">PUZZLES SOLVED</div></div>
      </div>

      <div className="section-heading">🏅 BADGES</div>
      <div className="badges-grid">
        {badges.map(b => (
          <div key={b.id} className={`badge-item ${b.unlocked ? '' : 'locked'}`}>
            <span className="badge-icon">{b.icon}</span>
            <div className="badge-name">{b.name}</div>
          </div>
        ))}
      </div>

      <div className="section-heading">⭐ MEMBERSHIP</div>
      <div className="sub-card">
        <div className="sub-title">FREE EXPLORER</div>
        <ul className="sub-perks">
          <li>✅ 4 Free Comic Issues</li>
          <li>✅ Video Episode 1</li>
          <li>✅ Maze Game Access</li>
          <li>🔒 Premium Comics (VOL.05–08)</li>
          <li>🔒 Exclusive Videos & Interviews</li>
        </ul>
        <button className="sub-upgrade-btn" onClick={openPaywall}>⭐ GO PREMIUM — $4.99/mo</button>
      </div>
      <div style={{ height: '10px' }}></div>
    </div>
  );
}
