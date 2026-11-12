import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';

const CASES = [
  {
    caseTitleEn: 'The Cosmic Crystal Mystery 💎',
    caseTitleAr: 'لغز بلورة الطاقة الكونية 💎',
    ruleEn: 'The thief is the ONLY one who lies. All innocent witnesses tell the truth.',
    ruleAr: 'الفاعل هو الوحيد الذي يكذب! بينما يشهد جميع الأبرياء بالصدق.',
    clueEn: 'Evidence: Security sensors detected a contradiction in testimonies.',
    clueAr: 'الدليل: كشفت مجسات المراقبة عن إفادة كاذبة تناقض الوقائع.',
    culpritId: 'fadi',
    explanationEn: 'Lola and Ramy spoke truthfully. Fadi lied by falsely accusing Lola.',
    explanationAr: 'لولا ورامي قالا الحقيقة. فادي كذب حين اتهم لولا باطلاً لإبعاد الشبهة عنه.',
    suspects: [
      {
        id: 'lola',
        nameEn: 'Lola',
        nameAr: 'لولا',
        avatar: '👩‍🔬',
        traitEn: 'Scientist · Lab coat',
        traitAr: 'عالمة أبحاث · معطف مختبر',
        statementEn: '"I was in the control room monitoring orbital signals."',
        statementAr: '"كنت في غرفة المراقبة أحلل الإشارات المدارية."',
      },
      {
        id: 'ramy',
        nameEn: 'Ramy',
        nameAr: 'رامي',
        avatar: '🧑‍🚀',
        traitEn: 'Pilot · Flight gear',
        traitAr: 'طيار مداري · سترة ملاحة',
        statementEn: '"I can confirm Lola was in the control room all evening."',
        statementAr: '"أؤكد أن لولا كانت في غرفة المراقبة طوال المساء."',
      },
      {
        id: 'fadi',
        nameEn: 'Fadi',
        nameAr: 'فادي',
        avatar: '🕵️',
        traitEn: 'Technician · Dark jacket',
        traitAr: 'فني صيانة · سترة داكنة',
        statementEn: '"Lola took the crystal and hid it in her locker!"',
        statementAr: '"لولا هي من أخذت البلورة وخبأتها في خزانتها!"',
      },
    ],
  },
  {
    caseTitleEn: 'The Golden Star Map 📜',
    caseTitleAr: 'خريطة النجوم الذهبية 📜',
    ruleEn: 'Exactly one suspect is lying to protect their tracks.',
    ruleAr: 'مشتبه به واحد فقط يكذب للتستر على فعلته.',
    clueEn: 'Evidence: Two witnesses corroborated each other in the archive library.',
    clueAr: 'الدليل: شاهدان أكدا وجودهما معاً في مكتبة الأرشيف لحظة الاختفاء.',
    culpritId: 'ramy',
    explanationEn: 'Noor and Star verified each other. Ramy lied claiming Noor was alone.',
    explanationAr: 'نور وستار أثبتا وجودهما معاً، بينما كذب رامي بادعائه رؤية نور وحيداً.',
    suspects: [
      {
        id: 'mimi',
        nameEn: 'Noor',
        nameAr: 'نور',
        avatar: '👧',
        traitEn: 'Archivist · Scholar badge',
        traitAr: 'أمينة الأرشيف · وسام المعرفة',
        statementEn: '"I was reading star catalogs in the library with Star."',
        statementAr: '"كنت أقرأ فهارس النجوم في المكتبة برفقة ستار."',
      },
      {
        id: 'star',
        nameEn: 'Star',
        nameAr: 'ستار',
        avatar: '⭐',
        traitEn: 'Navigator · Star compass',
        traitAr: 'ملاح كوني · بوصلة نجمية',
        statementEn: '"That is true, Noor and I never left the study desk."',
        statementAr: '"هذا صحيح تماماً، لم نغادر طاولة القراءة معاً."',
      },
      {
        id: 'ramy',
        nameEn: 'Ramy',
        nameAr: 'رامي',
        avatar: '🧑‍🚀',
        traitEn: 'Pilot · Flight gear',
        traitAr: 'طيار مداري · سترة ملاحة',
        statementEn: '"Noor was wandering alone in the restricted vault!"',
        statementAr: '"رأيت نور يتجول وحيداً في القبو المحظور!"',
      },
    ],
  },
  {
    caseTitleEn: 'The Portal Core Key 🔑',
    caseTitleAr: 'مفتاح بوابة العبور 🔑',
    ruleEn: 'The culprit denies the event entirely; the honest witness exposed the truth.',
    ruleAr: 'الفاعل ينكر وقوع الحادثة كلياً، بينما الشاهد الأمين كشف الحقيقة.',
    clueEn: 'Evidence: Traces of portal coolant were found on the guilty suspect.',
    clueAr: 'الدليل: وُجدت آثار مادة تبريد البوابة على ملابس الفاعل.',
    culpritId: 'fadi',
    explanationEn: 'Fadi lied claiming the key was never missing to hide his theft.',
    explanationAr: 'فادي أنكر اختفاء المفتاح كلياً لتضليل التحقيق وإخفاء جريمته.',
    suspects: [
      {
        id: 'lola',
        nameEn: 'Lola',
        nameAr: 'لولا',
        avatar: '👩‍🔬',
        traitEn: 'Scientist · Lab coat',
        traitAr: 'عالمة أبحاث · معطف مختبر',
        statementEn: '"The portal core key went missing right at 18:00."',
        statementAr: '"فُقد مفتاح البوابة في تمام الساعة السادسة مساءً."',
      },
      {
        id: 'star',
        nameEn: 'Star',
        nameAr: 'ستار',
        avatar: '⭐',
        traitEn: 'Navigator · Star compass',
        traitAr: 'ملاح كوني · بوصلة نجمية',
        statementEn: '"I saw Fadi tampering with the key console."',
        statementAr: '"رأيت فادي يعبث بوحدة تشغيل المفتاح."',
      },
      {
        id: 'fadi',
        nameEn: 'Fadi',
        nameAr: 'فادي',
        avatar: '🕵️',
        traitEn: 'Technician · Dark jacket',
        traitAr: 'فني صيانة · سترة داكنة',
        statementEn: '"Nothing was lost, the portal key never moved from its slot!"',
        statementAr: '"لم يضع أي شيء، المفتاح لم يتحرك من مكانه أصلاً!"',
      },
    ],
  },
];

const TOTAL_CASES = 3;

export default function DuolingoDetective({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [caseIndex, setCaseIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedSuspectId, setSelectedSuspectId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentCase = useMemo(() => {
    return CASES[caseIndex % CASES.length];
  }, [caseIndex]);

  const handleSelectSuspect = useCallback(
    (suspectId) => {
      if (feedback !== null) return;
      playSfx?.('tap');
      setSelectedSuspectId(suspectId);

      const isCorrect = suspectId === currentCase.culpritId;

      if (isCorrect) {
        playSfx?.('ding');
        setStreak((s) => s + 1);
        setScore((sc) => sc + 25);
        setFeedback({
          isCorrect: true,
          title: isAr ? 'استنتاج عبقري! كشفت الفاعل 🔍' : 'Brilliant Deduction! Culprit Caught 🔍',
          subtitle: isAr ? currentCase.explanationAr : currentCase.explanationEn,
        });
      } else {
        playSfx?.('error');
        setStreak(0);
        setFeedback({
          isCorrect: false,
          title: isAr ? 'هذا المشتبه به بريء!' : 'Innocent suspect!',
          subtitle: isAr ? currentCase.explanationAr : currentCase.explanationEn,
        });
      }
    },
    [currentCase, feedback, isAr, playSfx]
  );

  const handleContinue = () => {
    if (caseIndex + 1 >= TOTAL_CASES) {
      awardPoints?.(score);
      setIsCompleted(true);
    } else {
      setCaseIndex((c) => c + 1);
      setSelectedSuspectId(null);
      setFeedback(null);
    }
  };

  const progressPercent = Math.round(((caseIndex + (feedback ? 1 : 0)) / TOTAL_CASES) * 100);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={score + 35}
        accuracy={Math.min(100, Math.round((score / (TOTAL_CASES * 25)) * 100))}
        streak={streak}
        title={isAr ? 'كبير المحققين المعتمد!' : 'Master Detective Certified!'}
        subtitle={
          isAr
            ? 'قدرة استثنائية على تحليل الإفادات والاستدلال الاستنباطي.'
            : 'Unrivaled deductive reasoning, truth-table analysis and keen logic.'
        }
        onComplete={onBack}
      />
    );
  }

  return (
    <DuolingoGameShell progress={progressPercent} streak={streak} onClose={onBack}>
      <div className="duo-detective-container" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Mascot Prompt */}
        <div className="duo-prompt-card">
          <span className="duo-prompt-mascot">🕵️</span>
          <div className="duo-prompt-bubble">
            {isAr
              ? `قضية رقم (${caseIndex + 1}/${TOTAL_CASES}) · اقرأ الإفادات بعناية واضغط على المشتبه به الفاعل`
              : `Case File (${caseIndex + 1}/${TOTAL_CASES}) · Read testimonies closely & tap the true culprit`}
          </div>
        </div>

        {/* Case Dossier Header */}
        <div className="duo-case-file-card">
          <div className="duo-case-badge">
            📁 {isAr ? currentCase.caseTitleAr : currentCase.caseTitleEn}
          </div>
          <div className="duo-case-rule">
            ⚖️ {isAr ? currentCase.ruleAr : currentCase.ruleEn}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>
            🔎 {isAr ? currentCase.clueAr : currentCase.clueEn}
          </div>
        </div>

        {/* Suspect Dossier Cards */}
        <div className="duo-suspects-grid">
          {currentCase.suspects.map((s) => {
            let stateClass = '';
            if (feedback !== null) {
              if (s.id === currentCase.culpritId) {
                stateClass = 'is-culprit';
              }
            } else if (s.id === selectedSuspectId) {
              stateClass = 'is-selected';
            }

            return (
              <div
                key={s.id}
                className={`duo-dossier-card ${stateClass}`}
                onClick={() => handleSelectSuspect(s.id)}
              >
                <div className="duo-suspect-portrait">{s.avatar}</div>

                <div className="duo-suspect-info">
                  <div className="duo-suspect-name">
                    <span>{isAr ? s.nameAr : s.nameEn}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                      }}
                    >
                      ({isAr ? s.traitAr : s.traitEn})
                    </span>
                  </div>
                  <div className="duo-suspect-statement">
                    {isAr ? s.statementAr : s.statementEn}
                  </div>
                </div>

                <div
                  className="duo-level-pill"
                  style={{
                    padding: '8px 12px',
                    fontSize: 12,
                    background: s.id === selectedSuspectId ? '#2586f7' : '#ffffff',
                    color: s.id === selectedSuspectId ? '#ffffff' : '#2586f7',
                  }}
                >
                  {isAr ? 'اتهام' : 'Accuse'}
                </div>
              </div>
            );
          })}
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
