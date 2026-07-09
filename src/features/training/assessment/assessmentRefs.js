/* =============================================================================
 * NEUROSCIENCE BACKING for the assessment battery.
 *
 * Each domain maps to a well-validated cognitive construct and paradigm. The
 * citations below are the primary literature the tasks and age model draw on.
 * Shown in the report's "Methodology & science" section.
 * ========================================================================== */

export const DOMAIN_SCIENCE = {
  en: {
    attention: {
      measures: 'Selective & sustained attention, response inhibition, and attentional stability (RT variability), via a Mesulam-style cancellation/visual-search task.',
      cites: ['Mesulam (1985)', 'Castellanos et al. (2005)', 'Bellgrove et al. (2004)'],
    },
    speed: {
      measures: 'Processing speed via a Symbol-Digit Modalities paradigm (SDMT) — one of the most sensitive and age-sensitive cognitive measures.',
      cites: ['Smith (1982) SDMT', 'Salthouse (1996)', 'Deary et al. (2010)'],
    },
    memory: {
      measures: 'Visuospatial working memory (storage + manipulation) via Corsi block span, forward and backward.',
      cites: ['Corsi (1972)', 'Baddeley (2003)', 'Kessels et al. (2000)'],
    },
    language: {
      measures: 'Verbal ability / lexical access — a crystallized skill that holds and grows with age.',
      cites: ['Horn & Cattell (1967)', 'Shao et al. (2014)', 'Hartshorne & Germine (2015)'],
    },
    reasoning: {
      measures: 'Planning, working-memory load and fluid problem-solving via a sliding-block (Rush Hour) puzzle, related to Tower-of-London planning.',
      cites: ['Shallice (1982)', 'Cattell (1971)', 'Duncan (2010)'],
    },
    flexibility: {
      measures: 'Cognitive flexibility (set-shifting) and interference control via a wordless spatial-Stroop / Simon task with rule switching.',
      cites: ['Stroop (1935)', 'Simon & Rudell (1967)', 'Miyake et al. (2000)', 'Rogers & Monsell (1995)'],
    },
  },
  ar: {
    attention: {
      measures: 'الانتباه الانتقائي والمستمر، وكبح الاستجابة، واستقرار الانتباه (تغيّر زمن الاستجابة) عبر مهمة شطب/بحث بصري على نمط ميسولام.',
      cites: ['Mesulam (1985)', 'Castellanos et al. (2005)', 'Bellgrove et al. (2004)'],
    },
    speed: {
      measures: 'سرعة المعالجة عبر نموذج رموز–أرقام (SDMT) — من أكثر المقاييس حساسية وحساسية للعمر.',
      cites: ['Smith (1982) SDMT', 'Salthouse (1996)', 'Deary et al. (2010)'],
    },
    memory: {
      measures: 'الذاكرة العاملة البصرية المكانية (تخزين + معالجة) عبر مدى كورسي، أماماً وعكساً.',
      cites: ['Corsi (1972)', 'Baddeley (2003)', 'Kessels et al. (2000)'],
    },
    language: {
      measures: 'القدرة اللفظية والوصول المعجمي — مهارة متبلورة تثبت وتنمو مع العمر.',
      cites: ['Horn & Cattell (1967)', 'Shao et al. (2014)', 'Hartshorne & Germine (2015)'],
    },
    reasoning: {
      measures: 'التخطيط وحِمل الذاكرة العاملة وحل المشكلات المرن عبر لغز انزلاق المكعبات، المرتبط بتخطيط برج لندن.',
      cites: ['Shallice (1982)', 'Cattell (1971)', 'Duncan (2010)'],
    },
    flexibility: {
      measures: 'المرونة الذهنية (تبديل المجموعات) وضبط التداخل عبر مهمة ستروب/سايمون مكانية بلا كلمات مع تبديل القواعد.',
      cites: ['Stroop (1935)', 'Simon & Rudell (1967)', 'Miyake et al. (2000)', 'Rogers & Monsell (1995)'],
    },
  },
};

/** Age-model + composite literature shown under "References". */
export const REFERENCES = [
  'Salthouse TA (1996). The processing-speed theory of adult age differences in cognition. Psychol Rev.',
  'Park DC & Reuter-Lorenz P (2009). The adaptive brain: aging and neurocognitive scaffolding (STAC). Annu Rev Psychol.',
  'Hartshorne JK & Germine LT (2015). When does cognitive functioning peak? Psychol Sci.',
  'Verhaeghen P (2003). Aging and vocabulary scores: a meta-analysis. Psychol Aging.',
  'Miyake A et al. (2000). The unity and diversity of executive functions. Cogn Psychol.',
  'Townsend JT & Ashby FG (1983). Stochastic modeling of elementary psychological processes (IES).',
  'Kessels RPC et al. (2000). The Corsi Block-Tapping Task: standardization and normative data. Appl Neuropsychol.',
  'Monaco M et al. (2013). Forward and backward span for verbal and visuo-spatial data. Neurol Sci.',
  'Smith A (1982). Symbol Digit Modalities Test (SDMT): Manual. Western Psychological Services.',
  'Jaeger J (2018). Digit Symbol Substitution Test: the case for sensitivity over specificity. J Clin Psychopharmacol.',
  'Lu CH & Proctor RW (1995). The influence of irrelevant location information on performance (Simon effect). Psychon Bull Rev.',
  'Monsell S (2003). Task switching. Trends Cogn Sci.',
  'Basner M & Dinges DF (2011). Maximizing sensitivity of the Psychomotor Vigilance Test (PVT). Sleep.',
  'Jacobson NS & Truax P (1991). Clinical significance: a statistical approach to meaningful change (RCI). J Consult Clin Psychol.',
  'Levitt H (1971). Transformed up-down methods in psychoacoustics. J Acoust Soc Am.',
];

export const METHODOLOGY = {
  en:
    'The full battery runs six published paradigms (~25–30 min): Mesulam cancellation, SDMT (120 s), Corsi span, timed verbal fluency (120 s), dual planning puzzles, and spatial Stroop (44 trials). Each block uses fixed parameters with re-randomized layouts. Raw performance converts to 0–100 domain scores, then age-group percentiles and standard scores (mean 100, SD 15). Your Cognitive Index is the mean SS across completed domains. Re-test every 4–8 weeks to track reliable change (RCI).',
  ar:
    'يشغّل التقييم الكامل ستة نماذج منشورة (~٢٥–٣٠ د): شطب ميسولام، SDMT (١٢٠ ث)، مدى كورسي، طلاقة لفظية موقّتة (١٢٠ ث)، لغزا تخطيط، وستروب مكاني (٤٤ تجربة). كل كتلة بمعاملات ثابتة وتخطيط مُعاد عشوائياً. يُحوّل الأداء إلى درجات 0–100 ثم مئويات ودرجات معيارية (متوسط 100). مؤشرك المعرفي متوسط SS للمجالات المكتملة. أعد الاختبار كل 4–8 أسابيع لتتبّع التغيّر الموثوق.',
};

export const NORM_DISCLAIMER_AR =
  'تستخدم المقارنات قيماً مرجعية مستندة إلى الأبحاث، وليست معايير سريرية أو سكانية مُعتمدة. اعتبر المقارنة بالفئة العمرية إرشادية؛ والإشارة الأكثر موثوقية هي تغيّرك مع الوقت.';

export const VALIDITY_NOTE = {
  en:
    'Validity: every block uses a fixed, standardized protocol with re-randomized layouts (no memorization), maps to a published paradigm, and uses efficiency-style scoring to limit speed–accuracy trade-offs. Anticipatory responses (<~150 ms) are filtered. Absolute scores are not standardized across devices/conditions, so the valid use is within one person.',
  ar:
    'الصدق: تستخدم كل كتلة بروتوكولاً قياسياً ثابتاً بتخطيط مُعاد عشوائياً (لا حفظ)، وترتبط بنموذج منشور، وتعتمد تسجيلاً قائماً على الكفاءة للحد من مقايضة السرعة والدقة. تُستبعد الاستجابات الاستباقية (<~150 مل ث). الدرجات المطلقة غير موحّدة بين الأجهزة/الظروف، لذا الاستخدام الصحيح ضمن الشخص نفسه.',
};

export const RELIABILITY_NOTE = {
  en:
    'Reliability: each score is shown with a 90% confidence interval from its standard error of measurement (SEM = SD·√(1−r), using literature-informed test–retest reliabilities). Change vs your baseline is judged with a Reliable Change Index (Jacobson & Truax, 1991) — only changes beyond measurement noise are flagged as reliable.',
  ar:
    'الموثوقية: تُعرض كل درجة مع فاصل ثقة 90% من الخطأ المعياري للقياس (SEM = SD·√(1−r) باستخدام موثوقيات إعادة-اختبار مستندة للأبحاث). يُقيَّم التغيّر عن خط الأساس بمؤشر التغيّر الموثوق (Jacobson & Truax، 1991) — ولا يُعتمد إلا التغيّر الذي يتجاوز ضوضاء القياس.',
};
