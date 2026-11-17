import React, { useState, useCallback, useEffect, Suspense } from 'react';
import {
  Button,
  List,
  ListItem,
  Searchbar,
  Segmented,
  SegmentedButton,
} from 'konsta/react';
import {
  Crosshair,
  Target,
  RocketLaunch,
  Lightning,
  Calculator,
  Timer,
  BookOpenText,
  Eye,
  SquaresFour,
  TextAa,
  Link as LinkIcon,
  Brain,
  Car,
  Key,
  Detective,
  Swap,
  ArrowsLeftRight,
  Funnel,
  ChatCircleText,
  PuzzlePiece,
  ArrowsClockwise,
  CheckCircle,
  Play,
  ArrowRight,
  ArrowLeft,
  ListBullets,
  Clock,
  Star,
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

const GAME_ICON_MAP = {
  'cancel-task': Crosshair,
  mot: Target,
  'train-switch': RocketLaunch,
  'speed-match': Lightning,
  'math-gates': Calculator,
  intercept: Timer,
  'story-grid': BookOpenText,
  'keep-track': Eye,
  'paired-associates': SquaresFour,
  wordle: TextAa,
  synonyms: LinkIcon,
  trivia: Brain,
  'rush-hour': Car,
  gatekeeper: Key,
  detective: Detective,
  'mirror-world': Swap,
  'task-switch': ArrowsLeftRight,
  'sort-shift': Funnel,
};

const DOMAINS_LIST = [
  {
    id: 'attention',
    en: 'Attention',
    ar: 'الانتباه',
    Icon: Crosshair,
    color: '#FF7800',
    softBg: '#FFF4E5',
    art: 'Assets/domain-art/editorial-2026/attention.webp',
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
    art: 'Assets/domain-art/editorial-2026/speed.webp',
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
    art: 'Assets/domain-art/editorial-2026/memory.webp',
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
    art: 'Assets/domain-art/editorial-2026/language.webp',
    descAr: 'المفردات، الروابط الدلالية، والمعرفة العامة',
    descEn: 'Vocabulary retrieval, word links & general knowledge',
  },
  {
    id: 'reasoning',
    en: 'Reasoning',
    ar: 'الاستدلال',
    Icon: PuzzlePiece,
    color: '#4F46E5',
    softBg: '#EEF2FF',
    art: 'Assets/domain-art/editorial-2026/reasoning.webp',
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
    art: 'Assets/domain-art/editorial-2026/flexibility.webp',
    descAr: 'التكيف الحركي، تبديل المهام، وإعادة التصنيف',
    descEn: 'Task switching, motor adaptation & creative sorting',
  },
];

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
  const duration = isAr && exp.durationAr ? exp.durationAr : exp.duration;
  const band = ratingInfo && ratingInfo.n > 0 ? ratingBand(ratingInfo.rating) : null;
  const GameIcon = GAME_ICON_MAP[exp.gameKey] || domain.Icon;

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
        <span
          className="lum-tile-icon shrink-0"
          style={{ backgroundColor: domain.color }}
          aria-hidden="true"
        >
          <GameIcon size={21} weight="fill" color="#FFFFFF" />
        </span>
      }
      header={
        <div className="inline-flex items-center gap-2 flex-wrap">
          <span
            className="text-[11px] font-extrabold uppercase tracking-wider"
            style={{ color: domain.color }}
          >
            {tag}
          </span>
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
        <span className="inline-flex items-center gap-1.5 text-xs">
          <Clock size={12} weight="bold" aria-hidden="true" />
          <span>{duration}</span>
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
            className="nayzak-konsta-cta border-0 px-3.5 gap-1 shrink-0"
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
  const { currentLang, playSfx, setActiveModalGame } = useApp();
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
    const playedCount = games.filter(
      (exp) => gameMetaMap[exp.gameKey]?.played
    ).length;
    const rating = domainRating(domain.id);
    const band = rating != null ? ratingBand(rating) : null;
    const guardian = getDomainGuardian(domain.id);
    return { domain, games, playedCount, rating, band, guardian };
  });

  const selectedSummary = selectedDomainId
    ? domainSummaries.find((s) => s.domain.id === selectedDomainId) || null
    : null;

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredGroups = domainSummaries
    .map((summary) => {
      if (!trimmedQuery) return summary;
      const d = summary.domain;
      const q = trimmedQuery;
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

  // Domain Detail Mode (Clean Lumosity/Elevate Editorial Header + Exercises List)
  if (selectedSummary) {
    const { domain, games, playedCount, rating, band, guardian } = selectedSummary;
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

          {/* Clean 2D Illustrated Domain Header Card */}
          <section className="lum-domain-detail-card">
            <div className="lum-domain-detail-head">
              <div
                className="lum-detail-art-box"
                style={{ backgroundColor: domain.softBg }}
                aria-hidden="true"
              >
                <img
                  src={assetUrl(domain.art)}
                  alt=""
                  draggable="false"
                />
              </div>

              <div className="lum-domain-detail-copy">
                <div className="lum-domain-detail-meta">
                  <span className="lum-domain-kicker" style={{ color: domain.color }}>
                    {isAr ? 'مجال إدراكي' : 'COGNITIVE DOMAIN'}
                  </span>
                  {rating != null && band ? (
                    <span className="lum-rating-chip">
                      <Star size={11} weight="fill" aria-hidden="true" />
                      <span>{`NPI ${rating} · ${isAr ? band.ar : band.en}`}</span>
                    </span>
                  ) : (
                    <span className="lum-rating-chip is-muted">
                      {isAr ? 'لم يُقيّم بعد' : 'Unrated yet'}
                    </span>
                  )}
                </div>

                <h2 className="lum-domain-detail-title">{domainName}</h2>
                <p className="lum-domain-detail-desc">{domainDesc}</p>
              </div>
            </div>

            {guardian && (
              <div className="lum-guardian-strip">
                <img
                  src={guardian.avatarUrl}
                  alt={isAr ? guardian.nameAr : guardian.nameEn}
                  className="lum-guardian-avatar"
                  draggable="false"
                />
                <div className="lum-guardian-copy">
                  <div className="lum-guardian-name">
                    <strong>{isAr ? guardian.nameAr : guardian.nameEn}</strong>
                    <span>{isAr ? guardian.roleAr : guardian.roleEn}</span>
                  </div>
                  <p className="lum-guardian-quote">
                    {isAr ? guardian.quoteAr : guardian.quoteEn}
                  </p>
                </div>
              </div>
            )}
          </section>

          <div className="lum-section-row">
            <h3 className="lum-section-title">
              {isAr ? `تمارين ${domainName}` : `${domainName} Games`}
            </h3>
            <span className="lum-count-pill">
              {isAr ? `${games.length} ألعاب` : `${games.length} games`}
            </span>
          </div>

          <List
            strong
            inset
            className="w-full !mx-0 !mt-0 !mb-6"
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

  // Overview Mode (Clean Lumosity / Elevate / Peak Catalog — Zero Gradient SaaS Banner)
  const totalGames = TRAINING_GAMES.length;

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-home-container duo-home-container--wide">
        {/* Clean Editorial Header + View Switcher */}
        <section className="lum-catalog-header">
          <div className="lum-top-copy">
            <span className="lum-date-label">
              {isAr ? `${totalPlayed} من ${totalGames} ألعاب لعبتها` : `${totalPlayed} OF ${totalGames} GAMES PLAYED`}
            </span>
            <h1 className="lum-screen-title">
              {viewMode === 'domains'
                ? isAr
                  ? 'المجالات الإدراكية'
                  : 'Domains'
                : isAr
                ? 'جميع الألعاب (18)'
                : 'All Games'}
            </h1>
            <p className="nayzak-tab-helper">
              {isAr
                ? 'اختر أي مهارة للتدرب على ألعابها بالسرعة التي تناسبك'
                : 'Pick any skill card to open its 3 mini-games and play anytime.'}
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
        </section>

        {/* Domains (6) 2-Column Clean Flat-Vector Pillar Cards */}
        {viewMode === 'domains' ? (
          <section
            className="lum-domains-grid"
            aria-label={isAr ? 'المجالات الإدراكية' : 'Cognitive domains'}
          >
            {domainSummaries.map(({ domain, games, playedCount, rating, band }) => {
              const name = isAr ? domain.ar : domain.en;
              const desc = isAr ? domain.descAr : domain.descEn;
              const pct = Math.round((playedCount / Math.max(1, games.length)) * 100);
              const guardian = getDomainGuardian(domain.id);

              return (
                <button
                  key={domain.id}
                  type="button"
                  className="lum-domain-card lum-domain-card--illustrated"
                  style={{ '--dom-color': domain.color, '--dom-soft': domain.softBg }}
                  onClick={() => handleSelectDomain(domain.id)}
                >
                  <div
                    className="lum-card-stage"
                    style={{ backgroundColor: domain.softBg }}
                  >
                    <img
                      src={assetUrl(domain.art)}
                      alt=""
                      draggable="false"
                      className="lum-card-stage-img"
                    />
                    {guardian && (
                      <span className="nayzak-stage-guardian" title={isAr ? guardian.nameAr : guardian.nameEn}>
                        <img
                          src={guardian.avatarUrl}
                          alt={isAr ? guardian.nameAr : guardian.nameEn}
                          draggable="false"
                        />
                        <span>{isAr ? guardian.nameAr : guardian.nameEn}</span>
                      </span>
                    )}
                    {rating != null && band ? (
                      <span className="lum-rating-chip lum-stage-pill">
                        <Star size={11} weight="fill" aria-hidden="true" />
                        <span>{`${rating} · ${isAr ? band.ar : band.en}`}</span>
                      </span>
                    ) : (
                      <span className="lum-count-pill lum-stage-pill">
                        {isAr ? `${games.length} ألعاب` : `${games.length} games`}
                      </span>
                    )}
                  </div>

                  <div className="lum-card-content">
                    <div className="lum-domain-card-body">
                      <h2 className="lum-domain-card-title">{name}</h2>
                      <p className="lum-domain-card-desc">{desc}</p>
                    </div>

                    <div className="lum-domain-card-foot">
                      <div className="lum-domain-prog">
                        <div className="lum-domain-prog-track">
                          <div
                            className="lum-domain-prog-fill"
                            style={{
                              width: `${playedCount > 0 ? Math.max(pct, 14) : 0}%`,
                              backgroundColor: domain.color,
                            }}
                          />
                        </div>
                        <span className="lum-domain-prog-lbl">
                          {isAr
                            ? `${playedCount}/${games.length}`
                            : `${playedCount}/${games.length} played`}
                        </span>
                      </div>

                      <span className="lum-domain-cta" style={{ color: domain.color }}>
                        <span>{isAr ? 'تدرب' : 'Train'}</span>
                        <NavArrow size={14} weight="bold" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </section>
        ) : (
          /* All (18) Grouped Mode with Crisp Vector Icon Lists */
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
                  : 'Search game, skill, or domain...'
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
                    <div className="lum-section-row">
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <span
                          className="w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0"
                          style={{ backgroundColor: domain.color }}
                          aria-hidden="true"
                        >
                          <DomainIcon size={15} weight="fill" color="#FFFFFF" />
                        </span>
                        <h2 className="lum-section-title truncate">
                          {isAr ? domain.ar : domain.en}
                        </h2>
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
                    </div>

                    <List strong inset className="w-full !mx-0 !mt-1.5 !mb-3">
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
