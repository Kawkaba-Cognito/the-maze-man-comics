/** Case File base + three enhancement prototypes (B1 / B2 / B3). */
export const BASE_CASE_FILE = {
  confrontations: true,
  proofAccuse: true,
  evidenceSplit: true,
  reReview: true,
};

export const CASE_FILE_CONFIG = {
  b1: {
    id: 'b1',
    ic: '🎬',
    label: { en: 'B1 · Scene & Voice', ar: 'ب١ · المسرح والصوت' },
    blurb: {
      en: 'Case File + visual scene map, speech bubbles, one-panel crime hook.',
      ar: 'ملف القضية + مسرح مرئي، فقاعات حوار، لوحة افتتاحية واحدة.',
    },
    ...BASE_CASE_FILE,
    sceneBoard: true,
    sceneListToggle: true,
    speechBubbles: true,
    openingHook: true,
    clueSourceChip: true,
  },
  b2: {
    id: 'b2',
    ic: '📌',
    label: { en: 'B2 · Deduction Board', ar: 'ب٢ · لوحة الاستنتاج' },
    blurb: {
      en: 'Case File + suspect board, link clues to confront, accuse gate, proof preview.',
      ar: 'ملف القضية + لوحة مشتبهين، ربط الأدلة بالمواجهة، شرط الاتهام، معاينة الإثبات.',
    },
    ...BASE_CASE_FILE,
    deductionBoard: true,
    activeConfrontLink: true,
    accuseGate: true,
    accuseGateMinEvidence: 2,
    accuseGateMinConfronts: 1,
    proofPreview: true,
  },
  b3: {
    id: 'b3',
    ic: '📋',
    label: { en: 'B3 · Investigator File', ar: 'ب٣ · ملف المحقق' },
    blurb: {
      en: 'Case File + dossier UI, assistant nudges, interrogation transcript, verdict file.',
      ar: 'ملف القضية + واجهة ملف، تلميحات المساعد، محضر استجواب، صفحة الحكم.',
    },
    ...BASE_CASE_FILE,
    fileChrome: true,
    assistantNudges: true,
    transcriptUI: true,
    polaroidScene: true,
    verdictFile: true,
  },
};

export const CASE_FILE_VARIANTS = ['b1', 'b2', 'b3'];

/** @deprecated use CASE_FILE_CONFIG */
export const PROTO_CONFIG = CASE_FILE_CONFIG;
export const PROTO_VARIANTS = CASE_FILE_VARIANTS;
