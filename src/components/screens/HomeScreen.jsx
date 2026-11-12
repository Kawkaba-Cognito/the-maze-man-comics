import React, { useState, useCallback, Suspense, useMemo } from 'react';
import { Lock, Check, CaretDown, X, Sparkle } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import NayzakHeader from '../shared/NayzakHeader';
import DomainGameStage from '../../features/training/shared/DomainGameStage';
import { getLazyGame } from '../../features/training/lazyGames';
import { EXPERIMENTS } from '../training/trainingExperimentsData';

const DOMAINS_LIST = [
  { id: 'attention', en: 'Attention', ar: 'الانتباه', icon: '🎯', color: '#ff7800', bg: '#fff7ed', descAr: 'البحث البصري، التركيز، وتثبيط المشتتات', descEn: 'Visual search, focus & distractor suppression' },
  { id: 'speed', en: 'Speed', ar: 'السرعة', icon: '⚡', color: '#ffc21c', bg: '#fefce8', descAr: 'المعالجة السريعة، الحساب، والرد الفوري', descEn: 'Rapid processing, math & reaction time' },
  { id: 'memory', en: 'Memory', ar: 'الذاكرة', icon: '🧠', color: '#2586f7', bg: '#eff6ff', descAr: 'الذاكرة البصرية، العاملة، وتسلسل القصص', descEn: 'Working memory, sequence & visual recall' },
  { id: 'language', en: 'Language', ar: 'اللغة', icon: '💬', color: '#10b981', bg: '#ecfdf5', descAr: 'المعجم اللغوي، المترادفات، والمعرفة العامة', descEn: 'Vocabulary, word association & trivia' },
  { id: 'reasoning', en: 'Reasoning', ar: 'الاستدلال', icon: '🧩', color: '#8b5cf6', bg: '#f5f3ff', descAr: 'حل المتاهات، الاستنتاج المنطقي، والتخطيط', descEn: 'Maze solving, deduction & strategic planning' },
  { id: 'flexibility', en: 'Flexibility', ar: 'المرونة', icon: '🔄', color: '#ec4899', bg: '#fdf2f8', descAr: 'التبديل بين القواعد، والتكيف مع التغيير', descEn: 'Task switching & cognitive agility' },
];

// Serpentine zig-zag positions: center -> left -> center -> right -> repeat
const POSITIONS = ['pos-center', 'pos-left', 'pos-center', 'pos-right'];

function GameLoading({ isAr }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FAF7F2',
        color: '#0F172A',
        fontFamily: "'Cairo', 'Outfit', system-ui, sans-serif",
        fontSize: 17,
        fontWeight: 800,
        gap: 10,
      }}
    >
      <span style={{ fontSize: 34 }}>☄️</span>
      <span>{isAr ? 'جارِ التحميل…' : 'Loading…'}</span>
    </div>
  );
}

export default function HomeScreen() {
  const { currentLang, playSfx, setActiveModalGame } = useApp();
  const isAr = currentLang === 'ar';

  const [activeDomainId, setActiveDomainId] = useState('attention');
  const [showDomainPicker, setShowDomainPicker] = useState(false);
  const [activeGameKey, setActiveGameKey] = useState(null);

  const currentDomain = useMemo(() => {
    return DOMAINS_LIST.find((d) => d.id === activeDomainId) || DOMAINS_LIST[0];
  }, [activeDomainId]);

  // Games in the chosen domain
  const domainGames = useMemo(() => {
    return EXPERIMENTS.filter((exp) => exp.domainId === activeDomainId);
  }, [activeDomainId]);

  const GameView = activeGameKey ? getLazyGame(activeGameKey) : null;

  const handleLaunchGame = useCallback((exp, isLocked) => {
    if (isLocked) {
      playSfx?.('error');
      return;
    }
    playSfx?.('pop');
    setActiveGameKey(exp.gameKey);
    setActiveModalGame?.(exp.gameKey);
  }, [playSfx, setActiveModalGame]);

  const handleExitGame = useCallback(() => {
    playSfx?.('pop');
    setActiveGameKey(null);
    setActiveModalGame?.(null);
  }, [playSfx, setActiveModalGame]);

  // Active game modal
  if (activeGameKey && GameView) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: '#070b14' }}>
        <DomainGameStage domainId={activeDomainId}>
          <Suspense fallback={<GameLoading isAr={isAr} />}>
            <GameView onBack={handleExitGame} />
          </Suspense>
        </DomainGameStage>
      </div>
    );
  }

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <div className="duo-home-container">
        {/* Duolingo Section / Category Selector Dropdown Button */}
        <div
          className="duo-section-selector"
          onClick={() => {
            playSfx?.('tap');
            setShowDomainPicker(true);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="duo-sec-info">
            <div
              className="duo-sec-icon-circle"
              style={{ background: currentDomain.bg, borderColor: currentDomain.color }}
            >
              {currentDomain.icon}
            </div>
            <div className="duo-sec-titles">
              <span className="duo-sec-kicker">
                {isAr ? 'القسم الحالي' : 'CURRENT SECTION'}
              </span>
              <span className="duo-sec-name">
                {isAr ? currentDomain.ar : currentDomain.en} · {domainGames.length} {isAr ? 'ألعاب' : 'games'}
              </span>
            </div>
          </div>
          <span className="duo-sec-change-btn">
            {isAr ? 'تغيير القسم' : 'Change'} <CaretDown size={14} weight="bold" />
          </span>
        </div>

        {/* Mascot Speech Bubble with Section Overview */}
        <div className="duo-mascot-card">
          <div className="duo-mascot-avatar">{currentDomain.icon}</div>
          <div className="duo-mascot-speech">
            {isAr ? (
              <>
                أهلاً بك في قسم <span>{currentDomain.ar}</span>! {currentDomain.descAr}.
              </>
            ) : (
              <>
                Welcome to <span>{currentDomain.en}</span>! {currentDomain.descEn}.
              </>
            )}
          </div>
        </div>

        {/* Duolingo Progression Ladder for the Selected Domain */}
        <div className="duo-path-wrapper">
          {domainGames.map((exp, index) => {
            const isCompleted = index === 0;
            const isActive = index === 1 || domainGames.length === 1;
            const isLocked = index > 1;
            const posClass = POSITIONS[index % POSITIONS.length];
            const isFinalStage = index === domainGames.length - 1;

            return (
              <div key={exp.id} className={`duo-step-item ${posClass}`}>
                {/* Active Tooltip Badge */}
                {isActive && (
                  <div className="duo-active-bubble">
                    {isAr ? 'المرحلة التالية!' : 'NEXT STAGE!'}
                  </div>
                )}

                {/* Chunky 3D Duolingo Node Button */}
                <button
                  type="button"
                  className={`duo-node-btn ${isCompleted ? 'is-completed' : ''} ${isActive ? 'is-active' : ''} ${isLocked ? 'is-locked' : ''}`}
                  onClick={() => handleLaunchGame(exp, isLocked)}
                  aria-label={isAr ? exp.titleAr : exp.titleEn}
                >
                  {isFinalStage && <div className="duo-node-ring" />}

                  {isCompleted ? (
                    <Check size={32} weight="bold" color="#ffffff" />
                  ) : isLocked ? (
                    <Lock size={28} weight="bold" color="#9e9e9e" />
                  ) : (
                    <span>{currentDomain.icon}</span>
                  )}
                </button>

                {/* Node Title & Stage Tag */}
                <div className="duo-node-label">
                  <div style={{ fontSize: 11, fontWeight: 900, color: '#ff7800', marginBottom: 2 }}>
                    {exp.expNum}
                  </div>
                  <div>{isAr ? exp.titleAr : exp.titleEn}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Duolingo Modal Sheet: Switch Section / Category */}
      {showDomainPicker && (
        <div
          className="duo-modal-overlay"
          onClick={() => setShowDomainPicker(false)}
        >
          <div
            className="duo-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="duo-modal-head">
              <h2 className="duo-modal-title">
                {isAr ? 'اختر المهارة أو القسم' : 'Choose Section'}
              </h2>
              <button
                type="button"
                className="duo-modal-close"
                onClick={() => setShowDomainPicker(false)}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            <div className="duo-modal-items">
              {DOMAINS_LIST.map((domain) => {
                const isSelected = domain.id === activeDomainId;
                const gamesCount = EXPERIMENTS.filter((e) => e.domainId === domain.id).length;

                return (
                  <div
                    key={domain.id}
                    className={`duo-sheet-item ${isSelected ? 'is-active' : ''}`}
                    onClick={() => {
                      playSfx?.('pop');
                      setActiveDomainId(domain.id);
                      setShowDomainPicker(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        className="duo-sec-icon-circle"
                        style={{ background: domain.bg, borderColor: domain.color }}
                      >
                        {domain.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#2a1a16' }}>
                          {isAr ? domain.ar : domain.en}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#777777', marginTop: 2 }}>
                          {isAr ? domain.descAr : domain.descEn}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="duo-cat-badge-count">
                        {gamesCount} {isAr ? 'ألعاب' : 'games'}
                      </span>
                      {isSelected && <Check size={20} weight="bold" color="#2586f7" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
