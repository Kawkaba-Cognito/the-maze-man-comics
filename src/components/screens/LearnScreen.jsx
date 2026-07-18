import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import UniverseStage from '../shared/UniverseStage';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { LEARN_TOPICS } from './learn/topics';
import LearnArticle from './learn/LearnArticle';

/**
 * Learn — evidence-based reads about cognition and the brain. Hub (topic
 * cards) → article. Starts with one topic (Attention); more get added the
 * same way rather than needing a redesign.
 * Full-bleed universe stage (same shell as Home / Other).
 */
export default function LearnScreen() {
  const { currentLang, playSfx, toggleLang } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const [activeTopicId, setActiveTopicId] = useState(null);
  const activeTopic = LEARN_TOPICS.find((t) => t.id === activeTopicId) || null;

  return (
    <div
      className={`learn-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <UniverseStage accent="learn" dark={chrome.dark} />
      <div className="shop-stage-content">
        {activeTopic ? (
          <>
            <button
              type="button"
              onClick={() => { playSfx?.('click'); setActiveTopicId(null); }}
              style={{
                ...chrome.chromeBtn,
                width: 'auto',
                alignSelf: isAr ? 'flex-end' : 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                marginTop: 'max(16px, env(safe-area-inset-top))',
                marginBottom: 16,
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {isAr ? 'تعلّم ›' : '‹ Learn'}
            </button>
            <LearnArticle topic={activeTopic} isAr={isAr} chrome={chrome} playSfx={playSfx} />
          </>
        ) : (
          <>
            <div className="app-chrome-bar" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'max(16px, env(safe-area-inset-top)) 2px 14px', position: 'relative', zIndex: 5,
            }}>
              <div style={{ width: 34 }} />
              <div style={{ ...chrome.title, fontSize: isAr ? 24 : 22 }}>
                {isAr ? 'تعلّم' : 'Learn'}
              </div>
              <button type="button" style={chrome.langBtn} onClick={toggleLang}>
                {isAr ? 'EN' : 'عر'}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: chrome.muted, margin: '0 0 20px' }}>
              {isAr ? 'مقالات مبنية على علم النفس عن الذاكرة والانتباه والدماغ.' : 'Evidence-based reads about memory, attention, and the brain.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
              {LEARN_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => { playSfx?.('click'); setActiveTopicId(topic.id); }}
                  style={chrome.glassCard}
                >
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{topic.icon}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 15 }}>
                      {isAr && topic.titleAr ? topic.titleAr : topic.title}
                    </span>
                  </span>
                  <span style={{ color: chrome.accent, fontSize: 18, flexShrink: 0 }}>{isAr ? '‹' : '›'}</span>
                </button>
              ))}

              <div style={{ ...chrome.glassCard, cursor: 'default', opacity: 0.55, justifyContent: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {isAr ? 'المزيد من المواضيع قريباً' : 'More topics coming soon'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
