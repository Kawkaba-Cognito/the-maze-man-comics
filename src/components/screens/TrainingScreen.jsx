import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';
import CancellationTask from '../training/CancellationTask';

export default function TrainingScreen() {
  const { currentLang } = useApp();
  const t = LANG[currentLang];
  const isAr = currentLang === 'ar';
  const [active, setActive] = useState(null);

  if (active === 'cancellation') {
    return <CancellationTask onBack={() => setActive(null)} />;
  }

  return (
    <div className="content-card training-hub" style={{ background: '#a8e6cf' }}>
      <h2
        style={{
          fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive",
          fontSize: '2.5em',
          marginBottom: '8px',
        }}
      >
        {t.trainingTitle}
      </h2>
      <p className="training-hub-sub">{t.trainingSub}</p>

      <div className="training-module-card">
        <div className="training-module-head">
          <span className="training-module-icon" aria-hidden="true">
            🎯
          </span>
          <div>
            <h3
              className="training-module-title"
              style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" }}
            >
              {t.attentionTitle}
            </h3>
            <p className="training-module-desc">{t.attentionDesc}</p>
          </div>
        </div>
        <button
          type="button"
          className="comic-btn training-open-btn"
          onClick={() => setActive('cancellation')}
          style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", width: '100%' }}
        >
          {t.openCancellation}
        </button>
      </div>
    </div>
  );
}
