import React, { useState, useCallback, useEffect, Suspense } from 'react';
import {
  Badge,
  BlockTitle,
  Button,
  List,
  ListItem,
  Searchbar,
  Segmented,
  SegmentedButton,
} from 'konsta/react';
import {
  Crosshair,
  Lightning,
  Brain,
  ChatCircleText,
  PuzzlePiece,
  ArrowsClockwise,
  CheckCircle,
  Play,
  ArrowRight,
  ArrowLeft,
  SquaresFour,
  ListBullets,
  Clock,
  Star,
  Crown,
  Sparkle,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import NayzakHeader from '../shared/NayzakHeader';
import DomainGameStage from '../../features/training/shared/DomainGameStage';
import { getLazyGame } from '../../features/training/lazyGames';
import { EXPERIMENTS } from '../training/trainingExperimentsData';
import { getDomainGuardian } from '../../data/nayzakCast';
import {
  domainRating,
  gameRatingByGameKey,
  ratingBand,
} from '../../features/training/rating';
import { assetUrl } from '../../lib/assetUrl';

const DOMAINS_LIST = [
  {
    id: 'attention',
    en: 'Attention',
    ar: 'الانتباه',
    Icon: Crosshair,
    color: '#FF7800',
    softBg: '#FFF4E5',
    art: 'Assets/domain-art/category-drawings-2026/attention.webp',
    descAr: 'البحث البصري، التركيز المستدام، وتثبيط المشتتات',
    descEn: 'Visual search, sustained focus & distractor filtering',
  },
  {
    id: 'speed',
    en: 'Speed',
    ar: 'السرعة',
    Icon: Lightning,
    color: '#0B63CE',
    softBg: '#EFF6FF',
    art: 'Assets/domain-art/category-drawings-2026/speed.webp',
    descAr: 'سرعة المعالجة الذهنية، الحساب السريع، ودقة التوقيت',
    descEn: 'Rapid processing, mental arithmetic & reaction timing',
  },
  {
    id: 'memory',
    en: 'Memory',
    ar: 'الذاكرة',
    Icon: Brain,
    color: '#1CB0F6',
    softBg: '#F0F9FF',
    art: 'Assets/domain-art/category-drawings-2026/memory.webp',
    descAr: 'الذاكرة العاملة، التذكر المكاني، وتسلسل الأحداث',
    descEn: 'Working memory updating, spatial recall & sequencing',
  },
  {
    id: 'language',
    en: 'Language',
    ar: 'اللغة',
    Icon: ChatCircleText,
    color: '#0D9488',
    softBg: '#F0FDFA',
    art: 'Assets/domain-art/category-drawings-2026/language.webp',
    descAr: 'المفردات، الروابط الدلالية، والمعرفة العامة',
    descEn: 'Vocabulary retrieval, word associations & general knowledge',
  },
  {
    id: 'reasoning',
    en: 'Reasoning',
    ar: 'الاستدلال',
    Icon: PuzzlePiece,
    color: '#4F46E5',
    softBg: '#EEF2FF',
    art: 'Assets/domain-art/category-drawings-2026/reasoning.webp',
    descAr: 'التخطيط المكاني، استنتاج القواعد، والتحليل المنطقي',
    descEn: 'Spatial planning, rule induction & deductive logic',
  },
  {
    id: 'flexibility',
    en: 'Flexibility',
    ar: 'المرونة',
    Icon: ArrowsClockwise,
    color: '#DF4E32',
    softBg: '#FFF1EE',
    art: 'Assets/domain-art/category-drawings-2026/flexibility.webp',
    descAr: 'التكيف الحركي، تبديل المهام، وإعادة التصنيف',
    descEn: 'Task switching, motor adaptation & creative sorting',
  },
];

const GAME_ART_V2 = {
  'cancel-task': 'attention-cancellation-v2.webp',
  mot: 'attention-target-tracking-v2.webp',
  'train-switch': 'attention-spaceship-v2.webp',
  'speed-match': 'speed-speed-match-v2.webp',
  'math-gates': 'speed-math-gates-v2.webp',
  intercept: 'speed-intercept-v2.webp',
  'story-grid': 'memory-story-time-v2.webp',
  'keep-track': 'memory-keep-track-v2.webp',
  'paired-associates': 'memory-pair-match-v2.webp',
  wordle: 'language-word-maze-v2.webp',
  synonyms: 'language-word-links-v2.webp',
  trivia: 'language-trivia-v2.webp',
  'rush-hour': 'reasoning-block-escape-v2.webp',
  gatekeeper: 'reasoning-gatekeeper-v2.webp',
  detective: 'reasoning-detective-v2.webp',
  'mirror-world': 'flexibility-mirror-world-v2.webp',
  'task-switch': 'flexibility-task-switch-v2.webp',
  'sort-shift': 'flexibility-sort-shift-v2.webp',
};

const TRAINING_GAMES = EXPERIMENTS.filter(
  (exp) => exp.domainId !== 'puzzles' && exp.gameKey && exp.gameKey !== 'puzzles'
);

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
        color: '#0F1E33',
        fontFamily: "'Cairo', 'Outfit', system-ui, sans-serif",
        fontSize: 17,
        fontWeight: 800,
        gap: 10,
      }}
    >
      <Sparkle size={34} weight="duotone" color="#0B63CE" />
      <span>{isAr ? 'جارِ التحميل...' : 'Loading...'}</span>
    </div>
  );
}

function readClaimedGames() {
  const claimed = new Set();
  try {
    for (const storageKey of ['mazeman_claimed_wins', 'mazeman_claimed_free']) {
      const raw = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
      Object.keys(raw).forEach((k) => {
        const base = k.split(':')[0];
        if (base) claimed.add(base);
      });
    }
  } catch {
    /* ignore */
  }
  return claimed;
}

function ExerciseListItem({ exp, domain, isAr, played, ratingInfo, onLaunch }) {
  const title = isAr && exp.titleAr ? exp.titleAr : exp.titleEn;
  const tag = isAr && exp.tagAr ? exp.tagAr : exp.tagEn;
  const desc = isAr && exp.descAr ? exp.descAr : exp.descEn;
  const paradigm = isAr && exp.paradigmAr ? exp.paradigmAr : exp.paradigm;
  const duration = isAr && exp.durationAr ? exp.durationAr : exp.duration;
  const band = ratingInfo && ratingInfo.n > 0 ? ratingBand(ratingInfo.rating) : null;

  const v2Art = GAME_ART_V2[exp.gameKey]
    ? assetUrl(`Assets/game-illustrations/${GAME_ART_V2[exp.gameKey]}`)
    : null;

  return (
    <ListItem
      link
      chevron={played ? undefined : false}
      onClick={() => onLaunch(exp, domain.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLaunch(exp, domain.id);
        }
      }}
      tabIndex={0}
      aria-label={`${title} - ${tag}`}
      media={
        <div
          className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-black/10 dark:border-white/10"
          style={{ background: domain.softBg }}
        >
          <img
            src={v2Art || exp.imageAsset || assetUrl(domain.art)}
            alt={title}
            loading="lazy"
            draggable="false"
            className="w-full h-full object-cover block"
          />
        </div>
      }
      header={
        <div className="inline-flex items-center gap-1.5 flex-wrap">
          <Badge
            small
            colors={{ bg: 'bg-transparent', text: '' }}
            className="duo-ex-skill-pill px-2 py-0.5"
          >
            {tag}
          </Badge>
          {band && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-extrabold"
              style={{ color: band.color }}
            >
              <Star size={11} weight="fill" aria-hidden="true" />
              <span>{ratingInfo.rating}</span>
            </span>
          )}
        </div>
      }
      title={title}
      subtitle={
        <span className="inline-flex items-center gap-1.5 flex-wrap text-xs">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} weight="bold" aria-hidden="true" />
            <span>{duration}</span>
          </span>
          {paradigm && (
            <span className="truncate max-w-[200px] opacity-85" title={paradigm}>
              {`· ${paradigm}`}
            </span>
          )}
        </span>
      }
      text={desc}
      after={
        played ? (
          <span
            className="inline-flex items-center text-emerald-600 dark:text-emerald-400"
            title={isAr ? 'تم اللعب' : 'Played'}
            aria-label={isAr ? 'تم اللعب' : 'Played'}
          >
            <CheckCircle size={22} weight="fill" aria-hidden="true" />
          </span>
        ) : (
          <Button
            small
            rounded
            inline
            className="nayzak-konsta-cta border-0 px-3 gap-1 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onLaunch(exp, domain.id);
            }}
          >
            <Play size={12} weight="fill" aria-hidden="true" />
            <span>{isAr ? 'العب' : 'Play'}</span>
          </Button>
        )
      }
    />
  );
}

export default function DomainsScreen() {
  const {
    currentLang,
    playSfx,
    setActiveModalGame,
    isPro = false,
    openPaywall,
  } = useApp();
  const isAr = currentLang === 'ar';

  const [selectedDomainId, setSelectedDomainId] = useState(null);
  const [viewMode, setViewMode] = useState('domains'); // 'domains' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGameKey, setActiveGameKey] = useState(null);
  const [activeGameDomainId, setActiveGameDomainId] = useState('attention');

  useEffect(() => {
    return () => {
      setActiveModalGame?.(null);
    };
  }, [setActiveModalGame]);

  const claimedGames = readClaimedGames();

  const gameMetaMap = {};
  let totalPlayed = 0;
  for (const exp of TRAINING_GAMES) {
    const ratingInfo = gameRatingByGameKey(exp.gameKey);
    const played =
      claimedGames.has(exp.gameKey) || Boolean(ratingInfo && ratingInfo.n > 0);
    if (played) totalPlayed += 1;
    gameMetaMap[exp.gameKey] = { played, ratingInfo };
  }

  const domainSummaries = DOMAINS_LIST.map((domain) => {
    const games = TRAINING_GAMES.filter((exp) => exp.domainId === domain.id);
    const playedCount = games.filter((g) => gameMetaMap[g.gameKey]?.played).length;
    const rating = domainRating(domain.id);
    const band = rating != null ? ratingBand(rating) : null;
    const guardian = getDomainGuardian(domain.id);
    return {
      domain,
      games,
      playedCount,
      rating,
      band,
      guardian,
    };
  });

  const selectedSummary =
    domainSummaries.find((s) => s.domain.id === selectedDomainId) || null;

  const q = searchQuery.trim().toLowerCase();
  const filteredGroups = domainSummaries
    .map((summary) => {
      if (!q) return summary;
      const d = summary.domain;
      const domainMatch =
        d.en.toLowerCase().includes(q) ||
        (d.ar && d.ar.toLowerCase().includes(q)) ||
        d.descEn.toLowerCase().includes(q) ||
        (d.descAr && d.descAr.toLowerCase().includes(q));

      const matchingGames = domainMatch
        ? summary.games
        : summary.games.filter((exp) => {
            return (
              exp.titleEn.toLowerCase().includes(q) ||
              (exp.titleAr && exp.titleAr.toLowerCase().includes(q)) ||
              exp.tagEn.toLowerCase().includes(q) ||
              (exp.tagAr && exp.tagAr.toLowerCase().includes(q)) ||
              exp.descEn.toLowerCase().includes(q) ||
              (exp.descAr && exp.descAr.toLowerCase().includes(q)) ||
              (exp.paradigm && exp.paradigm.toLowerCase().includes(q)) ||
              (exp.paradigmAr && exp.paradigmAr.toLowerCase().includes(q))
            );
          });

      return { ...summary, games: matchingGames };
    })
    .filter((s) => s.games.length > 0);

  const GameView = activeGameKey ? getLazyGame(activeGameKey) : null;

  const handleLaunchGame = useCallback(
    (exp, domainId) => {
      playSfx?.('pop');
      setActiveGameDomainId(domainId || exp.domainId || 'attention');
      setActiveGameKey(exp.gameKey);
      setActiveModalGame?.(exp.gameKey);
    },
    [playSfx, setActiveModalGame]
  );

  const handleExitGame = useCallback(() => {
    playSfx?.('pop');
    setActiveGameKey(null);
    setActiveModalGame?.(null);
  }, [playSfx, setActiveModalGame]);

  const handleSelectDomain = useCallback(
    (domainId) => {
      playSfx?.('pop');
      setSelectedDomainId(domainId);
    },
    [playSfx]
  );

  const NavArrow = isAr ? ArrowLeft : ArrowRight;

  // Active game modal host
  if (activeGameKey && GameView) {
    return (
      <div className="duo-game-modal-host">
        <DomainGameStage domainId={activeGameDomainId}>
          <Suspense fallback={<GameLoading isAr={isAr} />}>
            <GameView onBack={handleExitGame} />
          </Suspense>
        </DomainGameStage>
      </div>
    );
  }

  // Domain Detail Mode
  if (selectedSummary) {
    const { domain, games, playedCount, rating, band, guardian } = selectedSummary;
    const DomainIcon = domain.Icon;
    const domainName = isAr ? domain.ar : domain.en;
    const domainDesc = isAr ? domain.descAr : domain.descEn;

    return (
      <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
        <NayzakHeader
          title={domainName}
          subtitle={
            isAr
              ? `${playedCount} من ${games.length} تمارين مكتملة`
              : `${playedCount} of ${games.length} exercises played`
          }
          onBack={() => setSelectedDomainId(null)}
          backLabel={isAr ? 'المجالات' : 'Domains'}
        />

        <main
          className="duo-home-container duo-home-container--wide"
          style={{ '--dom-color': domain.color, '--dom-soft': domain.softBg }}
        >
          {/* Wrapping 6-Domain Quick-Switcher Pill Strip */}
          <nav
            className="duo-domain-strip"
            style={{ flexWrap: 'wrap', overflowX: 'visible' }}
            aria-label={
              isAr
                ? 'التبديل السريع بين المجالات الإدراكية'
                : 'Switch cognitive domain'
            }
          >
            {DOMAINS_LIST.map((d) => {
              const isCurrent = d.id === domain.id;
              const PillIcon = d.Icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  className={`duo-domain-pill${isCurrent ? ' is-active' : ''}`}
                  style={{ '--pill-color': d.color, '--pill-soft': d.softBg }}
                  onClick={() => {
                    if (!isCurrent) handleSelectDomain(d.id);
                  }}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <PillIcon
                    size={14}
                    weight={isCurrent ? 'fill' : 'bold'}
                    color={isCurrent ? '#ffffff' : d.color}
                    aria-hidden="true"
                  />
                  <span>{isAr ? d.ar : d.en}</span>
                </button>
              );
            })}
          </nav>

          {/* Domain Detail Banner */}
          <section
            className="duo-domain-detail-banner"
            style={{ '--dom-color': domain.color, '--dom-soft': domain.softBg }}
          >
            <div className="duo-domain-detail-top">
              <div className="duo-domain-detail-art">
                <img
                  src={assetUrl(domain.art)}
                  alt={domainName}
                  draggable="false"
                />
              </div>

              <div className="duo-domain-detail-copy">
                <div className="duo-domain-detail-badges">
                  <span className="duo-domain-num-pill">
                    {isAr ? 'مجال إدراكي' : 'COGNITIVE DOMAIN'}
                  </span>
                  {rating != null && band ? (
                    <span
                      className="duo-domain-rating-pill"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Star size={12} weight="fill" />
                      <span>
                        {`NPI ${rating} · ${isAr ? band.ar : band.en}`}
                      </span>
                    </span>
                  ) : (
                    <span className="duo-domain-rating-pill">
                      {isAr ? 'لم يُقيّم بعد' : 'Unrated yet'}
                    </span>
                  )}
                </div>

                <h2
                  className="duo-domain-detail-title"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <DomainIcon
                    size={22}
                    weight="duotone"
                    color={domain.color}
                    aria-hidden="true"
                  />
                  <span>{domainName}</span>
                </h2>
                <p className="duo-domain-detail-desc">{domainDesc}</p>
              </div>
            </div>

            {guardian && (
              <div className="duo-domain-guardian-bar">
                <img
                  src={guardian.avatarUrl}
                  alt={isAr ? guardian.nameAr : guardian.nameEn}
                  className="duo-guardian-avatar"
                  draggable="false"
                />
                <div className="duo-guardian-text">
                  <div className="duo-guardian-name-row">
                    <strong>{isAr ? guardian.nameAr : guardian.nameEn}</strong>
                    <span>
                      {`• ${isAr ? guardian.roleAr : guardian.roleEn}`}
                    </span>
                  </div>
                  <p className="duo-guardian-quote">
                    {isAr ? guardian.quoteAr : guardian.quoteEn}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Exercises List Header */}
          <BlockTitle className="w-full !mt-4 !mb-1 !px-1">
            <span>
              {isAr ? `تمارين ${domainName}` : `${domainName} Exercises`}
            </span>
            <Badge
              small
              colors={{
                bg: 'bg-black/8 dark:bg-white/12',
                text: 'text-slate-600 dark:text-slate-300',
              }}
              className="px-2 py-0.5"
            >
              {isAr
                ? `${games.length} ألعاب متخصصة`
                : `${games.length} specialized games`}
            </Badge>
          </BlockTitle>

          {/* 3 Rich Exercise Rows (Konsta iOS Inset List) */}
          <List
            strong
            inset
            className="w-full !mx-0 !mt-2 !mb-6"
            style={{ '--dom-color': domain.color, '--dom-soft': domain.softBg }}
          >
            {games.map((exp) => {
              const meta = gameMetaMap[exp.gameKey] || {};
              return (
                <ExerciseListItem
                  key={exp.id}
                  exp={exp}
                  domain={domain}
                  isAr={isAr}
                  played={meta.played}
                  ratingInfo={meta.ratingInfo}
                  onLaunch={handleLaunchGame}
                />
              );
            })}
          </List>
        </main>
      </div>
    );
  }

  // Overview Mode
  const totalGames = TRAINING_GAMES.length;
  const masteryPct =
    totalGames > 0 ? Math.round((totalPlayed / totalGames) * 100) : 0;

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-home-container duo-home-container--wide">
        {/* Brand-Aligned Cognitive Domains Mastery Banner */}
        <section
          className="duo-home-hero"
          aria-label={isAr ? 'المجالات الإدراكية' : 'Cognitive Domains'}
          style={{
            background:
              'linear-gradient(135deg, #0F1E33 0%, #132B4C 54%, #0B63CE 100%)',
            border: '2px solid #0B63CE',
            borderBottom: '5px solid #091526',
            boxShadow: '0 14px 30px rgba(15, 30, 51, 0.24)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(11, 99, 206, 0.36)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#E0F2FE',
                fontFamily: "'Outfit', 'Cairo', system-ui, sans-serif",
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}
            >
              <Brain size={14} weight="fill" color="#FFB012" />
              <span>{isAr ? 'أطلس القدرات الإدراكية' : 'COGNITIVE DOMAINS'}</span>
            </span>

            {!isPro && (
              <button
                type="button"
                onClick={() => {
                  playSfx?.('click');
                  openPaywall?.();
                }}
                style={{
                  appearance: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: 'rgba(255, 176, 18, 0.16)',
                  border: '1.5px solid rgba(255, 176, 18, 0.6)',
                  color: '#FFB012',
                  fontFamily: "'Outfit', 'Cairo', system-ui, sans-serif",
                  fontSize: 11.5,
                  fontWeight: 900,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Crown size={13} weight="fill" color="#FFB012" />
                <span>{isAr ? 'ترقية إلى PRO' : 'Unlock PRO'}</span>
              </button>
            )}
          </div>

          <div className="duo-home-hero-copy" style={{ gap: 4 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Outfit', 'Cairo', system-ui, sans-serif",
                fontSize: 'clamp(1.25rem, 3.8vw, 1.55rem)',
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.2,
              }}
            >
              {isAr ? 'استكشف المجالات الستة' : 'Master All 6 Cognitive Domains'}
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "'Outfit', 'Cairo', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: 'rgba(226, 232, 240, 0.88)',
                lineHeight: 1.45,
              }}
            >
              {isAr
                ? 'تدرّب عبر ست مهارات إدراكية متكاملة و١٨ تمريناً علمياً مصمماً بدقة.'
                : 'Train across six core mental pillars with 18 science-backed cognitive exercises.'}
            </p>
          </div>

          <div
            className="duo-home-hero-progress"
            style={{
              background: 'rgba(15, 30, 51, 0.56)',
              borderColor: 'rgba(255, 176, 18, 0.28)',
            }}
          >
            <div className="duo-home-hero-prog-row">
              <span>
                {isAr ? 'إجمالي الإتقان المعرفي' : 'Total Domain Mastery'}
              </span>
              <span style={{ color: '#FFB012' }}>
                {isAr
                  ? `${totalPlayed} / ${totalGames} تمارين مكتملة`
                  : `${totalPlayed} / ${totalGames} exercises played`}
              </span>
            </div>
            <div className="duo-home-hero-track">
              <div
                className="duo-home-hero-fill"
                style={{
                  width: `${Math.max(masteryPct, totalPlayed > 0 ? 6 : 0)}%`,
                  background:
                    'linear-gradient(90deg, #FFB012 0%, #38BDF8 100%)',
                }}
              />
            </div>
          </div>
        </section>

        {/* Toolbar with Domains (6) / All (18) Toggle */}
        <div className="duo-home-toolbar">
          <div className="duo-home-toolbar-title">
            <h2>
              {viewMode === 'domains'
                ? isAr
                  ? 'المجالات الإدراكية الستة'
                  : 'Cognitive Domains'
                : isAr
                ? 'جميع التمارين حسب المجال'
                : 'All 18 Exercises'}
            </h2>
            <p>
              {viewMode === 'domains'
                ? isAr
                  ? 'اختر المهارة التي تريد تقويتها اليوم'
                  : 'Choose a cognitive skill to train'
                : isAr
                ? 'مرتّبة ومميّزة بالألوان حسب المجال الإدراكي'
                : 'Grouped and color-coded by cognitive domain'}
            </p>
          </div>

          <Segmented
            strong
            rounded
            className="w-full sm:w-auto sm:min-w-[268px] shrink-0"
            aria-label={isAr ? 'طريقة العرض' : 'View mode'}
          >
            <SegmentedButton
              strong
              active={viewMode === 'domains'}
              className={`nayzak-seg-btn whitespace-nowrap px-3 text-[13px] ${
                viewMode === 'domains' ? 'is-active' : ''
              }`}
              onClick={() => {
                playSfx?.('tap');
                setViewMode('domains');
              }}
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <SquaresFour size={14} weight="bold" aria-hidden="true" />
                <span>{isAr ? 'المجالات (6)' : 'Domains (6)'}</span>
              </span>
            </SegmentedButton>
            <SegmentedButton
              strong
              active={viewMode === 'all'}
              className={`nayzak-seg-btn whitespace-nowrap px-3 text-[13px] ${
                viewMode === 'all' ? 'is-active' : ''
              }`}
              onClick={() => {
                playSfx?.('tap');
                setViewMode('all');
              }}
            >
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <ListBullets size={14} weight="bold" aria-hidden="true" />
                <span>{isAr ? 'الكل (18)' : 'All (18)'}</span>
              </span>
            </SegmentedButton>
          </Segmented>
        </div>

        {/* Domains (6) 2-Column Grid */}
        {viewMode === 'domains' ? (
          <div className="w-full">
            <BlockTitle className="w-full !mt-1 !mb-2.5 !px-1">
              <span>{isAr ? '٦ ركائز إدراكية' : '6 Cognitive Pillars'}</span>
              <Badge
                small
                colors={{
                  bg: 'bg-black/8 dark:bg-white/12',
                  text: 'text-slate-600 dark:text-slate-300',
                }}
                className="px-2 py-0.5"
              >
                {isAr
                  ? `${totalPlayed}/${totalGames} مكتمل`
                  : `${totalPlayed}/${totalGames} played`}
              </Badge>
            </BlockTitle>

            <section
              className="duo-domain-grid"
              aria-label={isAr ? 'المجالات الإدراكية' : 'Cognitive domains'}
            >
              {domainSummaries.map(({ domain, games, playedCount, rating, band }) => {
                const DomainIcon = domain.Icon;
                const name = isAr ? domain.ar : domain.en;
                const desc = isAr ? domain.descAr : domain.descEn;
                const pct = Math.round(
                  (playedCount / Math.max(1, games.length)) * 100
                );

                return (
                  <button
                    key={domain.id}
                    type="button"
                    className="duo-domain-card"
                    style={{ '--dom-color': domain.color, '--dom-soft': domain.softBg }}
                    onClick={() => handleSelectDomain(domain.id)}
                  >
                    <div className="duo-domain-card-stripe" aria-hidden="true" />

                    <div className="duo-domain-card-head">
                      <div className="duo-domain-art-box">
                        <img
                          src={assetUrl(domain.art)}
                          alt=""
                          draggable="false"
                        />
                        <span
                          className="duo-domain-emoji-badge"
                          aria-hidden="true"
                        >
                          <DomainIcon
                            size={13}
                            weight="fill"
                            color={domain.color}
                          />
                        </span>
                      </div>

                      <div className="duo-domain-card-titles">
                        <div className="duo-domain-title-row">
                          <h3 className="duo-domain-card-name">{name}</h3>
                          {rating != null && band ? (
                            <span
                              className="duo-domain-score-pill"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Star size={11} weight="fill" />
                              <span>
                                {`${rating} · ${isAr ? band.ar : band.en}`}
                              </span>
                            </span>
                          ) : (
                            <span className="duo-domain-count-chip">
                              {isAr
                                ? `${games.length} ألعاب`
                                : `${games.length} games`}
                            </span>
                          )}
                        </div>
                        <p
                          className="duo-domain-card-desc"
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {desc}
                        </p>
                      </div>
                    </div>

                    <div className="duo-domain-card-prog">
                      <div className="duo-domain-prog-track">
                        <div
                          className="duo-domain-prog-fill"
                          style={{
                            width: `${Math.max(pct, playedCount > 0 ? 12 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="duo-domain-card-foot">
                      <span className="duo-domain-foot-meta">
                        {isAr
                          ? `${playedCount} / ${games.length} مكتمل`
                          : `${playedCount} / ${games.length} played`}
                      </span>
                      <span className="duo-domain-open-cta">
                        <span>{isAr ? 'تدرب' : 'Train'}</span>
                        <NavArrow size={14} weight="bold" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </section>
          </div>
        ) : (
          /* All (18) Grouped Mode with Konsta Searchbar & Inset Lists */
          <section className="duo-all-grouped">
            <Searchbar
              value={searchQuery}
              onInput={(e) => setSearchQuery(e.target.value)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              disableButton={false}
              placeholder={
                isAr
                  ? 'ابحث عن تمرين أو مهارة أو مجال...'
                  : 'Search exercise, skill, or domain...'
              }
              aria-label={isAr ? 'البحث في التمارين' : 'Search exercises'}
              className="rounded-full bg-white dark:bg-slate-800/90 border border-black/8 dark:border-white/10 shadow-sm [&_button]:border-0 [&_button]:bg-transparent [&_input]:border-0"
              inputStyle={{
                border: 'none',
                background: 'transparent',
                paddingInlineStart: '2.625rem',
                paddingInlineEnd: '2.25rem',
              }}
            />

            {filteredGroups.length === 0 ? (
              <div className="duo-empty-box">
                <p>
                  {isAr
                    ? 'لا توجد تمارين مطابقة لبحثك.'
                    : 'No exercises matched your search.'}
                </p>
                <Button
                  rounded
                  inline
                  className="nayzak-konsta-cta border-0 px-5"
                  onClick={() => setSearchQuery('')}
                >
                  {isAr ? 'عرض جميع التمارين' : 'Show all exercises'}
                </Button>
              </div>
            ) : (
              filteredGroups.map(({ domain, games, playedCount }) => {
                const DomainIcon = domain.Icon;
                return (
                  <div
                    key={domain.id}
                    className="w-full"
                    style={{
                      '--dom-color': domain.color,
                      '--dom-soft': domain.softBg,
                    }}
                  >
                    <BlockTitle className="w-full !mt-2 !mb-1 !px-1">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span
                          className="w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0"
                          style={{ background: domain.softBg }}
                          aria-hidden="true"
                        >
                          <DomainIcon
                            size={16}
                            weight="duotone"
                            color={domain.color}
                          />
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {isAr ? domain.ar : domain.en}
                        </span>
                      </span>

                      <button
                        type="button"
                        className="duo-domain-group-link shrink-0"
                        onClick={() => handleSelectDomain(domain.id)}
                      >
                        <span>
                          {playedCount}/{games.length}
                        </span>
                        <NavArrow size={13} weight="bold" aria-hidden="true" />
                      </button>
                    </BlockTitle>

                    <List strong inset className="w-full !mx-0 !mt-2 !mb-3">
                      {games.map((exp) => {
                        const meta = gameMetaMap[exp.gameKey] || {};
                        return (
                          <ExerciseListItem
                            key={exp.id}
                            exp={exp}
                            domain={domain}
                            isAr={isAr}
                            played={meta.played}
                            ratingInfo={meta.ratingInfo}
                            onLaunch={handleLaunchGame}
                          />
                        );
                      })}
                    </List>
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>
    </div>
  );
}
