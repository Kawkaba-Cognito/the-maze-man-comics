import React from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';
import '../../styles/paywallModal.css';

export default function PaywallModal() {
  const { paywallOpen, closePaywall, playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';

  function playCartoonSound() {
    try {
      const audio = new Audio(assetUrl('Assets/cartoon/sfx_stamp.wav'));
      audio.volume = 0.5;
      audio.play().catch(() => playSfx?.('win'));
    } catch {
      playSfx?.('win');
    }
  }

  function subscribe() {
    playCartoonSound();
    closePaywall();
    alert(
      isAr
        ? '🎉 جاري الانتقال إلى بوابة الدفع الآمنة! (وضع تجريبي للمعاينة)'
        : '🎉 Redirecting to secure checkout! (Preview demo mode)'
    );
  }

  return (
    <div
      id="paywall-modal"
      className={paywallOpen ? 'show' : ''}
      onClick={closePaywall}
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="paywall-cartoon-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Comic Close Button */}
        <button
          type="button"
          className="paywall-cartoon-close"
          onClick={() => {
            playSfx?.('click');
            closePaywall();
          }}
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          ✕
        </button>

        {/* 1. Tilted Dashed Comic Stamp (from Agreeable People Pleaser Video) */}
        <div className="bendia-comic-stamp">
          <span className="bendia-stamp-main">PERSONAL BOUNDARIES</span>
          <span className="bendia-stamp-sub">
            {isAr ? 'درع التمكين وحماية الطاقة الذهنية' : 'Master Cognitive Empowerment Shield'}
          </span>
        </div>

        {/* 2. Hero Mascot: Cartoon Nayzak in Laurel Wreath & Obsidian Shield */}
        <div className="paywall-mascot-row">
          <img
            src={assetUrl('Assets/cartoon/nayzak_unified_leader.png')}
            alt={isAr ? 'نيزك المتصدر' : 'Nayzak Empowered Leader'}
            className="paywall-nayzak-mascot"
            draggable="false"
          />

          {/* Obsidian & Gold Heraldic Shield from the Video */}
          <div className="bendia-shield-badge">
            <span className="bendia-shield-arabic">الحُدُود</span>
            <span className="bendia-shield-eng">BOUNDARIES</span>
          </div>
        </div>

        {/* 3. Title & Subtitle */}
        <h2 className="paywall-cartoon-title">
          {isAr ? 'انضم إلى نخبة نيزك PRO' : 'Upgrade to Nayzak PRO'}
        </h2>
        <p className="paywall-cartoon-subtitle">
          {isAr
            ? 'امتلك كامل إمكانيات عالم نيزك: دراسات علمية معمقة، أرشيف القصص الكامل، وتمارين بلا حدود.'
            : 'Unlock the full psychological universe: clinical exercises, comic vaults, and zero daily limits.'}
        </p>

        {/* 4. Perks List with Comic Badges */}
        <ul className="paywall-cartoon-perks">
          <li className="paywall-cartoon-perk-item">
            <span className="paywall-cartoon-perk-icon">📚</span>
            <span>
              {isAr
                ? 'فتح جميع أعداد فصول القصص المصورة الحالية والمستقبلية'
                : 'All 8+ current & upcoming interactive comic chapters'}
            </span>
          </li>
          <li className="paywall-cartoon-perk-item">
            <span className="paywall-cartoon-perk-icon">🧠</span>
            <span>
              {isAr
                ? 'تمارين غير محدودة في مختبر الذكاء والقدرات الإدراكية'
                : 'Unlimited clinical cognitive experiments & training drills'}
            </span>
          </li>
          <li className="paywall-cartoon-perk-item">
            <span className="paywall-cartoon-perk-icon">📊</span>
            <span>
              {isAr
                ? 'شهادة تقرير المؤشر الإدراكي الشامل القابلة للتحميل والطباعة'
                : 'Certified Brain Age & Cognitive Index report (printable)'}
            </span>
          </li>
          <li className="paywall-cartoon-perk-item">
            <span className="paywall-cartoon-perk-icon">🛡️</span>
            <span>
              {isAr
                ? 'درع حماية التركيز والشارات الأسطورية الحصرية'
                : 'Exclusive avatar crowns, shields, and streak protection'}
            </span>
          </li>
        </ul>

        {/* 5. Pricing Buttons */}
        <div className="paywall-pricing-stack">
          <button
            type="button"
            className="paywall-btn-annual"
            onClick={subscribe}
          >
            <span>{isAr ? '🔥 الاشتراك السنوي (وفّر 33%)' : '🔥 Annual Pass (Save 33%)'}</span>
            <span>$39.99 / {isAr ? 'سنة' : 'yr'}</span>
          </button>

          <button
            type="button"
            className="paywall-btn-monthly"
            onClick={subscribe}
          >
            <span>{isAr ? '⭐ الاشتراك الشهري' : '⭐ Monthly Plan'}</span>
            <span>$4.99 / {isAr ? 'شهر' : 'mo'}</span>
          </button>
        </div>

        <p className="paywall-cartoon-footnote">
          {isAr
            ? '🔒 دفع آمن ومشفر بنسبة 100% عبر Stripe • يمكنك الإلغاء في أي وقت'
            : '🔒 100% Secure encrypted checkout via Stripe • Cancel anytime'}
        </p>
      </div>
    </div>
  );
}
