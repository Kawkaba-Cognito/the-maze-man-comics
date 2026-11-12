import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';

const GATE_RULES = [
  {
    ruleEn: 'Rule: Only Blue or Orange folk may pass the portal.',
    ruleAr: 'القانون: لا يعبر البوابة إلا آل الأزرق أو البرتقالي.',
    check: (t) => t.folk === 'blue' || t.folk === 'orange',
    candidates: [
      {
        id: 'c1',
        nameEn: 'Toti',
        nameAr: 'توتي',
        folk: 'blue',
        folkLabelEn: 'Blue Folk',
        folkLabelAr: 'آل الأزرق',
        shape: 'round',
        shapeLabelEn: 'Round',
        shapeLabelAr: 'مستدير',
        moons: 2,
        fill: 'plain',
        fillLabelEn: 'Plain',
        fillLabelAr: 'سادة',
        emoji: '🔵',
      },
      {
        id: 'c2',
        nameEn: 'Vara',
        nameAr: 'فارا',
        folk: 'purple',
        folkLabelEn: 'Purple Folk',
        folkLabelAr: 'آل البنفسجي',
        shape: 'pointy',
        shapeLabelEn: 'Pointy',
        shapeLabelAr: 'مدبب',
        moons: 1,
        fill: 'striped',
        fillLabelEn: 'Striped',
        fillLabelAr: 'مخطط',
        emoji: '🟣',
      },
    ],
  },
  {
    ruleEn: 'Rule: Only travellers with 2 or more Moons may enter.',
    ruleAr: 'القانون: لا يعبر إلا أصحاب القمرين أو أكثر.',
    check: (t) => t.moons >= 2,
    candidates: [
      {
        id: 'c3',
        nameEn: 'Zeno',
        nameAr: 'زينو',
        folk: 'gold',
        folkLabelEn: 'Gold Folk',
        folkLabelAr: 'آل الذهبي',
        shape: 'boxy',
        shapeLabelEn: 'Boxy',
        shapeLabelAr: 'مربع',
        moons: 3,
        fill: 'plain',
        fillLabelEn: 'Plain',
        fillLabelAr: 'سادة',
        emoji: '🟡',
      },
      {
        id: 'c4',
        nameEn: 'Kira',
        nameAr: 'كيرا',
        folk: 'green',
        folkLabelEn: 'Green Folk',
        folkLabelAr: 'آل الأخضر',
        shape: 'round',
        shapeLabelEn: 'Round',
        shapeLabelAr: 'مستدير',
        moons: 1,
        fill: 'striped',
        fillLabelEn: 'Striped',
        fillLabelAr: 'مخطط',
        emoji: '🟢',
      },
    ],
  },
  {
    ruleEn: 'Rule: Only Striped travellers may pass.',
    ruleAr: 'القانون: لا يعبر إلا المسافرون المخطّطون.',
    check: (t) => t.fill === 'striped',
    candidates: [
      {
        id: 'c5',
        nameEn: 'Rico',
        nameAr: 'ريكو',
        folk: 'orange',
        folkLabelEn: 'Orange Folk',
        folkLabelAr: 'آل البرتقالي',
        shape: 'round',
        shapeLabelEn: 'Round',
        shapeLabelAr: 'مستدير',
        moons: 1,
        fill: 'striped',
        fillLabelEn: 'Striped',
        fillLabelAr: 'مخطط',
        emoji: '🟠',
      },
      {
        id: 'c6',
        nameEn: 'Milo',
        nameAr: 'ميلو',
        folk: 'blue',
        folkLabelEn: 'Blue Folk',
        folkLabelAr: 'آل الأزرق',
        shape: 'boxy',
        shapeLabelEn: 'Boxy',
        shapeLabelAr: 'مربع',
        moons: 2,
        fill: 'plain',
        fillLabelEn: 'Plain',
        fillLabelAr: 'سادة',
        emoji: '🔵',
      },
    ],
  },
];

const TOTAL_ROUNDS = 6;

export default function DuolingoGatekeeper({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [stepIndex, setStepIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Derive current rule and candidate
  const ruleIdx = Math.floor(stepIndex / 2) % GATE_RULES.length;
  const candIdx = stepIndex % 2;
  const currentRuleObj = GATE_RULES[ruleIdx];
  const candidate = currentRuleObj.candidates[candIdx];

  const ruleText = isAr ? currentRuleObj.ruleAr : currentRuleObj.ruleEn;
  const shouldPass = currentRuleObj.check(candidate);

  const handleDecision = useCallback(
    (action) => {
      if (feedback !== null) return;

      const isPassAction = action === 'pass';
      const isCorrect = isPassAction === shouldPass;

      if (isCorrect) {
        playSfx?.('ding');
        setStreak((s) => s + 1);
        setScore((sc) => sc + 15);
        setFeedback({
          isCorrect: true,
          title: isAr
            ? isPassAction
              ? 'قرار سليم! سُمح له بالعبور ✓'
              : 'قرار حكيم! تم رفضه لمخالفة الشرط ✓'
            : isPassAction
            ? 'Correct! Portal entry granted ✓'
            : 'Wise call! Access denied per rule ✓',
          subtitle: ruleText,
        });
      } else {
        playSfx?.('error');
        setStreak(0);
        setFeedback({
          isCorrect: false,
          title: isAr ? 'مخالفة لقانون البوابة!' : 'Gate rule violated!',
          subtitle: ruleText,
        });
      }
    },
    [feedback, isAr, playSfx, ruleText, shouldPass]
  );

  const handleContinue = () => {
    if (stepIndex + 1 >= TOTAL_ROUNDS) {
      awardPoints?.(score);
      setIsCompleted(true);
    } else {
      setStepIndex((s) => s + 1);
      setFeedback(null);
    }
  };

  const progressPercent = Math.round(((stepIndex + (feedback ? 1 : 0)) / TOTAL_ROUNDS) * 100);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={score + 25}
        accuracy={Math.min(100, Math.round((score / (TOTAL_ROUNDS * 15)) * 100))}
        streak={streak}
        title={isAr ? 'حارس البوابة المثالي!' : 'Gatekeeper Protocol Mastered!'}
        subtitle={
          isAr
            ? 'قدرة فائقة على استنتاج القوانين وفحص الفرضيات المنطقية.'
            : 'Outstanding rule induction and hypothesis verification.'
        }
        onComplete={onBack}
      />
    );
  }

  return (
    <DuolingoGameShell progress={progressPercent} streak={streak} onClose={onBack}>
      <div className="duo-gatekeeper-container" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Mascot Prompt */}
        <div className="duo-prompt-card">
          <span className="duo-prompt-mascot">🛡️</span>
          <div className="duo-prompt-bubble">
            {isAr
              ? `افحص المسافر (${stepIndex + 1}/${TOTAL_ROUNDS}) · هل يستوفي قانون البوابة للعبور؟`
              : `Inspect traveller (${stepIndex + 1}/${TOTAL_ROUNDS}) · Does this candidate obey the portal law?`}
          </div>
        </div>

        {/* Secret Law Banner */}
        <div className="duo-gate-rule-banner">
          <span style={{ fontSize: 24 }}>📜</span>
          <span style={{ fontSize: 16 }}>{ruleText}</span>
        </div>

        {/* Traveller Inspection Card */}
        <div className="duo-traveller-display-card">
          <div className="duo-traveller-avatar">{candidate.emoji}</div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#1e293b' }}>
            {isAr ? candidate.nameAr : candidate.nameEn}
          </h2>

          <div className="duo-traveller-attributes">
            <span className="duo-attr-chip">
              {isAr ? candidate.folkLabelAr : candidate.folkLabelEn}
            </span>
            <span className="duo-attr-chip">
              {isAr ? candidate.shapeLabelAr : candidate.shapeLabelEn}
            </span>
            <span className="duo-attr-chip">
              {isAr ? `الأقمار: ${candidate.moons} 🌙` : `Moons: ${candidate.moons} 🌙`}
            </span>
            <span className="duo-attr-chip">
              {isAr ? candidate.fillLabelAr : candidate.fillLabelEn}
            </span>
          </div>
        </div>

        {/* 3D Action Buttons: Reject & Pass */}
        <div className="duo-gate-actions">
          <button
            type="button"
            className="duo-btn-reject"
            onClick={() => handleDecision('reject')}
            disabled={feedback !== null}
          >
            ✕ {isAr ? 'رفض العبور' : 'Reject'}
          </button>
          <button
            type="button"
            className="duo-btn-pass"
            onClick={() => handleDecision('pass')}
            disabled={feedback !== null}
          >
            ✓ {isAr ? 'السماح بالعبور' : 'Admit / Pass'}
          </button>
        </div>

        {/* Feedback Drawer */}
        <DuolingoFeedbackDrawer
          isOpen={!!feedback}
          isCorrect={feedback?.isCorrect}
          title={feedback?.title}
          subtitle={feedback?.subtitle}
          onContinue={handleContinue}
        />
      </div>
    </DuolingoGameShell>
  );
}
