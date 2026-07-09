/*
 * Cognitive battery protocol — aligned with brief digital batteries (MyCQ ~30 min,
 * CAB ~30–40 min) and classic paradigms: Mesulam cancellation, SDMT, Corsi span,
 * verbal fluency, Tower-of-London planning, spatial Stroop / task-switching.
 *
 * Fixed parameters + re-randomized layouts each session. Absolute scores are for
 * within-person tracking; age norms are research-informed guidelines only.
 */

export const BATTERY_DOMAINS = [
  'attention',
  'speed',
  'memory',
  'language',
  'reasoning',
  'flexibility',
];

/** Per-domain protocol summary (shown on ready screens & chooser). */
export const DOMAIN_PROTOCOL = {
  attention: {
    paradigmEn: 'Mesulam-style visual cancellation',
    paradigmAr: 'شطب بصري على نمط ميسولام',
    durationMin: 4,
    detailEn: 'Unscored practice · 4 timed grids · selective & sustained attention · RT stability',
    detailAr: 'تجربة غير محتسبة · ٤ شبكات موقّتة · انتباه انتقائي ومستمر · استقرار زمن الاستجابة',
  },
  speed: {
    paradigmEn: 'Symbol–Digit Modalities Test (SDMT)',
    paradigmAr: 'اختبار رموز–أرقام (SDMT)',
    durationMin: 4,
    detailEn: 'Practice · motor baseline · 120 s scored substitution',
    detailAr: 'تجربة · خط أساس حركي · ١٢٠ ث من الاستبدال المُقيّم',
  },
  memory: {
    paradigmEn: 'Corsi block span (forward + backward)',
    paradigmAr: 'مدى كورسي (أمامي + عكسي)',
    durationMin: 5,
    detailEn: 'Practice spans · adaptive ladder · visuospatial working memory',
    detailAr: 'امتدادات تجريبية · سلّم تكيّفي · ذاكرة عاملة بصرية-مكانية',
  },
  language: {
    paradigmEn: 'Timed verbal fluency (letter-link grid)',
    paradigmAr: 'طلاقة لفظية موقّتة (شبكة حروف)',
    durationMin: 3,
    detailEn: 'Unscored practice · 120 s word-finding · lexical access',
    detailAr: 'تجربة غير محتسبة · ١٢٠ ث لتكوين كلمات · وصول معجمي',
  },
  reasoning: {
    paradigmEn: 'Sliding-block planning (Rush Hour / ToL family)',
    paradigmAr: 'تخطيط انزلاق القطع (عائلة برج لندن)',
    durationMin: 6,
    detailEn: 'Warm-up puzzle · 4 scored planning puzzles (session-randomized) · move efficiency',
    detailAr: 'لغز إحماء · ٤ ألغاز تخطيط محتسبة (عشوائية لكل جلسة) · كفاءة الحركات',
  },
  flexibility: {
    paradigmEn: 'Spatial Stroop + rule switching',
    paradigmAr: 'ستروب مكاني + تبديل القواعد',
    durationMin: 4,
    detailEn: '4 practice trials · 44 measured · switch cost & interference',
    detailAr: '٤ تجارب تدريب · ٤٤ محتسبة · تكلفة التبديل والتداخل',
  },
};

export function batteryDurationMin(domainIds = BATTERY_DOMAINS) {
  return domainIds.reduce((sum, id) => sum + (DOMAIN_PROTOCOL[id]?.durationMin ?? 4), 0);
}

export function batteryDurationLabel(isAr, domainIds = BATTERY_DOMAINS) {
  const mins = batteryDurationMin(domainIds);
  return isAr ? `~${mins} د · ٦ نماذج معرفية` : `~${mins} min · 6 cognitive paradigms`;
}

/** Games used in the formal battery — prefer these when training a weak domain. */
export const ASSESSMENT_GAME_BY_DOMAIN = {
  attention: 'cancel-task',
  speed: 'speed-match',
  memory: 'memo-span',
  language: 'wordle',
  reasoning: 'rush-hour',
  flexibility: 'spatial-stroop',
};
