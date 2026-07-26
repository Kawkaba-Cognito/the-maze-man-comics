/*
 * Tier 1 — five beats, three actors, one clean causal chain.
 *
 * Authoring rules that make the ORDER task honest:
 *  - Every beat must be causally later than the one before, but NOT guessable
 *    from its label alone. "Lola lights the lantern" before "the tide turns"
 *    would be orderable by logic; here the order has to be remembered.
 *  - `label` names the beat without retelling it (that is the narration's job).
 *  - Probes ask about detail the narration states once, in passing.
 */
export const LANTERN_TIDE = {
  id: 'lantern-tide',
  tier: 1,
  title: { en: 'The Lantern and the Tide', ar: 'الفانوس والمَدّ' },
  moral: {
    en: 'Asking for help is not giving up — it is how the work gets finished.',
    ar: 'طلب المساعدة ليس استسلامًا — بل هو الطريق لإتمام العمل.',
  },
  cast: ['lola', 'mimi', 'ramy'],
  beats: [
    {
      id: 'b1',
      sky: 'dusk',
      label: { en: 'Lola reaches the empty pier', ar: 'لولا تصل إلى الرصيف الخالي' },
      narr: {
        en: 'Lola walked out onto the pier with the harbour lantern under her arm. Every other light along the water was already burning; hers was the last one dark.',
        ar: 'مشت لولا إلى الرصيف وفانوس المرفأ تحت ذراعها. كانت كل الأضواء الأخرى على طول الماء مشتعلة؛ وفانوسها وحده ما زال مطفأً.',
      },
      actors: [{ id: 'lola', act: 'arrive', x: -0.2 }],
    },
    {
      id: 'b2',
      sky: 'dusk',
      label: { en: 'The wick will not catch', ar: 'الفتيل يأبى الاشتعال' },
      narr: {
        en: 'She struck the flint four times. The wick was damp from the spray and would not catch, and the wind off the water kept snuffing what little spark she made.',
        ar: 'قدحت الصوّان أربع مرات. كان الفتيل رطبًا من الرذاذ ويأبى الاشتعال، والريح القادمة من الماء تطفئ الشرارة الضئيلة التي تصنعها.',
      },
      actors: [{ id: 'lola', act: 'work', x: -0.2 }],
      say: { who: 'lola', t: { en: 'Come on. Catch. Please.', ar: 'هيّا. اشتعل. أرجوك.' } },
    },
    {
      id: 'b3',
      sky: 'night',
      label: { en: 'Mimi hears her from the rocks', ar: 'ميمي تسمعها من الصخور' },
      narr: {
        en: 'Mimi had been dozing on the warm rocks below. She climbed up, looked at the damp wick, and said nothing at all — she simply sat down and cupped her paws around it to block the wind.',
        ar: 'كانت ميمي تغفو على الصخور الدافئة في الأسفل. تسلّقت، ونظرت إلى الفتيل الرطب، ولم تقل شيئًا على الإطلاق — جلست ببساطة وأحاطت الفتيل بكفّيها لتحجب الريح.',
      },
      actors: [
        { id: 'lola', act: 'idle', x: -0.7 },
        { id: 'mimi', act: 'arrive', x: 0.4 },
      ],
    },
    {
      id: 'b4',
      sky: 'night',
      label: { en: 'Ramy brings the dry cloth', ar: 'رامي يحضر القماش الجاف' },
      narr: {
        en: 'Ramy came running the length of the pier with a dry cloth from the boat shed. Between the three of them — the cloth, the cupped paws, and the flint — the wick finally took.',
        ar: 'جاء رامي راكضًا على طول الرصيف بقطعة قماش جافة من كوخ القوارب. وبينهم الثلاثة — القماش والكفّان المحيطتان والصوّان — اشتعل الفتيل أخيرًا.',
      },
      actors: [
        { id: 'lola', act: 'work', x: -0.8 },
        { id: 'mimi', act: 'wait', x: 0 },
        { id: 'ramy', act: 'arrive', x: 0.85 },
      ],
    },
    {
      id: 'b5',
      sky: 'night',
      label: { en: 'The harbour answers', ar: 'المرفأ يردّ' },
      narr: {
        en: 'The lantern threw a long gold line across the water, and far out past the breakwater a fishing boat swung its bow towards the light and came home.',
        ar: 'ألقى الفانوس خطًّا ذهبيًّا طويلًا على الماء، وبعيدًا خلف حاجز الأمواج أدار قارب صيد مقدّمته نحو الضوء وعاد إلى الديار.',
      },
      actors: [
        { id: 'lola', act: 'cheer', x: -0.7 },
        { id: 'mimi', act: 'cheer', x: 0 },
        { id: 'ramy', act: 'cheer', x: 0.7 },
      ],
      say: { who: 'ramy', t: { en: 'There! She saw it!', ar: 'هناك! لقد رآه!' } },
    },
  ],
  probes: [
    {
      id: 'p1',
      kind: 'who',
      q: { en: 'Who blocked the wind with cupped paws?', ar: 'من حجب الريح بكفّيه؟' },
      options: [
        { v: 'mimi', l: { en: 'Mimi', ar: 'ميمي' } },
        { v: 'ramy', l: { en: 'Ramy', ar: 'رامي' } },
        { v: 'lola', l: { en: 'Lola', ar: 'لولا' } },
      ],
      answer: 'mimi',
    },
    {
      id: 'p2',
      kind: 'what',
      q: { en: 'What did Ramy bring?', ar: 'ماذا أحضر رامي؟' },
      options: [
        { v: 'cloth', l: { en: 'A dry cloth', ar: 'قطعة قماش جافة' } },
        { v: 'oil', l: { en: 'A can of oil', ar: 'علبة زيت' } },
        { v: 'match', l: { en: 'A box of matches', ar: 'علبة ثقاب' } },
      ],
      answer: 'cloth',
    },
    {
      id: 'p3',
      kind: 'what',
      q: { en: 'Why would the wick not catch?', ar: 'لماذا لم يشتعل الفتيل؟' },
      options: [
        { v: 'damp', l: { en: 'It was damp from the spray', ar: 'كان رطبًا من الرذاذ' } },
        { v: 'short', l: { en: 'It had burned too short', ar: 'كان قد احترق حتى قصر' } },
        { v: 'missing', l: { en: 'It was missing entirely', ar: 'كان مفقودًا تمامًا' } },
      ],
      answer: 'damp',
    },
  ],
};
