/*
 * Tier 2 — six beats, four actors, and one deliberate misdirection.
 *
 * The trap is beat 4: it reads like the ending (everyone celebrates) but the
 * story continues. Players who order by "which beat feels final" get it wrong;
 * players who actually encoded the sequence do not. That is the point.
 */
export const SEED_AND_STORM = {
  id: 'seed-and-storm',
  tier: 2,
  title: { en: 'The Seed and the Storm', ar: 'البذرة والعاصفة' },
  moral: {
    en: 'Patience is not waiting for nothing to go wrong. It is starting again when it does.',
    ar: 'الصبر ليس انتظار ألّا يسوء شيء. بل هو البدء من جديد حين يسوء.',
  },
  cast: ['ramy', 'star', 'lola', 'fadi'],
  beats: [
    {
      id: 'b1',
      sky: 'dawn',
      label: { en: 'Ramy plants the last row', ar: 'رامي يزرع الصف الأخير' },
      narr: {
        en: 'Ramy pressed the last seed into the last row just after sunrise. Forty days of digging the terrace out of a stony slope, and now there was nothing left to do but wait.',
        ar: 'غرس رامي البذرة الأخيرة في الصف الأخير بُعيد الشروق. أربعون يومًا من حفر المدرَّج في منحدر صخري، ولم يبق الآن سوى الانتظار.',
      },
      actors: [{ id: 'ramy', act: 'work', x: 0 }],
    },
    {
      id: 'b2',
      sky: 'noon',
      label: { en: 'Star counts the days aloud', ar: 'ستار يعدّ الأيام بصوت عالٍ' },
      narr: {
        en: 'Star took to announcing the count every morning from the top of the wall. On the ninth day the first green thread came up, and Star announced that too, much louder.',
        ar: 'أخذ ستار يعلن العدّ كل صباح من أعلى الجدار. وفي اليوم التاسع ظهر أول خيط أخضر، فأعلن ستار ذلك أيضًا، وبصوت أعلى بكثير.',
      },
      actors: [
        { id: 'ramy', act: 'wait', x: -0.6 },
        { id: 'star', act: 'cheer', x: 0.5 },
      ],
      say: { who: 'star', t: { en: 'Nine days! Nine! Come and look!', ar: 'تسعة أيام! تسعة! تعالوا وانظروا!' } },
    },
    {
      id: 'b3',
      sky: 'dusk',
      label: { en: 'Lola reads the sky wrong', ar: 'لولا تقرأ السماء خطأً' },
      narr: {
        en: 'Lola studied the bruised clouds gathering over the ridge and said they would pass to the north. She was certain enough that nobody covered the terrace that evening.',
        ar: 'تفحّصت لولا الغيوم الكامدة المتجمّعة فوق الحافة وقالت إنها ستمرّ شمالًا. كانت واثقة بما يكفي فلم يغطِّ أحد المدرَّج تلك الليلة.',
      },
      actors: [
        { id: 'lola', act: 'search', x: -0.3 },
        { id: 'ramy', act: 'idle', x: 0.6 },
      ],
    },
    {
      id: 'b4',
      sky: 'night',
      label: { en: 'The storm takes the terrace', ar: 'العاصفة تأخذ المدرَّج' },
      narr: {
        en: 'The rain came sideways at midnight and took the top two rows down the slope in a single slide of mud. By morning the terrace was a smear of brown and the green threads were gone.',
        ar: 'جاء المطر مائلًا عند منتصف الليل وأخذ الصفّين العلويين إلى أسفل المنحدر في انزلاق طيني واحد. وبحلول الصباح صار المدرَّج لطخة بنّية واختفت الخيوط الخضراء.',
      },
      actors: [
        { id: 'ramy', act: 'upset', x: -0.5 },
        { id: 'lola', act: 'upset', x: 0.4 },
      ],
    },
    {
      id: 'b5',
      sky: 'dawn',
      label: { en: 'Fadi arrives with stakes', ar: 'فادي يصل بالأوتاد' },
      narr: {
        en: 'Fadi walked up the slope at first light carrying a bundle of stakes. He did not say a word about whose fault it was; he just started marking out where the retaining wall should have gone.',
        ar: 'صعد فادي المنحدر مع أول ضوء حاملًا حزمة من الأوتاد. لم ينبس بكلمة عن خطأ من كان؛ بل بدأ ببساطة يعلّم أين كان ينبغي أن يقوم الجدار الساند.',
      },
      actors: [
        { id: 'fadi', act: 'arrive', x: 0.7 },
        { id: 'ramy', act: 'idle', x: -0.6 },
        { id: 'lola', act: 'idle', x: 0 },
      ],
    },
    {
      id: 'b6',
      sky: 'noon',
      label: { en: 'They plant it again, walled', ar: 'يزرعونه ثانيةً، بجدار' },
      narr: {
        en: 'They built the wall first this time, then planted behind it. Star resumed the morning count from one, and nobody minded starting the number over.',
        ar: 'بنَوا الجدار أولًا هذه المرة، ثم زرعوا خلفه. استأنف ستار العدّ الصباحي من واحد، ولم يمانع أحد أن يبدأ الرقم من جديد.',
      },
      actors: [
        { id: 'ramy', act: 'work', x: -0.8 },
        { id: 'fadi', act: 'work', x: -0.1 },
        { id: 'lola', act: 'agree', x: 0.6 },
        { id: 'star', act: 'cheer', x: 1 },
      ],
    },
  ],
  probes: [
    {
      id: 'p1',
      kind: 'what',
      q: { en: 'On which day did the first green thread appear?', ar: 'في أيّ يوم ظهر أول خيط أخضر؟' },
      options: [
        { v: 'd9', l: { en: 'The ninth day', ar: 'اليوم التاسع' } },
        { v: 'd3', l: { en: 'The third day', ar: 'اليوم الثالث' } },
        { v: 'd40', l: { en: 'The fortieth day', ar: 'اليوم الأربعون' } },
      ],
      answer: 'd9',
    },
    {
      id: 'p2',
      kind: 'who',
      q: { en: 'Who said the clouds would pass to the north?', ar: 'من قال إن الغيوم ستمرّ شمالًا؟' },
      options: [
        { v: 'lola', l: { en: 'Lola', ar: 'لولا' } },
        { v: 'fadi', l: { en: 'Fadi', ar: 'فادي' } },
        { v: 'star', l: { en: 'Star', ar: 'ستار' } },
      ],
      answer: 'lola',
    },
    {
      id: 'p3',
      kind: 'what',
      q: { en: 'What did Fadi carry up the slope?', ar: 'ماذا حمل فادي صاعدًا المنحدر؟' },
      options: [
        { v: 'stakes', l: { en: 'A bundle of stakes', ar: 'حزمة من الأوتاد' } },
        { v: 'seeds', l: { en: 'A sack of new seed', ar: 'كيس من البذور الجديدة' } },
        { v: 'water', l: { en: 'Two pails of water', ar: 'دلوان من الماء' } },
      ],
      answer: 'stakes',
    },
    {
      id: 'p4',
      kind: 'what',
      q: { en: 'What did they do differently the second time?', ar: 'ما الذي فعلوه بشكل مختلف في المرة الثانية؟' },
      options: [
        { v: 'wall', l: { en: 'Built the wall before planting', ar: 'بنَوا الجدار قبل الزراعة' } },
        { v: 'lower', l: { en: 'Planted lower down the slope', ar: 'زرعوا في أسفل المنحدر' } },
        { v: 'waited', l: { en: 'Waited for the next season', ar: 'انتظروا الموسم التالي' } },
      ],
      answer: 'wall',
    },
  ],
};
