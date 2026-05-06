import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const XP_PER_LEVEL = 200;
const AVATARS = ['🧠', '🕵️', '🦊', '🌀', '🔮', '👁️'];

function getLevel(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
function xpToNext(xp) { return XP_PER_LEVEL - (xp % XP_PER_LEVEL); }

function MenuRow({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%',
      background: danger ? 'rgba(220,50,50,0.08)' : 'rgba(255,255,255,0.06)',
      border: `2px solid ${danger ? 'rgba(220,50,50,0.5)' : '#000'}`,
      borderRadius: 12, padding: '13px 16px',
      cursor: 'pointer', textAlign: 'left',
      boxShadow: danger ? 'none' : '3px 3px 0 #000',
      transition: 'transform 0.1s',
    }}>
      <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{
        fontFamily: "'Bangers', cursive", fontSize: '1.15em', letterSpacing: '1.5px',
        color: danger ? '#ff6b6b' : '#fff',
        textShadow: danger ? 'none' : '2px 2px 0 #000',
        flex: 1,
      }}>{label}</span>
      <span style={{ color: danger ? '#ff6b6b' : 'rgba(255,255,255,0.4)', fontSize: 18 }}>›</span>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#1a0b2e', border: '4px solid #ffe66d',
        borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 420,
        boxShadow: '8px 8px 0 #000', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{
          fontFamily: "'Bangers', cursive", fontSize: '1.6em', letterSpacing: 2,
          color: '#ffe66d', textShadow: '2px 2px 0 #000', marginBottom: 16,
        }}>{title}</div>
        {children}
        <button onClick={onClose} style={{
          marginTop: 20, width: '100%', fontFamily: "'Bangers', cursive",
          fontSize: '1.1em', letterSpacing: 2, background: '#ffe66d',
          border: '3px solid #000', borderRadius: 10, padding: '10px',
          cursor: 'pointer', boxShadow: '3px 3px 0 #000',
        }}>CLOSE</button>
      </div>
    </div>
  );
}

const MODAL_CONTENT = {
  settings: {
    title: '⚙ SETTINGS',
    body: (
      <div style={{ color: '#ccc', fontSize: 14, lineHeight: 1.7 }}>
        <p style={{ color: '#ffe66d', fontFamily: "'Bangers'", fontSize: 16, letterSpacing: 1, marginBottom: 8 }}>COMING SOON</p>
        <p>Full settings (notifications, sound, theme, language) will be available once your account is connected. Language can be toggled from the top bar.</p>
      </div>
    ),
  },
  terms: {
    title: '📄 TERMS OF USE',
    body: (
      <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
        <p style={{ marginBottom: 10 }}>By using The Maze Man, you agree to use the app for personal, non-commercial purposes only.</p>
        <p style={{ marginBottom: 10 }}>You may not reproduce, distribute, or reverse-engineer any part of the app without written permission.</p>
        <p style={{ marginBottom: 10 }}>Content in this app is for educational and entertainment purposes. It does not constitute medical or psychological advice.</p>
        <p style={{ marginBottom: 10 }}>We reserve the right to update these terms. Continued use of the app means you accept the updated terms.</p>
        <p style={{ color: '#9c9', fontSize: 12 }}>Last updated: May 2026</p>
      </div>
    ),
  },
  privacy: {
    title: '🔒 PRIVACY POLICY',
    body: (
      <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
        <p style={{ marginBottom: 10 }}>We collect only the data you provide: username, avatar, XP progress, and comics read. No personal data is sold to third parties.</p>
        <p style={{ marginBottom: 10 }}>Progress data is stored locally on your device. Cloud sync (when available) will use Supabase with row-level security — your data is accessible only to you.</p>
        <p style={{ marginBottom: 10 }}>We may use anonymized, aggregated analytics to improve the app experience.</p>
        <p style={{ marginBottom: 10 }}>You can request deletion of your data at any time via the Delete Account option.</p>
        <p style={{ color: '#9c9', fontSize: 12 }}>Last updated: May 2026</p>
      </div>
    ),
  },
  help: {
    title: '❓ HELP',
    body: (
      <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
        <p style={{ color: '#ffe66d', fontFamily: "'Bangers'", fontSize: 15, letterSpacing: 1, marginBottom: 6 }}>HOW TO PLAY</p>
        <p style={{ marginBottom: 10 }}>Navigate the home screen by tapping the door signs to reach different sections. Enter the 3D maze from the center door.</p>
        <p style={{ color: '#ffe66d', fontFamily: "'Bangers'", fontSize: 15, letterSpacing: 1, marginBottom: 6 }}>EARNING XP</p>
        <p style={{ marginBottom: 10 }}>Read comics, watch videos, and solve puzzles to earn XP and level up.</p>
        <p style={{ color: '#ffe66d', fontFamily: "'Bangers'", fontSize: 15, letterSpacing: 1, marginBottom: 6 }}>CONTACT</p>
        <p>For support: <span style={{ color: '#ffe66d' }}>support@mazeman.app</span></p>
      </div>
    ),
  },
  export: {
    title: '📤 DATA EXPORT',
    body: (
      <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
        <p style={{ color: '#ffe66d', fontFamily: "'Bangers'", fontSize: 15, letterSpacing: 1, marginBottom: 8 }}>YOUR DATA</p>
        <p style={{ marginBottom: 10 }}>Full data export will be available once cloud sync is enabled. Your current local data includes:</p>
        <ul style={{ paddingLeft: 18, marginBottom: 10 }}>
          <li>Username &amp; avatar</li>
          <li>XP &amp; level</li>
          <li>Comics read count</li>
          <li>Streak &amp; puzzle stats</li>
        </ul>
        <p style={{ color: '#9c9', fontSize: 12 }}>Cloud export coming with Supabase integration.</p>
      </div>
    ),
  },
  feedback: {
    title: '💬 YOUR FEEDBACK',
    body: (
      <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
        <p style={{ marginBottom: 12 }}>We'd love to hear what you think about The Maze Man!</p>
        <textarea placeholder="Tell us what you love, what's missing, or what confused you..." style={{
          width: '100%', minHeight: 100, background: 'rgba(255,255,255,0.07)',
          border: '2px solid #ffe66d55', borderRadius: 10, padding: 12,
          color: '#fff', fontSize: 13, resize: 'vertical', fontFamily: 'Comic Neue, sans-serif',
        }}/>
        <button style={{
          marginTop: 12, width: '100%', fontFamily: "'Bangers', cursive",
          fontSize: '1.1em', letterSpacing: 2, background: '#4ecdc4',
          border: '3px solid #000', borderRadius: 10, padding: '10px',
          cursor: 'pointer', boxShadow: '3px 3px 0 #000',
        }} onClick={() => alert('Thank you! Feedback submission coming soon.')}>
          SEND FEEDBACK
        </button>
      </div>
    ),
  },
};

export default function ProfileScreen() {
  const { globalXP, profileData, setProfileData, saveProfile, playSfx, openPaywall } = useApp();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const lv = getLevel(globalXP);
  const pct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  function setAvatar(emoji) {
    playSfx('click');
    const updated = { ...profileData, avatar: emoji };
    setProfileData(updated);
    saveProfile(updated, globalXP);
  }

  function openModal(key) { playSfx('click'); setActiveModal(key); }
  function closeModal() { setActiveModal(null); setDeleteConfirm(false); }

  const badges = [
    { id: 'explorer', icon: '🗺️', name: 'EXPLORER',    unlocked: globalXP >= 50 },
    { id: 'maze',     icon: '🌀', name: 'MAZE RUNNER', unlocked: globalXP >= 100 },
    { id: 'master',   icon: '🧠', name: 'MIND MASTER', unlocked: globalXP >= 300 },
  ];

  const modal = activeModal && MODAL_CONTENT[activeModal];

  return (
    <div>
      <div className="profile-top">
        <div className="profile-avatar-ring" onClick={() => setShowAvatarPicker(v => !v)}>
          {profileData.avatar}
          <div className="profile-level-badge">LVL {lv}</div>
        </div>
        {showAvatarPicker && (
          <div className="avatar-picker">
            {AVATARS.map(e => (
              <span key={e} className={`avatar-opt ${profileData.avatar === e ? 'selected' : ''}`} onClick={() => setAvatar(e)}>{e}</span>
            ))}
          </div>
        )}
        <div className="profile-username">{profileData.username}</div>
        <div className="xp-bar-wrap" style={{maxWidth:'320px'}}>
          <div className="xp-bar-fill" style={{width: Math.max(5, pct) + '%'}}></div>
          <span className="xp-bar-label">{globalXP % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
        </div>
        <div className="xp-subtext">{xpToNext(globalXP)} XP to Level {lv + 1}</div>
      </div>

      <div className="streak-card">
        <div style={{fontSize:'2.5em'}}>🔥</div>
        <div className="streak-info">
          <div className="streak-title">DAILY STREAK</div>
          <div className="streak-num">{profileData.streak}</div>
          <div className="streak-sub">Day{profileData.streak !== 1 ? 's' : ''} in a row!</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:'1.8em'}}>⚡</div>
          <div style={{fontFamily:"'Bangers'",fontSize:'1.1em',color:'#000'}}>{globalXP} XP</div>
        </div>
      </div>

      <div className="section-heading">📊 STATS</div>
      <div className="profile-stats">
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
          <li>🔒 Exclusive Videos &amp; Interviews</li>
        </ul>
        <button className="sub-upgrade-btn" onClick={openPaywall}>⭐ GO PREMIUM — $4.99/mo</button>
      </div>

      {deleteConfirm && (
        <Modal title="🗑️ DELETE ACCOUNT" onClose={closeModal}>
          <p style={{ color: '#ccc', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
            This will permanently delete your profile, XP, and progress. This action cannot be undone.
          </p>
          <button onClick={closeModal} style={{
            width: '100%', fontFamily: "'Bangers', cursive", fontSize: '1.1em',
            letterSpacing: 2, background: '#ff6b6b', border: '3px solid #000',
            borderRadius: 10, padding: '10px', cursor: 'pointer',
            boxShadow: '3px 3px 0 #000', color: '#fff', marginBottom: 10,
          }} onClick={() => alert('Account deletion will be available once cloud accounts are enabled.')}>
            YES, DELETE EVERYTHING
          </button>
        </Modal>
      )}
    </div>
  );
}
