/*
 * Learn topics — evidence-based reads about cognition and the brain.
 * Each topic is a title + an array of content blocks rendered by
 * LearnArticle.jsx. Inline `**bold**` markers are parsed at render time.
 * Optional `*Ar` fields on blocks/topics unlock Arabic when isAr is set.
 *
 * Voice: experiments first, lecture second. Setup prose teaches what to
 * notice; science + everyday meaning live in each experiment's result panel.
 */

export const LEARN_TOPICS = [
  {
    id: 'attention',
    icon: '🎯',
    title: 'Attention',
    titleAr: 'الانتباه',
    subtitle: 'Attention: Your Brain’s Spotlight',
    subtitleAr: 'الانتباه: كشّاف دماغك',
    blocks: [
      {
        type: 'p',
        text: 'Attention is not “trying harder.” It is a **limited spotlight**: choosing what matters, holding it, switching when needed, and filtering the rest. The fastest way to understand *your* attention is to test it — five short experiments, each with your own numbers and what they mean.',
        textAr: 'الانتباه ليس «المحاولة بقوة أكبر». إنه **كشّاف محدود**: اختيار ما يهم، الإبقاء عليه، التبديل عند الحاجة، وتصفية الباقي. أسرع طريقة لفهم انتباهك أنت هي أن تختبره — خمسة تجارب قصيرة، لكل منها أرقامك وما تعنيه.',
      },

      {
        type: 'p',
        text: 'Researchers often describe several overlapping systems: **selective** (pick one thing among distractors), **sustained** (stay on task over time), **alternating** (switch rules cleanly), and **divided** (share focus — usually by hopping, not cloning). You will feel each of these below.',
        textAr: 'غالباً ما يصف الباحثون أنظمة متداخلة: **الانتقائي** (اختر شيئاً وسط مشتّتات)، **المستمر** (ابقَ على المهمة مع الوقت)، **المتبادل** (بدّل القواعد بوضوح)، و**المقسّم** (شارك التركيز — عادة بالتنقّل لا بالاستنساخ). ستشعر بكل منها أدناه.',
      },

      {
        type: 'tldr',
        label: 'What you will learn',
        labelAr: 'ماذا ستتعلّم',
        items: [
          'Measure your **switching cost** — the tax of changing rules mid-task.',
          'Feel **interference** when distractors fight the thing you should ignore.',
          'Catch your brain **blinking** — a real blind spot after every target it notices.',
          'Watch **vigilance drift** as time-on-task wears your focus down.',
          'See accuracy drop when you try to **divide** attention across two things.',
        ],
        itemsAr: [
          'قِس **تكلفة التبديل** — ضريبة تغيير القواعد أثناء المهمة.',
          'اشعر بـ**التداخل** عندما تتصارع المشتّتات مع ما يجب تجاهله.',
          'التقط دماغك وهو **يومض** — فجوة عمياء حقيقية بعد كل هدف يلاحظه.',
          'راقب **انزلاق اليقظة** حين يُنهك الوقت تركيزك.',
          'شاهد الدقة تنخفض حين تحاول **تقسيم** الانتباه على شيئين.',
        ],
      },

      {
        type: 'callout',
        tone: 'myth',
        label: 'Myth:',
        labelAr: 'خرافة:',
        text: '“I multitask well — I can do two important things at once.”',
        textAr: '«أتقن تعدّد المهام — أستطيع فعل شيئين مهمّين معاً.»',
      },
      {
        type: 'callout',
        tone: 'fact',
        label: 'Fact:',
        labelAr: 'حقيقة:',
        text: 'For most demanding tasks, the brain **switches** or **shares** a limited spotlight. Switching and dividing both cost time and accuracy — you will measure that yourself.',
        textAr: 'في معظم المهام المتطلّبة، الدماغ **يبدّل** أو **يشارك** كشّافاً محدوداً. التبديل والتقسيم يكلّفان وقتاً ودقة — وستقيس ذلك بنفسك.',
      },

      {
        type: 'stat',
        value: '~200–500ms',
        valueAr: '~٢٠٠–٥٠٠ م.ث',
        label: 'Typical **attentional blink** window after you lock onto a target — a real gap where a second target can vanish.',
        labelAr: 'نافذة **الوميض الانتباهي** المعتادة بعد أن تقفل على هدف — فجوة حقيقية قد يختفي فيها هدف ثانٍ.',
      },

      {
        type: 'h2',
        text: '1. Switching cost',
        textAr: '١. تكلفة التبديل',
      },
      {
        type: 'p',
        text: '**What to do:** Answer as fast as you can. Round 1 uses one rule. Round 2 alternates two rules every trial.',
        textAr: '**ماذا تفعل:** أجب بأسرع ما يمكن. الجولة الأولى قاعدة واحدة. الجولة الثانية تتبادل قاعدتين في كل محاولة.',
      },
      {
        type: 'p',
        text: '**Watch for:** Extra milliseconds when the rule flips — that gap is your switching cost. **Why it matters:** Chat apps, tabs, and mid-conversation glances all bill the same tax.',
        textAr: '**راقب:** ميليثوانٍ إضافية حين تتبدّل القاعدة — هذا الفارق هو تكلفة تبديلك. **لماذا يهم:** تطبيقات الدردشة والتبويبات والنظرات أثناء الحديث تدفع نفس الضريبة.',
      },
      { type: 'experiment', kind: 'switch-cost' },

      {
        type: 'h2',
        text: '2. Selective attention (Flanker)',
        textAr: '٢. الانتباه الانتقائي (فلانكر)',
      },
      {
        type: 'p',
        text: '**What to do:** Respond only to the **center** arrow. Ignore the arrows on the sides.',
        textAr: '**ماذا تفعل:** استجب فقط للسهم في **الوسط**. تجاهل الأسهم على الجانبين.',
      },
      {
        type: 'p',
        text: '**Watch for:** Slower (or less accurate) answers when the sides disagree with the center. **Why it matters:** Your brain still “hears” distractors — filtering them costs effort (noisy rooms, notification badges, busy pages).',
        textAr: '**راقب:** إجابات أبطأ (أو أقل دقة) حين تختلف الجوانب عن الوسط. **لماذا يهم:** دماغك ما زال «يسمع» المشتّتات — تصفيتها تخسر جهداً (غرف صاخبة، شارات الإشعارات، صفحات مزدحمة).',
      },
      { type: 'experiment', kind: 'flanker' },

      {
        type: 'h2',
        text: '3. The attentional blink',
        textAr: '٣. الوميض الانتباهي',
      },
      {
        type: 'p',
        text: '**What to do:** A fast letter stream. Remember the **gold** letter. Also report whether you saw an **X** after it.',
        textAr: '**ماذا تفعل:** سلسلة حروف سريعة. تذكّر الحرف **الذهبي**. وأبلغ أيضاً هل رأيت حرف **X** بعده.',
      },
      {
        type: 'p',
        text: '**Watch for:** Missing X when it arrives soon after the gold letter, but catching it when it arrives later. **Why it matters:** Dense slides, warnings, and driving cues need a beat between targets.',
        textAr: '**راقب:** تفويت X حين يأتي بسرعة بعد الذهبي، والتقاطه حين يأتي لاحقاً. **لماذا يهم:** الشرائح الكثيفة والتحذيرات وإشارات القيادة تحتاج لحظة بين الأهداف.',
      },
      { type: 'experiment', kind: 'blink' },

      {
        type: 'h2',
        text: '4. Sustained attention (vigilance)',
        textAr: '٤. الانتباه المستمر (اليقظة)',
      },
      {
        type: 'p',
        text: '**What to do:** Watch a paced stream of shapes for about 45 seconds. Tap **only** when you see the rare target shape.',
        textAr: '**ماذا تفعل:** راقب سلسلة أشكال بإيقاع ثابت لنحو ٤٥ ثانية. اضغط **فقط** حين ترى الشكل الهدف النادر.',
      },
      {
        type: 'p',
        text: '**Watch for:** Misses and false taps as time goes on — boredom is a real cognitive state. **Why it matters:** Studying, monitoring, and long drives all ask for vigilance; breaks beat “just staring harder.”',
        textAr: '**راقب:** الإفلات والضغطات الخاطئة مع مرور الوقت — الملل حالة معرفية حقيقية. **لماذا يهم:** الدراسة والمراقبة والقيادة الطويلة كلها تطلب يقظة؛ الاستراحات أفضل من «التحديق بقوة أكبر».',
      },
      { type: 'experiment', kind: 'vigilance' },

      {
        type: 'h2',
        text: '5. Divided attention',
        textAr: '٥. الانتباه المقسّم',
      },
      {
        type: 'p',
        text: '**What to do:** Count only red dots, then count red **and** blue in a fresh stream.',
        textAr: '**ماذا تفعل:** عُدّ النقاط الحمراء فقط، ثم عُدّ الأحمر **والأزرق** في سلسلة جديدة.',
      },
      {
        type: 'p',
        text: '**Watch for:** Your counting error rising when a second colour is added. **Why it matters:** Attention is shared, not cloned — texting while driving is the same mechanism at higher stakes.',
        textAr: '**راقب:** ارتفاع خطأ العدّ حين يُضاف لون ثانٍ. **لماذا يهم:** الانتباه يُشارك لا يُستنسخ — الرسائل أثناء القيادة نفس الآلية بمخاطر أعلى.',
      },
      { type: 'experiment', kind: 'divided-attention' },

      {
        type: 'h2',
        text: 'What you now know about your attention',
        textAr: 'ما تعرفه الآن عن انتباهك',
      },
      {
        type: 'ul',
        items: [
          '**Switching has a price.** Batch similar work; finish one deep task before flipping.',
          '**Distractors still get in.** Hide badges, clear the sides of the page, give the center one job.',
          '**Respect the blink.** Leave a beat between critical cues (alerts, turn signals, dense lists).',
          '**Vigilance fades.** Plan short breaks; don’t trust “I’ll just keep staring.”',
          '**Division costs accuracy.** Do the important thing alone when the cost of error is high.',
          '**Practice next:** Training → Attention games drill search, tracking, and monitoring — they sharpen related skills; they are **not** a medical test or diagnosis.',
        ],
        itemsAr: [
          '**للتبديل ثمن.** جمّع الأعمال المتشابهة؛ أنهِ مهمة عميقة قبل الانتقال.',
          '**المشتّتات تدخل رغم ذلك.** اخفِ الشارات، نظّف جانبي الصفحة، أعطِ الوسط مهمة واحدة.',
          '**احترم الوميض.** اترك لحظة بين الإشارات الحرجة (تنبيهات، إشارات انعطاف، قوائم كثيفة).',
          '**اليقظة تتلاشى.** خطّط لاستراحات قصيرة؛ لا تثق بـ«سأواصل التحديق فقط».',
          '**التقسيم يكلّف الدقة.** افعل الأمر المهم وحده حين يكون ثمن الخطأ مرتفعاً.',
          '**الخطوة التالية:** تدريب ← ألعاب الانتباه تمرّن البحث والتتبّع والمراقبة — تصقل مهارات ذات صلة؛ وهي **ليست** اختباراً أو تشخيصاً طبياً.',
        ],
      },
    ],
  },
];
