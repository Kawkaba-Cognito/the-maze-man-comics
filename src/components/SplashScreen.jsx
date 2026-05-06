import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const AVATARS = ['🧠', '🕵️', '🦊', '🌀', '🔮', '👁️'];

function SettingsRow({ icon, label, value, onClick, danger }) {
  return (
    <button onClick={onClick} className={`stg-row${danger ? ' stg-row--danger' : ''}`}>
      <span className="stg-row-icon">{icon}</span>
      <span className="stg-row-label">{label}</span>
      {value && <span className="stg-row-value">{value}</span>}
      <span className="stg-row-chevron">›</span>
    </button>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div className="stg-section">
      <div className="stg-section-title">{title}</div>
      <div className="stg-section-body">{children}</div>
    </div>
  );
}

function SettingsModal({ title, onClose, children }) {
  return (
    <div className="stg-modal-backdrop" onClick={onClose}>
      <div className="stg-modal-box" onClick={e => e.stopPropagation()}>
        <div className="stg-modal-header">
          <span className="stg-modal-title">{title}</span>
          <button className="stg-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="stg-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function SplashScreen({ onDone }) {
  const { currentLang, toggleLang, profileData, setProfileData, saveProfile, globalXP, comicsRead } = useApp();
  const isAr = currentLang === 'ar';
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [subModal, setSubModal] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  function handleStart() { setFading(true); setTimeout(onDone, 700); }
  function handleQuit() { setQuitting(true); setTimeout(() => { try { window.close(); } catch (_) {} }, 400); }

  function setAvatar(emoji) {
    const updated = { ...profileData, avatar: emoji };
    setProfileData(updated);
    saveProfile(updated, globalXP, comicsRead);
  }

  const XP_PER_LEVEL = 200;
  const level = Math.floor(globalXP / XP_PER_LEVEL) + 1;
  const xpPct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  return (
    <div className={`splash-screen${fading || quitting ? ' splash-out' : ''}`}>

      <h1 className="splash-title">MAZE MAN</h1>

      <div className="splash-bottom">
        {ready ? (
          <>
            <button
              className="splash-start"
              style={isAr ? { fontFamily: "'Cairo', sans-serif", letterSpacing: 0 } : {}}
              onClick={handleStart}
            >
              {isAr ? 'ابدأ' : 'START'}
            </button>

            <div className="splash-sub-btns">
              <button className="splash-sub-btn" onClick={() => setShowSettings(true)}>
                {isAr ? 'الإعدادات' : 'SETTINGS'}
              </button>
              <span className="splash-sub-divider">·</span>
              <button className="splash-sub-btn" onClick={() => setShowAbout(true)}>
                {isAr ? 'عن التطبيق' : 'ABOUT'}
              </button>
              <span className="splash-sub-divider">·</span>
              <button className="splash-sub-btn splash-sub-btn--quit" onClick={handleQuit}>
                {isAr ? 'خروج' : 'QUIT'}
              </button>
            </div>
          </>
        ) : (
          <p className="splash-loading">loading<span className="splash-ellipsis" /></p>
        )}
      </div>

      {/* ── FULL-SCREEN SETTINGS ── */}
      {showSettings && (
        <div className="stg-screen" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="stg-topbar">
            <button className="stg-back" onClick={() => setShowSettings(false)}>‹</button>
            <span className="stg-topbar-title">{isAr ? 'الإعدادات' : 'Settings'}</span>
          </div>

          <div className="stg-scroll">

            {/* Account */}
            <div className="stg-account-card">
              <div className="stg-avatar">{profileData.avatar}</div>
              <div className="stg-account-info">
                <div className="stg-account-name">{profileData.username}</div>
                <div className="stg-account-level">Level {level} · {globalXP} XP</div>
                <div className="stg-xp-bar">
                  <div className="stg-xp-fill" style={{ width: xpPct + '%' }} />
                </div>
              </div>
            </div>

            <div className="stg-avatar-row">
              {AVATARS.map(e => (
                <button
                  key={e}
                  className={`stg-avatar-opt${profileData.avatar === e ? ' active' : ''}`}
                  onClick={() => setAvatar(e)}
                >{e}</button>
              ))}
            </div>

            <SettingsSection title={isAr ? 'التفضيلات' : 'Preferences'}>
              <SettingsRow
                icon="🌐"
                label={isAr ? 'اللغة' : 'Language'}
                value={isAr ? 'العربية' : 'English'}
                onClick={toggleLang}
              />
            </SettingsSection>

            <SettingsSection title={isAr ? 'الدعم' : 'Support'}>
              <SettingsRow icon="❓" label={isAr ? 'المساعدة' : 'Help'} onClick={() => setSubModal('help')} />
              <SettingsRow icon="💬" label={isAr ? 'ملاحظاتك' : 'Your Feedback'} onClick={() => setSubModal('feedback')} />
            </SettingsSection>

            <SettingsSection title={isAr ? 'قانوني' : 'Legal'}>
              <SettingsRow icon="📄" label={isAr ? 'شروط الاستخدام' : 'Terms of Use'} onClick={() => setSubModal('terms')} />
              <SettingsRow icon="🔒" label={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} onClick={() => setSubModal('privacy')} />
            </SettingsSection>

            <SettingsSection title={isAr ? 'البيانات' : 'Data'}>
              <SettingsRow icon="📤" label={isAr ? 'تصدير بياناتي' : 'Export My Data'} onClick={() => setSubModal('export')} />
              <SettingsRow icon="🗑️" label={isAr ? 'حذف الحساب' : 'Delete Account'} onClick={() => setSubModal('delete')} danger />
            </SettingsSection>

          </div>
        </div>
      )}

      {/* Sub-modals */}
      {subModal === 'help' && (
        <SettingsModal title={isAr ? 'المساعدة' : 'Help'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text"><strong>{isAr ? 'كيفية اللعب' : 'How to play'}</strong></p>
          <p className="stg-modal-text">{isAr ? 'اضغط على أبواب الشاشة الرئيسية للوصول إلى الأقسام. ادخل المتاهة ثلاثية الأبعاد من الزر المركزي.' : 'Tap the door signs on the home screen to reach sections. Enter the 3D maze from the centre button.'}</p>
          <p className="stg-modal-text" style={{ marginTop: 12 }}><strong>{isAr ? 'التواصل' : 'Contact'}</strong></p>
          <p className="stg-modal-text">support@mazeman.app</p>
        </SettingsModal>
      )}

      {subModal === 'feedback' && (
        <SettingsModal title={isAr ? 'ملاحظاتك' : 'Your Feedback'} onClose={() => setSubModal(null)}>
          <textarea className="stg-textarea" placeholder={isAr ? 'أخبرنا برأيك…' : 'Tell us what you think…'} />
          <button className="stg-send-btn" onClick={() => { alert('Coming soon!'); setSubModal(null); }}>
            {isAr ? 'إرسال' : 'Send Feedback'}
          </button>
        </SettingsModal>
      )}

      {subModal === 'terms' && (
        <SettingsModal title={isAr ? 'شروط الاستخدام' : 'Terms of Use'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'باستخدامك للتطبيق توافق على استخدامه لأغراض شخصية غير تجارية فقط.' : 'By using the app you agree to use it for personal, non-commercial purposes only.'}</p>
          <p className="stg-modal-text" style={{ marginTop: 10 }}>{isAr ? 'المحتوى لأغراض تعليمية وترفيهية ولا يُعدّ نصيحة طبية أو نفسية.' : 'Content is for educational and entertainment purposes. It does not constitute medical advice.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'آخر تحديث: مايو 2026' : 'Last updated: May 2026'}</p>
        </SettingsModal>
      )}

      {subModal === 'privacy' && (
        <SettingsModal title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'نجمع فقط البيانات التي تقدمها: الاسم، الصورة الرمزية، تقدم XP.' : 'We collect only data you provide: username, avatar, XP progress.'}</p>
          <p className="stg-modal-text" style={{ marginTop: 10 }}>{isAr ? 'بيانات التقدم مخزنة محلياً على جهازك.' : 'Progress data is stored locally on your device.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'آخر تحديث: مايو 2026' : 'Last updated: May 2026'}</p>
        </SettingsModal>
      )}

      {subModal === 'export' && (
        <SettingsModal title={isAr ? 'تصدير البيانات' : 'Export My Data'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'تصدير البيانات الكاملة سيكون متاحاً مع المزامنة السحابية.' : 'Full data export will be available once cloud sync is enabled.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'قريباً مع Supabase.' : 'Coming with Supabase integration.'}</p>
        </SettingsModal>
      )}

      {subModal === 'delete' && (
        <SettingsModal title={isAr ? 'حذف الحساب' : 'Delete Account'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'سيؤدي هذا إلى حذف ملفك الشخصي وتقدمك بشكل دائم.' : 'This will permanently delete your profile and progress.'}</p>
          <button className="stg-delete-btn" onClick={() => { alert('Account deletion available once cloud accounts are enabled.'); setSubModal(null); }}>
            {isAr ? 'نعم، احذف كل شيء' : 'Yes, Delete Everything'}
          </button>
        </SettingsModal>
      )}

      {/* About */}
      {showAbout && (
        <SettingsModal title={isAr ? 'عن التطبيق' : 'About'} onClose={() => setShowAbout(false)}>
          <p className="stg-modal-text"><strong>{isAr ? 'رجل المتاهة' : 'The Maze Man'}</strong></p>
          <p className="stg-modal-text">{isAr ? 'تطبيق كوميكس تفاعلي ثنائي اللغة يستكشف علم النفس.' : 'A bilingual interactive comics app exploring psychology through stories and games.'}</p>
          <p className="stg-modal-text" style={{ marginTop: 10 }}>{isAr ? 'الإصدار 1.0 — مايو 2026' : 'Version 1.0 — May 2026'}</p>
          <p className="stg-modal-subtext">{isAr ? 'تصميم وتطوير: كوكبة كوغنيتو' : 'Design & Dev: Kawkaba Cognito'}</p>
        </SettingsModal>
      )}

    </div>
  );
}
