import React, { useState, useCallback } from 'react';
import { Sparkle, Play, Users, CheckCircle, ShieldCheck, LockKey, LockKeyOpen } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';

const NAYZAK_POSES = [
  {
    id: 'leader',
    nameAr: 'القائد المنتصر',
    nameEn: 'Empowered Leader',
    icon: '👑',
    img: 'Assets/cartoon/nayzak_unified_leader.png',
    speechAr: 'أنا القائد نيزك! من يمتلك حدوده النفسية يمتلك طاقته الذهنية ونجاحه. لا تدع أحداً يستنزف وقتك، وضع درع الحماية دائماً!',
    speechEn: 'I am Captain Nayzak! Whoever commands their boundaries owns their energy. Defend your focus and wear your shield with pride!',
    stampAr: 'درع التمكين وحماية الطاقة الذهنية',
    stampEn: 'PERSONAL BOUNDARIES • SOVEREIGN SHIELD',
    stampClass: 'stamp-gold',
  },
  {
    id: 'presenter',
    nameAr: 'المقدّم الحماسي',
    nameEn: 'Chief Presenter',
    icon: '📢',
    img: 'Assets/cartoon/nayzak_unified_presenter.png',
    speechAr: 'أهلاً بك يا بطل! 15 دقيقة فقط من التدريب الإدراكي اليومي تعيد تشكيل مسارات دماغك العصبية بالكامل!',
    speechEn: 'Welcome Champion! Just 15 minutes of daily cognitive exercises rebuilds your neural superhighways completely!',
    stampAr: 'بروتوكول علمي معتمد 100%',
    stampEn: 'CLINICAL BENCHMARK • VERIFIED',
    stampClass: 'stamp-emerald',
  },
  {
    id: 'epiphany',
    nameAr: 'لحظة الإشراق',
    nameEn: 'Eureka Epiphany',
    icon: '💡',
    img: 'Assets/cartoon/nayzak_unified_epiphany.png',
    speechAr: 'وجدتها! كلمة «لا» في الوقت المناسب ليست أنانية، بل هي أعظم استثمار لسلامك النفسي وتركيزك الخارق!',
    speechEn: 'Eureka! Saying "NO" at the right moment is not selfish — it is your highest investment in peace and focus!',
    stampAr: 'حقيقة علمية مثبتة',
    stampEn: 'SCIENTIFIC FACT • VALIDATED',
    stampClass: 'stamp-emerald',
  },
  {
    id: 'build_wall',
    nameAr: 'بنّاء الحدود',
    nameEn: 'Wall Builder',
    icon: '🧱',
    img: 'Assets/cartoon/nayzak_unified_build_wall.png',
    speechAr: 'نحن هنا نبني جدار الحماية النفسية طوبة وراء طوبة! لا تسمح للمشتتات باختراق هدوئك الداخلي.',
    speechEn: 'We build our psychological fortress brick by brick! Never allow external noise to breach your inner calm.',
    stampAr: 'بناء الحصن الذهني',
    stampEn: 'MENTAL FORTRESS • IN PROGRESS',
    stampClass: 'stamp-gold',
  },
  {
    id: 'suit',
    nameAr: 'الدبلوماسي الذكي',
    nameEn: 'Executive Strategist',
    icon: '💼',
    img: 'Assets/cartoon/nayzak_unified_suit.png',
    speechAr: 'الدبلوماسية العالية: تفاوض بثقة وهدوء، احمِ مواعيدك ومساحتك الشخصية، وحقق أهدافك بلا إرهاق!',
    speechEn: 'High-level diplomacy: negotiate with calm confidence, guard your schedule, and reach your goals effortlessly!',
    stampAr: 'استراتيجية القيادة',
    stampEn: 'EXECUTIVE STRATEGY • ACTIVE',
    stampClass: 'stamp-gold',
  },
  {
    id: 'panic',
    nameAr: 'تحدي الضغوط',
    nameEn: 'Overcoming Panic',
    icon: '😱',
    img: 'Assets/cartoon/nayzak_unified_panic.png',
    speechAr: 'مهام متراكمة وضغوطات؟ توقف الآن، خذ نفساً عميقاً، ولنبدأ تمرين تصفية الذهن فوراً لتستعيد السيطرة!',
    speechEn: 'Overwhelmed with deadlines? Stop, take a deep breath, and let us clear mental fatigue immediately!',
    stampAr: 'كسر قيود التشتت والضغط',
    stampEn: 'STRESS RELIEF • PROTOCOL',
    stampClass: '',
  },
  {
    id: 'confused',
    nameAr: 'المستكشف الفضولي',
    nameEn: 'Curious Seeker',
    icon: '🤔',
    img: 'Assets/cartoon/nayzak_unified_confused.png',
    speechAr: 'محتار من أين تبدأ رحلتك؟ دعني أرشدك إلى اختبار القدرات المعرفية لنكتشف نقطة انطلاقك اليوم!',
    speechEn: 'Unsure where to begin? Allow me to guide you to the cognitive assessment to discover your peak today!',
    stampAr: 'بوصلة التقييم المعرفي',
    stampEn: 'NEURAL RADAR • BENCHMARK',
    stampClass: 'stamp-emerald',
  },
];

export default function NayzakCartoonStage({
  userName,
  greeting,
  onStartWorkout,
  onOpenFamily,
  onOpenPaywall,
}) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [activePoseIdx, setActivePoseIdx] = useState(0);
  const [squashKey, setSquashKey] = useState(0);
  const [noUnlocked, setNoUnlocked] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const activePose = NAYZAK_POSES[activePoseIdx] || NAYZAK_POSES[0];

  const handleNextPose = useCallback(() => {
    playSfx?.('pop');
    setActivePoseIdx((prev) => (prev + 1) % NAYZAK_POSES.length);
    setSquashKey((k) => k + 1);
  }, [playSfx]);

  const handleSelectPose = useCallback((index) => {
    playSfx?.('pop');
    setActivePoseIdx(index);
    setSquashKey((k) => k + 1);
  }, [playSfx]);

  const handleYesClick = useCallback(() => {
    playSfx?.('ding');
    setFeedbackMsg(
      isAr
        ? '⚠️ انتبه! قول «نعم» دائماً لكل طلب يرهق طاقتك ويوقعك في فخ متلازمة إرضاء الجميع!'
        : '⚠️ Caution! Saying "YES" to every request drains your mental energy into people-pleasing!'
    );
  }, [isAr, playSfx]);

  const handleNoClick = useCallback(() => {
    playSfx?.('stamp');
    setNoUnlocked(true);
    awardPoints?.(50);
    setActivePoseIdx(0); // Switch to Leader
    setSquashKey((k) => k + 1);
    setFeedbackMsg(
      isAr
        ? '🛡️ رائع! لقد حررت قوة كلمة «لا» وحميت وقتك الثمين! حصلت على +50 نقطة ذكاء!'
        : '🛡️ Sovereign! You unlocked the power of "NO" and protected your time! +50 Mind Points!'
    );
  }, [isAr, playSfx, awardPoints]);

  return (
    <section className="cartoon-stage-card" aria-label={isAr ? 'مسرح كرتون نيزك' : 'Captain Nayzak Cartoon Stage'}>
      {/* Comic Radial Sunburst */}
      <div className="cartoon-stage-sunburst" aria-hidden="true" />

      {/* Stage Header Strip */}
      <div className="cartoon-stage-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="cartoon-stage-badge">
            <Sparkle size={15} weight="fill" color="#f59e0b" />
            <span>{isAr ? 'مسرح كرتون نيزك • ستايل الفيديو' : 'Nayzak Cartoon Stage • Video Style'}</span>
          </span>
          <span className="cartoon-stage-subtitle">
            {greeting}، {userName}
          </span>
        </div>

        {/* Tilted Dashed Comic Stamp from Agreeable Video */}
        <div className={`bendia-comic-stamp ${activePose.stampClass}`}>
          <span className="bendia-stamp-main">{activePose.stampEn}</span>
          <span className="bendia-stamp-sub">{activePose.stampAr}</span>
        </div>
      </div>

      {/* Main Character & Speech Bubble Area */}
      <div className="cartoon-stage-main">
        {/* Animated Nayzak Mascot with Squash & Stretch */}
        <div
          className="cartoon-nayzak-frame"
          onClick={handleNextPose}
          title={isAr ? 'اضغط على نيزك لتغيير الوضعية وحركته الكرتونية!' : 'Click Nayzak to change pose and cartoon action!'}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNextPose(); }}
        >
          <img
            key={squashKey}
            src={assetUrl(activePose.img)}
            alt={isAr ? activePose.nameAr : activePose.nameEn}
            className="cartoon-nayzak-img"
          />
          <div className="cartoon-nayzak-ground-shadow" aria-hidden="true" />
          <span className="cartoon-nayzak-tap-hint">
            <span>{activePose.icon}</span>
            <span>{isAr ? 'اضغط لتغيير الوضعية' : 'Tap to change pose'}</span>
          </span>
        </div>

        {/* Comic Dialogue Speech Bubble with authentic arrow tail */}
        <div className="cartoon-speech-bubble">
          <div className="cartoon-speech-speaker">
            <div className="cartoon-speaker-name">
              <span>{activePose.icon}</span>
              <span>{isAr ? `الكابتن نيزك — ${activePose.nameAr}` : `Captain Nayzak — ${activePose.nameEn}`}</span>
            </div>
            <img
              src={assetUrl('Assets/cartoon/sticker_fact_clean.png')}
              alt=""
              style={{ height: 26, width: 'auto', objectFit: 'contain' }}
              aria-hidden="true"
            />
          </div>

          <p className="cartoon-speech-text">
            {isAr ? activePose.speechAr : activePose.speechEn}
          </p>

          {/* Feedback message banner on interaction */}
          {feedbackMsg && (
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 12,
                background: '#fef3c7',
                border: '1.5px solid #d97706',
                color: '#78350f',
                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1.5,
              }}
            >
              {feedbackMsg}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Pose Strip: Click to switch to any pose */}
      <div className="cartoon-pose-picker" role="tablist" aria-label={isAr ? 'وضعيات نيزك الكرتونية' : 'Nayzak Cartoon Poses'}>
        {NAYZAK_POSES.map((pose, idx) => {
          const isActive = idx === activePoseIdx;
          return (
            <button
              key={pose.id}
              type="button"
              className={`cartoon-pose-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => handleSelectPose(idx)}
              role="tab"
              aria-selected={isActive}
            >
              <span>{pose.icon}</span>
              <span>{isAr ? pose.nameAr : pose.nameEn}</span>
            </button>
          );
        })}
      </div>

      {/* YES / NO Interactive Dilemma Console (from Scene 1 of Agreeable Video) */}
      <div className="cartoon-yesno-console">
        <div className="cartoon-yesno-label">
          {isAr
            ? '⚡ تحدي الحدود النفسية السريع: هل تجرؤ على قول «لا» لحماية وقتك وطاقتك؟'
            : '⚡ Boundaries Dilemma Console: Do you dare to say "NO" to protect your focus?'}
        </div>

        {/* YES BUTTON */}
        <button
          type="button"
          className="cartoon-btn-yes"
          onClick={handleYesClick}
          title={isAr ? 'قول نعم دائماً' : 'Say YES to everything'}
        >
          <span className="cartoon-btn-yes-ar">نَعَمْ</span>
          <span className="cartoon-btn-yes-en">YES</span>
        </button>

        {/* LOCKED NO BUTTON (Red, Padlock from Video) */}
        <button
          type="button"
          className="cartoon-btn-no"
          onClick={handleNoClick}
          title={isAr ? 'اضغط لكسر الأقفال وقول لا لحماية حدودك' : 'Click to shatter chains and say NO'}
        >
          <span className="cartoon-btn-no-lock">
            {noUnlocked ? '🔓' : '🔒'}
          </span>
          <span className="cartoon-btn-no-ar">لَا</span>
          <span className="cartoon-btn-no-en">NO</span>
        </button>
      </div>

      {/* Cartoon Action Buttons Row */}
      <div className="cartoon-actions-row">
        <button
          type="button"
          className="cartoon-btn-primary"
          onClick={() => {
            playSfx?.('pop');
            onStartWorkout?.();
          }}
        >
          <Play size={18} weight="fill" />
          <span>{isAr ? 'ابدأ تمرين اليوم' : 'Start Daily Workout'}</span>
        </button>

        <button
          type="button"
          className="cartoon-btn-pro"
          onClick={() => {
            playSfx?.('ding');
            onOpenPaywall?.();
          }}
        >
          <span>⭐</span>
          <span>{isAr ? 'نيزك PRO — درع الحدود' : 'Nayzak PRO • Boundaries Shield'}</span>
        </button>

        <button
          type="button"
          className="cartoon-btn-secondary"
          onClick={() => {
            playSfx?.('pop');
            onOpenFamily?.();
          }}
        >
          <Users size={18} weight="bold" />
          <span>{isAr ? 'قصة العائلة الكرتونية' : 'Meet Cartoon Lore'}</span>
        </button>
      </div>
    </section>
  );
}
