import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { LEARN_TOPICS } from './learn/topics';
import LearnArticle from './learn/LearnArticle';

/**
 * Learn — evidence-based reads about cognition and the brain. Hub (topic
 * cards) → article. Starts with one topic (Attention); more get added the
 * same way rather than needing a redesign.
 */
export default function LearnScreen() {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const [activeTopicId, setActiveTopicId] = useState(null);
  const activeTopic = LEARN_TOPICS.find((t) => t.id === activeTopicId) || null;

  const cardStyle = {
    display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 18,
    textAlign: isAr ? 'right' : 'left', cursor: 'pointer',
    border: chrome.dark ? '1px solid rgba(212,168,80,0.28)' : '1px solid rgba(170,140,80,0.22)',
    background: chrome.dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.78)',
    boxShadow: chrome.dark ? 'none' : '0 6px 18px rgba(120,90,40,0.08)',
    color: chrome.text, width: '100%',
  };

  return (
    <div
      className={`learn-screen rewards-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ alignItems: 'stretch', justifyContent: 'flex-start', overflowY: 'auto' }}
    >
      <AtmosphericBackground strength="panel" />
      <div className="shop-stage-content" style={{ maxWidth: 480, margin: '0 auto', width: '100%', alignItems: 'stretch' }}>
        {activeTopic ? (
          <>
            <button
              type="button"
              onClick={() => { playSfx?.('click'); setActiveTopicId(null); }}
              style={{
                alignSelf: isAr ? 'flex-end' : 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 100, marginBottom: 16,
                border: chrome.dark ? '1px solid rgba(212,168,80,0.38)' : '1px solid rgba(170,140,80,0.35)',
                background: chrome.dark ? 'rgba(18,16,28,0.6)' : 'rgba(255,252,246,0.85)',
                color: chrome.text, cursor: 'pointer', fontFamily: "'Outfit', system-ui, sans-serif",
                fontSize: 13, fontWeight: 700,
              }}
            >
              {isAr ? `${isAr ? 'تعلّم' : 'Learn'} ›` : '‹ Learn'}
            </button>
            <LearnArticle topic={activeTopic} isAr={isAr} chrome={chrome} />
          </>
        ) : (
          <>
            <div style={{ ...chrome.title, fontSize: isAr ? 22 : 20, textAlign: 'center', marginBottom: 4 }}>
              {isAr ? 'تعلّم' : 'Learn'}
            </div>
            <p style={{ textAlign: 'center', fontSize: 13, color: chrome.muted, margin: '0 0 20px' }}>
              {isAr ? 'مقالات مبنية على علم النفس عن الذاكرة والانتباه والدماغ.' : 'Evidence-based reads about memory, attention, and the brain.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {LEARN_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => { playSfx?.('click'); setActiveTopicId(topic.id); }}
                  style={cardStyle}
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

              <div style={{ ...cardStyle, cursor: 'default', opacity: 0.55, justifyContent: 'center', textAlign: 'center' }}>
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
