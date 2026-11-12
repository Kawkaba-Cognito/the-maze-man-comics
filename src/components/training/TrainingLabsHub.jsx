import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EXPERIMENTS, CATEGORY_CHIPS, LABS_METRICS } from './trainingExperimentsData';
import { NAYZAK_CAST } from '../../data/nayzakCast';
import { assetUrl } from '../../lib/assetUrl';
import ExperimentArtwork from './ExperimentArtwork';
import NeuralRadarHeroVisual from './NeuralRadarHeroVisual';
import NayzakFamilyModal from '../modals/NayzakFamilyModal';
import '../../styles/trainingLabs.css';

export default function TrainingLabsHub({
  onOpenDomain,
  onOpenAssessment,
  onOpenGame,
  onSwitchToOrbits,
}) {
  const { currentLang, toggleLang, playSfx, switchTab, openPaywall } = useApp();
  const isAr = currentLang === 'ar';

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState('cc0'); // 'cc0' | 'vector'
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Captain Nayzak - Lead Clinical Cognitive Coach
  const coach = useMemo(() => {
    return (
      NAYZAK_CAST.find((c) => c.id === 'coach') || {
        nameEn: 'Captain Nayzak',
        nameAr: 'الكابتن نيزك',
        roleEn: 'Head Cognitive Coach',
        roleAr: 'مدرب الأداء الإدراكي',
        avatarUrl: assetUrl('Assets/brand/characters/father-coach-avatar.jpg'),
        quoteEn: 'One daily session builds a resilient mind. Ready for today’s round?',
        quoteAr: 'جلسة يومية واحدة تصنع عقلاً حاداً ومستعداً. هل أنت جاهز لتحدي اليوم؟',
      }
    );
  }, []);

  // Keyboard shortcut: '/' to focus search, 'Escape' to clear
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        playSfx?.('tap');
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSfx]);

  // Instant filter for experiments with zero layout jitter
  const filteredExperiments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return EXPERIMENTS.filter((exp) => {
      if (activeCategory !== 'all' && exp.domainId !== activeCategory) {
        return false;
      }

      if (!q) return true;

      const matchTitle =
        exp.titleEn.toLowerCase().includes(q) ||
        (exp.titleAr && exp.titleAr.toLowerCase().includes(q));
      const matchDesc =
        exp.descEn.toLowerCase().includes(q) ||
        (exp.descAr && exp.descAr.toLowerCase().includes(q));
      const matchParadigm =
        (exp.paradigm && exp.paradigm.toLowerCase().includes(q)) ||
        (exp.paradigmAr && exp.paradigmAr.toLowerCase().includes(q));
      const matchTag =
        exp.tagEn.toLowerCase().includes(q) ||
        (exp.tagAr && exp.tagAr.toLowerCase().includes(q));
      const matchExpId = exp.expNum && exp.expNum.toLowerCase().includes(q);

      return matchTitle || matchDesc || matchParadigm || matchTag || matchExpId;
    });
  }, [activeCategory, searchQuery]);

  const handleCardClick = (exp) => {
    playSfx?.('select');
    if (exp.id === 'puzzles') {
      switchTab('puzzles');
      return;
    }
    if (onOpenGame && exp.gameKey) {
      onOpenGame(exp.gameKey, exp.domainId);
    } else {
      onOpenDomain?.(exp.domainId);
    }
  };

  const handleClearSearch = () => {
    playSfx?.('click');
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <div className="training-labs-root" dir={isAr ? 'rtl' : 'ltr'}>
      {/* =================================================================
          1. Sticky Top Navigation Bar (Authentic Google Labs Style)
         ================================================================= */}
      <nav className="labs-top-bar" aria-label={isAr ? 'شريط التنقل العلوي' : 'Top Navigation Bar'}>
        <div className="labs-top-bar-inner">
          {/* Left: Google Labs Science Flask Brand Mark & Live Chip */}
          <div className="labs-top-brand">
            <div className="labs-brand-lockup" title={isAr ? 'مختبر نيزك للأبحاث الإدراكية' : 'Nayzak Cognitive Labs'}>
              {/* Google Labs Iconic Science Flask Icon */}
              <div className="labs-flask-badge" aria-hidden="true">
                <svg
                  className="labs-flask-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 2v7.31L4.69 16.5A2 2 0 0 0 6.3 19.5h11.4a2 2 0 0 0 1.61-3l-5.31-7.19V2" />
                  <path d="M8.5 2h7" />
                  <path d="M7 16h10" />
                </svg>
              </div>

              {/* Wordmark */}
              <div className="labs-brand-text">
                <span className="labs-brand-title">
                  {isAr ? 'مختبر نيزك' : 'Nayzak Labs'}
                </span>
                <span className="labs-brand-pill">LABS</span>
              </div>
            </div>

            <span className="labs-top-bar-divider" />

            {/* Google Labs Style Horizontal Navigation Links */}
            <div className="labs-top-nav-links">
              <button
                type="button"
                className="labs-top-nav-link is-active"
                onClick={() => {
                  playSfx?.('tap');
                  document.querySelector('.labs-section-header')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {isAr ? 'التجارب' : 'Experiments'}
              </button>
              <button
                type="button"
                className="labs-top-nav-link"
                onClick={() => {
                  playSfx?.('click');
                  onOpenAssessment?.();
                }}
              >
                {isAr ? 'التقييم الشامل' : 'Assessment'}
              </button>
              <button
                type="button"
                className="labs-top-nav-link"
                onClick={() => {
                  playSfx?.('click');
                  switchTab('workout');
                }}
              >
                {isAr ? 'التمرين اليومي' : 'Daily Workout'}
              </button>
            </div>
          </div>

          {/* Right: Language & Hub View Mode */}
          <div className="labs-top-actions">
            {/* Nayzak Pro Upgrade Modal Trigger */}
            <button
              type="button"
              className="labs-top-pro-btn"
              onClick={() => {
                playSfx?.('select');
                openPaywall?.();
              }}
              title={isAr ? 'ترقية إلى نيزك PRO — فتح كافة الإمكانيات' : 'Upgrade to Nayzak PRO'}
            >
              <span className="labs-pro-star" aria-hidden="true">⭐</span>
              <span>{isAr ? 'نيزك PRO' : 'Nayzak PRO'}</span>
            </button>

            {/* Direct Language Switcher */}
            <button
              type="button"
              className="labs-top-lang-btn"
              onClick={() => {
                playSfx?.('click');
                toggleLang?.();
              }}
              title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <span aria-hidden="true">🌐</span>
              <span>{isAr ? 'English' : 'العربية'}</span>
            </button>

            {/* Hub View Mode Toggle: Grid vs 3D Orbits */}
            <button
              type="button"
              className="labs-top-toggle-btn"
              onClick={() => {
                playSfx?.('click');
                onSwitchToOrbits?.();
              }}
              aria-label={isAr ? 'المدارات 3D' : 'Orbits 3D'}
              title={isAr ? 'عرض مدارات المجالات ثلاثية الأبعاد' : '3D Planetary Orbits View'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M3.6 9h16.8M3.6 15h16.8" />
                <ellipse cx="12" cy="12" rx="4" ry="9" />
              </svg>
              <span className="labs-toggle-text">{isAr ? 'المدارات' : 'Orbits'}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="training-labs-container">
        {/* =================================================================
            2. Google Labs Unified Featured Hero Banner (Single, Cinematic Hero)
           ================================================================= */}
        <section className="labs-featured-hero labs-spotlight-card" aria-label="Featured Benchmark">
          {/* Atmospheric Nayzak Family Warm Background (Google Flow Animated Observatory) */}
          <div className="labs-hero-family-backdrop" aria-hidden="true">
            <img
              src={assetUrl('Assets/brand/nayzak-family-observatory-1.webp')}
              alt=""
              className="labs-hero-family-img"
            />
            {/* Animated Warm Hearth Glow Aura */}
            <div className="labs-hero-hearth-glow" />
            
            {/* Animated Celestial Stardust & Fireflies Particle Canvas */}
            <svg
              className="labs-hero-stardust-svg"
              viewBox="0 0 1000 400"
              preserveAspectRatio="none"
            >
              {/* Constellation Sparkles */}
              <circle cx="280" cy="90" r="2.2" className="stardust-dot stardust-p1" />
              <circle cx="340" cy="70" r="3.0" className="stardust-dot stardust-p2" />
              <circle cx="410" cy="110" r="2.0" className="stardust-dot stardust-p3" />
              <circle cx="480" cy="60" r="2.8" className="stardust-dot stardust-p4" />
              <circle cx="560" cy="95" r="2.4" className="stardust-dot stardust-p1" />
              <circle cx="640" cy="80" r="3.2" className="stardust-dot stardust-p2" />
              <circle cx="720" cy="120" r="2.0" className="stardust-dot stardust-p3" />
              
              {/* Hearth Amber Fireflies */}
              <circle cx="180" cy="240" r="2.5" className="stardust-dot hearth-spark hearth-s1" />
              <circle cx="220" cy="220" r="3.2" className="stardust-dot hearth-spark hearth-s2" />
              <circle cx="205" cy="180" r="2.0" className="stardust-dot hearth-spark hearth-s3" />
              <circle cx="250" cy="200" r="2.8" className="stardust-dot hearth-spark hearth-s1" />
              <circle cx="160" cy="190" r="2.2" className="stardust-dot hearth-spark hearth-s2" />

              {/* Glowing Constellation Connecting Vectors */}
              <line x1="280" y1="90" x2="340" y2="70" className="stardust-line" />
              <line x1="340" y1="70" x2="410" y2="110" className="stardust-line" />
              <line x1="410" y1="110" x2="480" y2="60" className="stardust-line" />
              <line x1="480" y1="60" x2="560" y2="95" className="stardust-line" />
              <line x1="560" y1="95" x2="640" y2="80" className="stardust-line" />
            </svg>

            {/* Frosted Glass Readability Veil */}
            <div className="labs-hero-family-veil" />
          </div>

          <div className="labs-spotlight-info">
            {/* Eyebrow Badge */}
            <div className="labs-spotlight-badge">
              <span className="labs-spotlight-badge-dot">✦</span>
              <span>
                {isAr ? 'رحلة عائلة نيزك • التقييم الإدراكي الشامل' : 'Nayzak Family Journey • Certified Benchmark'}
              </span>
              <span className="labs-spotlight-duration">{isAr ? '⏱️ 6 دقائق' : '⏱️ 6 mins'}</span>
            </div>
            
            {/* Title */}
            <h1 className="labs-spotlight-title">
              {isAr ? (
                <>
                  مقياس نيزك <span className="labs-spotlight-highlight">للذكاء الإدراكي</span>
                </>
              ) : (
                <>
                  Nayzak Core <span className="labs-spotlight-highlight">Cognitive Index</span>
                </>
              )}
            </h1>
            
            {/* Subtitle */}
            <p className="labs-spotlight-desc">
              {isAr
                ? 'بروتوكول سريري تفاعلي تشارك فيه عائلة نيزك لمعايرة مؤشرك الإدراكي عبر 6 ركائز عصبية رئيسية (الذاكرة، التركيز، السرعة، اللغة، الاستدلال، والمرونة) وتخصيص خطتك التدريبية بدقة.'
                : 'A certified clinical benchmark guided by the Nayzak family to calibrate your comprehensive Cognitive Index across 6 core neural pillars and precision-tailor your training regimen.'}
            </p>

            {/* CTAs */}
            <div className="labs-spotlight-actions">
              <button
                type="button"
                className="labs-btn-primary"
                onClick={() => {
                  playSfx?.('click');
                  onOpenAssessment?.();
                }}
              >
                <span>{isAr ? 'ابدأ التقييم الشامل' : 'Launch Assessment'}</span>
                <span className="labs-btn-arrow" style={{ fontSize: 16 }}>{isAr ? '←' : '→'}</span>
              </button>

              <button
                type="button"
                className="labs-btn-secondary"
                onClick={() => {
                  playSfx?.('click');
                  switchTab('workout');
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>{isAr ? 'بروتوكول التمرين اليومي' : 'Daily Workout Protocol'}</span>
              </button>

              <button
                type="button"
                className="labs-btn-family"
                onClick={() => {
                  playSfx?.('click');
                  setIsFamilyModalOpen(true);
                }}
                title={isAr ? 'تعرف على عائلة نيزك وقصة حراس العقل' : 'Meet the Nayzak Family & Mind Guardians'}
              >
                <span className="labs-btn-family-emoji" aria-hidden="true">👨‍👩‍👧‍👦</span>
                <span>{isAr ? 'قصة عائلة نيزك' : 'The Nayzak Story'}</span>
              </button>
            </div>
          </div>

          {/* 6-Pillar Neural Radar & Dignified Coach Dossier */}
          <div className="labs-spotlight-visual">
            <NeuralRadarHeroVisual
              isAr={isAr}
              coach={coach}
              onLaunch={() => {
                playSfx?.('click');
                onOpenAssessment?.();
              }}
              onOpenFamily={() => {
                playSfx?.('click');
                setIsFamilyModalOpen(true);
              }}
            />
          </div>
        </section>

        {/* =================================================================
            3. Google Labs Section Header (Directly above Filter Strip)
           ================================================================= */}
        <div className="labs-section-header">
          <h2 className="labs-section-title">
            {isAr ? 'استكشف تجارب الذكاء الإدراكي' : 'Explore Cognitive Experiments'}
          </h2>
          <p className="labs-section-subtitle">
            {isAr
              ? '18 تجربة عصبية لمعايرة وتدريب الذاكرة والتركيز وسرعة البديهة بأرشيفات علمية حقيقية'
              : '18 clinical cognitive experiments to benchmark and train memory, focus, and mental speed with authentic verified archives'}
          </p>
        </div>

        {/* =================================================================
            4. Category Filter Chips
           ================================================================= */}
        <div className="labs-filter-strip" role="tablist">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`labs-chip ${isSelected ? 'is-active' : ''}`}
                onClick={() => {
                  playSfx?.('click');
                  setActiveCategory(chip.id);
                }}
              >
                <span>{isAr ? chip.ar : chip.en}</span>
                <span className="labs-chip-count">{chip.count}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================
            5. Search & Telemetry Bar
           ================================================================= */}
        <div className="labs-toolbar">
          <div className="labs-search-box">
            <svg
              className="labs-search-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              ref={searchInputRef}
              type="text"
              className="labs-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث في التجارب، الأدوات، أو المعايير العلمية (اضغط / للبحث)…'
                  : 'Search experiments, paradigms, or protocols (Press /)...'
              }
            />

            {searchQuery && (
              <button
                type="button"
                className="labs-search-clear-btn"
                onClick={handleClearSearch}
                title={isAr ? 'مسح البحث' : 'Clear search'}
              >
                ✕
              </button>
            )}
          </div>

          <div className="labs-mode-segmented" role="radiogroup" aria-label={isAr ? 'نمط العرض البصري' : 'Visual Display Mode'}>
            <button
              type="button"
              className={`labs-mode-seg-btn ${displayMode === 'cc0' ? 'is-active' : ''}`}
              onClick={() => {
                playSfx?.('click');
                setDisplayMode('cc0');
              }}
              title={isAr ? 'عرض الأرشيف العلمي الحقيقي والمصادر التاريخية CC0' : 'View Authentic CC0 Scientific & Historical Archives'}
            >
              <span aria-hidden="true">🏛️</span>
              <span>{isAr ? 'أرشيف CC0 الحقيقي' : 'Authentic CC0'}</span>
            </button>
            <button
              type="button"
              className={`labs-mode-seg-btn ${displayMode === 'vector' ? 'is-active' : ''}`}
              onClick={() => {
                playSfx?.('click');
                setDisplayMode('vector');
              }}
              title={isAr ? 'عرض محاكي التجارب الإدراكية الحي (Google Labs Vector HUD)' : 'View Live Interactive Vector Telemetry HUD'}
            >
              <span aria-hidden="true">⚡</span>
              <span>{isAr ? 'محاكي المتجهات SVG' : 'Vector HUD'}</span>
            </button>
          </div>

          <div className="labs-meta-count">
            {isAr
              ? `[ ${filteredExperiments.length} من ${EXPERIMENTS.length} تجربة متاحة ]`
              : `[ ${filteredExperiments.length} of ${EXPERIMENTS.length} ACTIVE EXPERIMENTS ]`}
          </div>
        </div>

        {/* =================================================================
            6. Bento Experiment Cards Grid (Authentic CC0 Archives / Vector HUD)
           ================================================================= */}
        <div className="labs-grid-wrapper">
          {filteredExperiments.length === 0 ? (
            <div className="labs-empty-state">
              <h3 className="labs-empty-title">
                {isAr ? 'لم يتم العثور على تجارب مطابقة' : 'No matching experiments found'}
              </h3>
              <p className="labs-empty-desc">
                {isAr
                  ? 'جرّب البحث بكلمة أخرى أو اختر قسماً آخر من شريط التصنيفات أعلاه.'
                  : 'Try searching with different terms or select another category from the filter bar.'}
              </p>
              <button
                type="button"
                className="labs-btn-primary"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
              >
                {isAr ? 'إعادة ضبط البحث والتصنيفات' : 'Reset Search & Filters'}
              </button>
            </div>
          ) : (
            <div className="labs-bento-grid">
              {filteredExperiments.map((exp) => {
                const title = isAr && exp.titleAr ? exp.titleAr : exp.titleEn;
                const desc = isAr && exp.descAr ? exp.descAr : exp.descEn;
                const tag = isAr && exp.tagAr ? exp.tagAr : exp.tagEn;
                const paradigm = isAr && exp.paradigmAr ? exp.paradigmAr : exp.paradigm;
                const duration = isAr && exp.durationAr ? exp.durationAr : exp.duration;
                const provenance = isAr && exp.provenanceAr ? exp.provenanceAr : exp.provenanceEn;

                return (
                  <article
                    key={exp.id}
                    className="labs-experiment-card"
                    style={{
                      '--card-glow': `${exp.color || '#0284c7'}33`,
                      '--card-color': exp.color || '#0284c7',
                    }}
                    onClick={() => handleCardClick(exp)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick(exp);
                      }
                    }}
                  >
                    {/* 16:9 Media Window: Authentic CC0 Archival Photo or Vector Telemetry Simulator */}
                    <div className="labs-exp-media">
                      {displayMode === 'vector' ? (
                        <ExperimentArtwork
                          visualType={exp.visualType}
                          color={exp.color}
                          title={title}
                        />
                      ) : (
                        <>
                          <img
                            src={exp.imageAsset}
                            alt={title}
                            className="labs-exp-img"
                            loading="lazy"
                          />
                          {provenance && (
                            <div className="labs-media-overlay-bottom">
                              <span className="labs-provenance-tag" title={provenance}>
                                🏛️ {provenance}
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Overlaid Badges */}
                      <div className="labs-media-overlay-top">
                        <span className="labs-code-badge">{exp.expNum}</span>
                        <span className="labs-live-pill">
                          <span className="labs-live-dot" />
                          <span>{isAr ? 'تجربة حية' : exp.tier}</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="labs-exp-body">
                      <div className="labs-exp-header-row">
                        <h3 className="labs-exp-title">
                          <span>{title}</span>
                          <span className="labs-launch-arrow">{isAr ? '←' : '→'}</span>
                        </h3>
                        <span className="labs-domain-chip">{tag}</span>
                      </div>

                      <p className="labs-exp-desc">{desc}</p>

                      {/* Card Footer with Clinical Paradigm */}
                      <div className="labs-exp-footer">
                        <span className="labs-paradigm-text" title={paradigm}>
                          {paradigm}
                        </span>
                        <span className="labs-duration-badge">{duration}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Nayzak Family Story & Guardians Lore Modal */}
      <NayzakFamilyModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        isAr={isAr}
      />
    </div>
  );
}
