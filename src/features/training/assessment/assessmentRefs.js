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
      measures: 'Processing speed via a Digit-Symbol Substitution paradigm — one of the most age-sensitive cognitive measures.',
      cites: ['Salthouse (1996)', 'Wechsler DSST', 'Deary et al. (2010)'],
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
      measures: 'سرعة المعالجة عبر نموذج استبدال الرمز بالرقم (DSST) — من أكثر المقاييس حساسية للعمر.',
      cites: ['Salthouse (1996)', 'Wechsler DSST', 'Deary et al. (2010)'],
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
  'Jaeger J (2018). Digit Symbol Substitution Test: the case for sensitivity over specificity. J Clin Psychopharmacol.',
  'Lu CH & Proctor RW (1995). The influence of irrelevant location information on performance (Simon effect). Psychon Bull Rev.',
  'Monsell S (2003). Task switching. Trends Cogn Sci.',
  'Basner M & Dinges DF (2011). Maximizing sensitivity of the Psychomotor Vigilance Test (PVT). Sleep.',
  'Jacobson NS & Truax P (1991). Clinical significance: a statistical approach to meaningful change (RCI). J Consult Clin Psychol.',
  'Levitt H (1971). Transformed up-down methods in psychoacoustics. J Acoust Soc Am.',
];

export const METHODOLOGY = {
  en:
    'Each domain runs a fixed, standardized block whose layout is re-randomized so it cannot be memorized. Raw performance is converted to a 0–100 domain score, then to an age-group percentile and a standard score (mean 100, SD 15) using the age trajectories below. Your Cognitive Index is the mean standard score across the domains you completed.',
  ar:
    'يشغّل كل مجال كتلة قياسية ثابتة يُعاد ترتيب تخطيطها كي لا تُحفظ. يُحوّل الأداء الخام إلى درجة 0–100 ثم إلى مئوية مقارنة بالفئة العمرية ودرجة معيارية (متوسط 100، انحراف 15) وفق منحنيات العمر أدناه. مؤشرك المعرفي هو متوسط الدرجات المعيارية للمجالات التي أكملتها.',
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
