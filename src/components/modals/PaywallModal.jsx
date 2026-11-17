import React, { useState, useEffect } from 'react';
import {
  Crown,
  ChartPolar,
  Brain,
  Sparkle,
  ShieldCheck,
  Check,
  CheckCircle,
  X,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import NayzakLogo from '../shared/NayzakLogo';
import { assetUrl } from '../../lib/assetUrl';
import '../../styles/paywallModal.css';

const VALUE_PROPS = [
  {
    id: 'radar',
    Icon: ChartPolar,
    color: '#0B63CE',
    en: 'Full 6-Domain Cognitive Radar & NPI Insights',
    ar: 'رادار المهارات الستة الكامل ومؤشر الأداء الإدراكي NPI',
  },
  {
    id: 'workouts',
    Icon: Brain,
    color: '#FF7800',
    en: 'Adaptive Daily Workouts & Custom Focus Modes',
    ar: 'تدريبات يومية متكيفة وأوضاع تركيز مخصصة',
  },
  {
    id: 'library',
    Icon: Sparkle,
    color: '#FFB012',
    en: 'All 18 Clinical Drills & 19 Mind Puzzles',
    ar: 'جميع التمارين الإكلينيكية الـ 18 و19 لغزاً ذهنياً',
  },
  {
    id: 'offline',
    Icon: ShieldCheck,
    color: '#1CB0F6',
    en: 'Ad-Free Offline PWA Access',
    ar: 'وصول كامل بدون إعلانات مع العمل دون إنترنت',
  },
];

const PLANS = [
  {
    id: 'annual',
    badgeEn: 'Save 45%',
    badgeAr: 'وفّر 45%',
    titleEn: 'Annual Pass',
    titleAr: 'الباقة السنوية',
    priceEn: '$39.99 / yr',
    priceAr: '$39.99 / سنة',
    subEn: '$3.33 / mo · Best value',
    subAr: '$3.33 / شهر · أفضل قيمة',
  },
  {
    id: 'monthly',
    badgeEn: null,
    badgeAr: null,
    titleEn: 'Monthly Plan',
    titleAr: 'الباقة الشهرية',
    priceEn: '$5.99 / mo',
    priceAr: '$5.99 / شهر',
    subEn: 'Flexible monthly billing',
    subAr: 'اشتراك شهري مرن',
  },
];

export default function PaywallModal() {
  const {
    paywallOpen,
    closePaywall,
    playSfx,
    currentLang,
    isPro,
    proPlan,
    activatePro,
    deactivatePro,
  } = useApp();

  const isAr = currentLang === 'ar';
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [confirmedPlan, setConfirmedPlan] = useState(null);

  useEffect(() => {
    if (!paywallOpen) {
      setConfirmedPlan(null);
      return;
    }
    if (proPlan === 'monthly' || proPlan === 'annual') {
      setSelectedPlan(proPlan);
    } else {
      setSelectedPlan('annual');
    }
  }, [paywallOpen, proPlan]);

  useEffect(() => {
    if (!paywallOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        playSfx?.('click');
        closePaywall?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paywallOpen, closePaywall, playSfx]);

  function handleClose() {
    playSfx?.('click');
    closePaywall?.();
  }

  function handleSelectPlan(planId) {
    playSfx?.('tap');
    setSelectedPlan(planId);
  }

  function handleActivate() {
    playSfx?.('win');
    activatePro?.(selectedPlan);
    setConfirmedPlan(selectedPlan);
  }

  function handleDeactivatePreview() {
    playSfx?.('click');
    deactivatePro?.();
    closePaywall?.();
  }

  const activePlanObj = PLANS.find((p) => p.id === (confirmedPlan || selectedPlan)) || PLANS[0];

  return (
    <div
      id="paywall-modal"
      className={paywallOpen ? 'show' : ''}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nayzak-paywall-title"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="nayzak-paywall-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="nayzak-paywall-close"
          onClick={handleClose}
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X size={18} weight="bold" aria-hidden="true" />
        </button>

        {/* Nayzak Trio Squad Showcase (Official Nayzak Games Banner Cast) */}
        <div className="nayzak-paywall-trio" aria-hidden="true">
          <img
            src={assetUrl('Assets/brand/cast-2026/nayzak-host.webp')}
            alt=""
            draggable="false"
            className="nayzak-paywall-trio-char is-left"
          />
          <img
            src={assetUrl('Assets/brand/cast-2026/shofata-cheer.webp')}
            alt=""
            draggable="false"
            className="nayzak-paywall-trio-char is-center"
          />
          <img
            src={assetUrl('Assets/brand/cast-2026/zamour-spark.webp')}
            alt=""
            draggable="false"
            className="nayzak-paywall-trio-char is-right"
          />
        </div>

        {/* Top Brand Emblem & Nayzak PRO Badge */}
        <div className="nayzak-paywall-brand-row">
          <NayzakLogo variant="compact" size={34} showMascot={false} />
          <span className="nayzak-pro-pill">
            <Crown size={15} weight="fill" aria-hidden="true" />
            <span>PRO</span>
          </span>
        </div>

        {confirmedPlan ? (
          <div className="nayzak-paywall-confirmed">
            <div className="nayzak-paywall-confirm-icon" aria-hidden="true">
              <CheckCircle size={44} weight="fill" />
            </div>
            <h2 id="nayzak-paywall-title" className="nayzak-paywall-title">
              {isAr ? 'مرحباً بك في Nayzak PRO!' : 'Welcome to Nayzak PRO!'}
            </h2>
            <p className="nayzak-paywall-subtitle">
              {isAr
                ? `تم تفعيل ${activePlanObj.titleAr} (${activePlanObj.priceAr}). جميع التمارين والألغاز وتحليلات الرادار الإدراكي مفتوحة الآن.`
                : `${activePlanObj.titleEn} (${activePlanObj.priceEn}) is active. All 18 clinical drills, 19 mind puzzles, and full 6-domain insights are unlocked.`}
            </p>
            <button
              type="button"
              className="nayzak-paywall-cta"
              onClick={handleClose}
            >
              <span>{isAr ? 'متابعة التدريب' : 'Continue Training'}</span>
            </button>
          </div>
        ) : (
          <>
            <h2 id="nayzak-paywall-title" className="nayzak-paywall-title">
              {isAr
                ? 'درّب جميع مهاراتك الإدراكية بلا حدود'
                : 'Train Every Cognitive Skill Without Limits'}
            </h2>
            <p className="nayzak-paywall-subtitle">
              {isAr
                ? 'برنامج تدريب ذهني متكامل مبني على قياس الأداء عبر المجالات الستة.'
                : 'Personalized brain training calibrated to your 6-domain cognitive profile.'}
            </p>

            {/* 4 Value Propositions */}
            <ul className="nayzak-paywall-perks">
              {VALUE_PROPS.map(({ id, Icon, color, en, ar }) => (
                <li key={id} className="nayzak-paywall-perk">
                  <span
                    className="lum-tile-icon lum-tile-icon--xs shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    <Icon size={16} weight="fill" color="#FFFFFF" />
                  </span>
                  <span className="nayzak-paywall-perk-text">
                    {isAr ? ar : en}
                  </span>
                </li>
              ))}
            </ul>

            {/* Interactive Plan Selector */}
            <div
              className="nayzak-paywall-plans"
              role="radiogroup"
              aria-label={isAr ? 'اختر باقة الاشتراك' : 'Choose subscription plan'}
            >
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const badge = isAr ? plan.badgeAr : plan.badgeEn;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`nayzak-plan-option ${isSelected ? 'is-selected' : ''} ${plan.id === 'annual' ? 'is-annual' : ''}`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {badge && <span className="nayzak-plan-save">{badge}</span>}
                    <span className="nayzak-plan-radio" aria-hidden="true">
                      {isSelected && <Check size={12} weight="bold" />}
                    </span>
                    <span className="nayzak-plan-info">
                      <span className="nayzak-plan-name">
                        {isAr ? plan.titleAr : plan.titleEn}
                      </span>
                      <span className="nayzak-plan-sub">
                        {isAr ? plan.subAr : plan.subEn}
                      </span>
                    </span>
                    <span className="nayzak-plan-price">
                      {isAr ? plan.priceAr : plan.priceEn}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Primary CTA */}
            <button
              type="button"
              className="nayzak-paywall-cta"
              onClick={handleActivate}
            >
              <span>
                {isPro
                  ? isAr
                    ? 'تأكيد الباقة المختارة'
                    : 'Update Selected Plan'
                  : isAr
                    ? 'ابدأ تجربة مجانية 7 أيام'
                    : 'Start 7-Day Free Trial'}
              </span>
            </button>

            {isPro && typeof deactivatePro === 'function' ? (
              <button
                type="button"
                className="nayzak-paywall-secondary"
                onClick={handleDeactivatePreview}
              >
                {isAr ? 'العودة إلى النسخة المجانية (معاينة)' : 'Switch Back to Free Preview'}
              </button>
            ) : (
              <button
                type="button"
                className="nayzak-paywall-secondary"
                onClick={handleClose}
              >
                {isAr ? 'ليس الآن · متابعة اللعب مجاناً' : 'Not now · Continue Free'}
              </button>
            )}

            <p className="nayzak-paywall-footnote">
              {isAr
                ? 'تجربة مجانية 7 أيام • يمكنك الإلغاء في أي وقت'
                : '7-day free trial • Cancel anytime'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
