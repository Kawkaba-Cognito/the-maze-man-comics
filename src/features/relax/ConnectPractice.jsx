import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, INK, SUB, FAINT, LINE, CARD, SERIF } from './PracticeShell';
import { QUIZ_CSS, KawkabSay, DeeperScience } from './quizShared';
import { markWellbeingPracticeDone } from './habitState';
import { loadJson, saveJson } from '../../lib/storage';

/*
 * Good News — the Relationships pillar's first actual PRACTICE.
 *
 * ── WHY (2026-09-07) ───────────────────────────────────────────────────────
 *
 * Until now the entire Relationships area was one quiz about yourself. A pillar
 * called Relationships that contains no relating is a category, not a feature —
 * you could complete everything in it without doing a single thing involving
 * another person.
 *
 * ── WHY THIS SKILL, OUT OF EVERYTHING IN THE LITERATURE ────────────────────
 *
 * Capitalization (Gable, Reis, Impett & Asher, 2004): how a partner responds to
 * your GOOD news predicts relationship quality at least as well as — in several
 * studies better than — how they respond to your bad news. That is genuinely
 * counter-intuitive, which is what makes it worth teaching: everybody already
 * believes support matters when things go wrong, and almost nobody is watching
 * the far more frequent moments when something goes right.
 *
 * It is also the rare relationship finding that reduces to a SKILL a person can
 * rehearse alone, in ninety seconds, without their partner present — which is
 * the constraint this app is under. Loving-kindness (the other obvious
 * candidate, and still promised in `programSoon`) is a meditation; this is a
 * behaviour, and behaviours can be practised against scenarios.
 *
 * ⚠ THE PRACTICE ENDS ON A REAL ACTION, NOT ON A SCORE. Four scenarios teach the
 * distinction; the last screen asks the user to write one real thing to one real
 * person. A relationships practice whose entire output is a label about yourself
 * would repeat the exact problem this was built to fix.
 */

const ACCENT = 'var(--rx-relationships-core)';
const ACCENT_LIT = 'var(--rx-relationships-lit)';
const KEY = 'rx_connect_v1';

/*
 * The four response styles, on the two axes the research uses: active/passive
 * (how much energy the response carries) × constructive/destructive (whether it
 * builds the moment or takes it apart).
 *
 * ⚠ ACTIVE-DESTRUCTIVE IS THE ONE PEOPLE DO NOT RECOGNISE IN THEMSELVES, which
 * is why every scenario includes one and why its feedback is written without
 * blame. It usually arrives as care — pointing out a risk, checking they have
 * thought it through — and it still reliably deflates the person sharing.
 */
const STYLES = {
  ac: {
    id: 'ac', good: true,
    en: 'Active-Constructive', ar: 'فعّال وبنّاء',
    tagEn: 'You go towards it — enthusiasm, questions, reliving the moment with them.',
    tagAr: 'تتّجه نحوها — حماس وأسئلة وإعادة عيش اللحظة معهم.',
  },
  pc: {
    id: 'pc', good: false,
    en: 'Passive-Constructive', ar: 'سلبي وبنّاء',
    tagEn: 'Warm but understated — pleased for them, then the moment quietly closes.',
    tagAr: 'دافئ لكن باهت — تفرح لهم، ثم تنطوي اللحظة بهدوء.',
  },
  ad: {
    id: 'ad', good: false,
    en: 'Active-Destructive', ar: 'فعّال وهدّام',
    tagEn: 'You engage — but with the downside. It almost always arrives as care.',
    tagAr: 'تتفاعل — لكن مع الجانب السلبي. وغالباً ما يأتي هذا في صورة اهتمام.',
  },
  pd: {
    id: 'pd', good: false,
    en: 'Passive-Destructive', ar: 'سلبي وهدّام',
    tagEn: 'The moment goes past — a nod, a change of subject, back to your phone.',
    tagAr: 'تمرّ اللحظة — إيماءة أو تغيير للموضوع أو عودة إلى هاتفك.',
  },
};

const SCENARIOS = [
  {
    id: 'promo',
    setupEn: 'Someone close to you comes in and says: "They gave me the project. I actually got it."',
    setupAr: 'يأتي شخص قريب منك ويقول: "أعطوني المشروع. حصلتُ عليه فعلاً."',
    options: [
      { s: 'ad', en: '"Nice — that\'s going to be a lot of extra hours though, right?"', ar: '"جميل — لكن هذا يعني ساعات إضافية كثيرة، صحيح؟"' },
      { s: 'ac', en: '"Wait, tell me everything — how did they tell you? What did you say?"', ar: '"مهلاً، احكِ لي كل شيء — كيف أخبروك؟ وماذا قلتَ أنت؟"' },
      { s: 'pc', en: '"That\'s great, well done."', ar: '"هذا رائع، أحسنت."' },
      { s: 'pd', en: '"Mm. Did you see what happened with the car today?"', ar: '"مم. هل رأيت ما حدث للسيارة اليوم؟"' },
    ],
  },
  {
    id: 'run',
    setupEn: 'A friend messages: "I ran 10k this morning. First time ever without stopping."',
    setupAr: 'يراسلك صديق: "ركضتُ ١٠ كم هذا الصباح. أول مرة دون توقّف."',
    options: [
      { s: 'pc', en: '"👏 Well done!"', ar: '"👏 أحسنت!"' },
      { s: 'pd', en: 'Read it, react with a thumbs up, carry on with your day.', ar: 'تقرأها وتضع إعجاباً وتكمل يومك.' },
      { s: 'ac', en: '"No stopping at all? Where did you go — and how did the last kilometre feel?"', ar: '"دون توقّف إطلاقاً؟ أين ركضت — وكيف كان شعور الكيلومتر الأخير؟"' },
      { s: 'ad', en: '"Careful with your knees at that distance."', ar: '"انتبه لركبتيك على هذه المسافة."' },
    ],
  },
  {
    id: 'art',
    setupEn: 'Your teenager shows you a drawing and says: "My teacher put it up on the wall."',
    setupAr: 'يريك ابنك المراهق رسمة ويقول: "علّقها معلّمي على الحائط."',
    options: [
      { s: 'ac', en: '"On the wall! Show me which part you\'re proudest of — how long did this take you?"', ar: '"على الحائط! أرني الجزء الذي تفتخر به أكثر — كم استغرقت في هذا؟"' },
      { s: 'ad', en: '"See what happens when you put the phone down and focus?"', ar: '"أرأيت ماذا يحدث حين تترك الهاتف وتركّز؟"' },
      { s: 'pd', en: '"Lovely. Have you done your homework?"', ar: '"جميلة. هل أنهيت واجبك؟"' },
      { s: 'pc', en: '"That\'s nice, well done."', ar: '"هذه لطيفة، أحسنت."' },
    ],
  },
  {
    id: 'news',
    setupEn: 'Your partner says: "I finally booked the trip. We\'re going in March."',
    setupAr: 'يقول شريكك: "حجزتُ الرحلة أخيراً. سنسافر في آذار."',
    options: [
      { s: 'pd', en: '"Okay." (keeps scrolling)', ar: '"حسناً." (ويستمر في التصفّح)' },
      { s: 'ad', en: '"March? That\'s the worst month for prices — did you check?"', ar: '"آذار؟ هذا أسوأ شهر من حيث الأسعار — هل تحقّقت؟"' },
      { s: 'pc', en: '"Good, glad that\'s sorted."', ar: '"جيد، سعيد أن الأمر انتهى."' },
      { s: 'ac', en: '"You booked it! Okay — what are you most looking forward to doing there?"', ar: '"حجزتَها! حسناً — ما أكثر ما تتطلّع لفعله هناك؟"' },
    ],
  },
];

const FEEDBACK = {
  ac: {
    en: 'That is the one. Active-constructive responding — going towards the news and asking them to relive it — is the response that predicts stronger relationships, and it is the rarest of the four.',
    ar: 'هذه هي. الاستجابة الفعّالة البنّاءة — أن تتّجه نحو الخبر وتطلب منهم إعادة عيشه — هي الاستجابة التي تتنبّأ بعلاقات أقوى، وهي الأندر بين الأربع.',
  },
  pc: {
    en: 'Warm, and genuinely meant — but the moment closes straight after it. Nothing is damaged here; the opportunity is simply not taken, which is why this one is so easy to keep doing for years.',
    ar: 'دافئة وصادقة فعلاً — لكن اللحظة تنطوي مباشرة بعدها. لا شيء يتضرّر هنا؛ الفرصة فقط لا تُستغلّ، ولهذا يسهل الاستمرار عليها سنوات.',
  },
  ad: {
    en: 'This is the one almost nobody recognises in themselves. It arrives as care — a risk worth flagging, a question worth asking — and the person sharing still walks away smaller than they arrived. The concern can wait an hour. It will still be true then.',
    ar: 'هذه هي التي لا يكاد أحد يتعرّف عليها في نفسه. تأتي في صورة اهتمام — خطر يستحق التنبيه، سؤال يستحق الطرح — ومع ذلك ينصرف من شاركك وهو أصغر ممّا جاء. يمكن للقلق أن ينتظر ساعة. سيبقى صحيحاً حينها.',
  },
  pd: {
    en: 'The moment goes past. Often it is not indifference at all — it is tiredness, or a phone. But what it teaches, over time, is that good news is not worth bringing here.',
    ar: 'تمرّ اللحظة. وغالباً لا يكون ذلك لامبالاة إطلاقاً — بل تعباً أو هاتفاً. لكن ما يعلّمه ذلك مع الوقت هو أن الأخبار الجيدة لا تستحق أن تُحضَر إلى هنا.',
  },
};

const T = {
  en: {
    title: 'Good News',
    meta: '4 moments · about 2 minutes',
    kawkab: "Hi, I'm Kawkab! Here is something most people have backwards: how you respond when someone's news is GOOD predicts the health of a relationship at least as well as how you respond when it's bad. Four moments — pick what you'd actually say.",
    /* ⚠ EVIDENCE TIER STATED HONESTLY. Capitalization rests on a well-replicated
       research programme (Gable and colleagues, 2004 onward), not on a large
       meta-analysis like the ones behind CBT-I or implementation intentions.
       Saying so is the scientific position: overstating this one would make the
       genuinely strong claims elsewhere in the app less believable. */
    cite: 'Based on capitalization research — Gable, Reis, Impett & Asher (2004), and the studies that followed it. This is a well-replicated line of research rather than a large meta-analysis, so treat it as a promising skill worth trying, not a settled result.',
    start: 'Start',
    yourPick: 'What would you actually say?',
    next: 'Next moment',
    toAction: 'Last part',
    summaryTitle: 'Across those four',
    mostly: (label) => `You leaned ${label}.`,
    mixed: 'You were mixed across the four — which is how most people actually are.',
    allGood: 'You picked the active-constructive response every time. That is rarer than it sounds.',
    deeper: 'Why good news and not bad news?',
    deeperBody: "Support when things go wrong is expected, and its absence is what gets noticed. Responses to good news are different: they are far more frequent, nobody is monitoring them, and the person sharing is unguarded. Gable and colleagues found that active-constructive responding predicted relationship wellbeing and stability, over and above how couples handled conflict — the moments nobody thinks of as relationship work turn out to be where a lot of it happens.",
    actionTitle: 'Now the real part',
    actionHint: 'Think of one person and one specific thing they did recently that you noticed and never said out loud. Write it here as you would actually say it to them — then, if you want, go and say it.',
    actionPh: 'What you noticed, and what it meant…',
    save: 'Save it',
    saved: 'Saved. Now the harder half — go and say it.',
    prevTitle: 'Things you noticed before',
    done: 'Finish',
    back: 'Back',
    skip: 'Skip this',
  },
  ar: {
    title: 'الأخبار الجيدة',
    meta: '٤ لحظات · حوالي دقيقتين',
    kawkab: 'مرحباً، أنا كوكب! إليك ما يفهمه معظم الناس بالمقلوب: طريقة استجابتك حين يكون خبر أحدهم جيداً تتنبّأ بصحة العلاقة بقدر استجابتك حين يكون سيّئاً على الأقل. أربع لحظات — اختر ما كنت ستقوله فعلاً.',
    cite: 'مبني على أبحاث "الاحتفاء بالخبر الجيد" — Gable, Reis, Impett & Asher (2004) والدراسات التي تلتها. وهذا خط بحثي متكرّر النتائج لا تحليل بَعدي كبير، فاعتبره مهارة واعدة تستحق التجربة لا نتيجة نهائية محسومة.',
    start: 'ابدأ',
    yourPick: 'ماذا كنت ستقول فعلاً؟',
    next: 'اللحظة التالية',
    toAction: 'الجزء الأخير',
    summaryTitle: 'عبر اللحظات الأربع',
    mostly: (label) => `ملتَ إلى "${label}".`,
    mixed: 'كنت متنوّعاً عبر الأربع — وهكذا هو معظم الناس فعلاً.',
    allGood: 'اخترت الاستجابة الفعّالة البنّاءة في كل مرة. وهذا أندر ممّا يبدو.',
    deeper: 'لماذا الأخبار الجيدة لا السيّئة؟',
    deeperBody: 'الدعم حين تسوء الأمور متوقَّع، وغيابه هو ما يُلاحَظ. أمّا الاستجابة للأخبار الجيدة فمختلفة: إنها أكثر تكراراً بكثير، ولا أحد يراقبها، ومن يشاركك يكون بلا دفاعات. وجد Gable وزملاؤه أن الاستجابة الفعّالة البنّاءة تتنبّأ بعافية العلاقة واستقرارها، بما يتجاوز طريقة تعامل الشريكين مع الخلاف — أي أن اللحظات التي لا يعدّها أحد "عملاً على العلاقة" هي حيث يجري كثير من هذا العمل.',
    actionTitle: 'الآن الجزء الحقيقي',
    actionHint: 'فكّر في شخص واحد وفي أمر محدّد فعله مؤخراً لاحظته ولم تقله بصوت مسموع قط. اكتبه هنا كما كنت ستقوله له فعلاً — ثم، إن أردت، اذهب وقله.',
    actionPh: 'ما لاحظته، وماذا عنى لك…',
    save: 'احفظه',
    saved: 'حُفظ. والآن النصف الأصعب — اذهب وقله.',
    prevTitle: 'أمور لاحظتها سابقاً',
    done: 'إنهاء',
    back: 'رجوع',
    skip: 'تخطّي',
  },
};

const load = () => {
  const v = loadJson(KEY, null);
  return v && Array.isArray(v.notes) ? v : { notes: [], runs: 0 };
};

export default function ConnectPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? T.ar : T.en;

  const [store, setStore] = useState(() => load());
  const [phase, setPhase] = useState('intro'); // intro | scenario | summary | action | done
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [picks, setPicks] = useState([]);
  const [draft, setDraft] = useState('');

  const sc = SCENARIOS[idx];

  const choose = (styleId) => {
    playSfx?.('click');
    setPicked(styleId);
    setPicks((p) => [...p, styleId]);
  };

  const advance = () => {
    playSfx?.('click');
    setPicked(null);
    if (idx + 1 >= SCENARIOS.length) setPhase('summary');
    else setIdx(idx + 1);
  };

  const summary = useMemo(() => {
    if (picks.length < SCENARIOS.length) return null;
    if (picks.every((p) => p === 'ac')) return { kind: 'allGood' };
    const counts = picks.reduce((m, p) => ({ ...m, [p]: (m[p] || 0) + 1 }), {});
    const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return n >= 3 ? { kind: 'mostly', style: top } : { kind: 'mixed' };
  }, [picks]);

  const saveNote = () => {
    const v = draft.trim();
    if (!v) return;
    playSfx?.('collect');
    const notes = [...store.notes, { at: Date.now(), text: v }].slice(-20);
    const next = { notes, runs: (store.runs || 0) + 1 };
    saveJson(KEY, next);
    setStore(next);
    setDraft('');
    markWellbeingPracticeDone('connect');
    setPhase('done');
  };

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{QUIZ_CSS}</style>
      <style>{CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <PracticeHero emoji="💬" />
          <KawkabSay>{t.kawkab}</KawkabSay>
          <div className="qz-intro-meta">{t.meta}</div>
          <p className="qz-cite">{t.cite}</p>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('scenario'); }}>{t.start}</button>
        </div>
      )}

      {phase === 'scenario' && sc && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="qz-progress" dir="ltr">{idx + 1} / {SCENARIOS.length}</div>
          <div className="cn-setup">{isAr ? sc.setupAr : sc.setupEn}</div>
          {!picked ? (
            <>
              <div className="rxp-label" style={{ textAlign: 'center' }}>{t.yourPick}</div>
              <div className="qz-choice-list">
                {sc.options.map((o) => (
                  <button key={o.s} type="button" className="qz-choice" onClick={() => choose(o.s)}>
                    {isAr ? o.ar : o.en}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={`cn-verdict${STYLES[picked].good ? ' good' : ''}`}>
                <div className="cn-verdict-name">{isAr ? STYLES[picked].ar : STYLES[picked].en}</div>
                <div className="cn-verdict-tag">{isAr ? STYLES[picked].tagAr : STYLES[picked].tagEn}</div>
              </div>
              <p className="cn-feedback">{isAr ? FEEDBACK[picked].ar : FEEDBACK[picked].en}</p>
              <button className="rxp-primary" onClick={advance}>
                {idx + 1 >= SCENARIOS.length ? t.toAction : t.next}
              </button>
            </>
          )}
        </div>
      )}

      {phase === 'summary' && summary && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="rxp-label">{t.summaryTitle}</div>
          <p className="cn-summary">
            {summary.kind === 'allGood' ? t.allGood
              : summary.kind === 'mostly' ? t.mostly(isAr ? STYLES[summary.style].ar : STYLES[summary.style].en)
                : t.mixed}
          </p>
          <div className="cn-grid">
            {Object.values(STYLES).map((s) => (
              <div key={s.id} className={`cn-cell${s.good ? ' good' : ''}`}>
                <span className="cn-cell-name">{isAr ? s.ar : s.en}</span>
                <span className="cn-cell-tag">{isAr ? s.tagAr : s.tagEn}</span>
              </div>
            ))}
          </div>
          <div className="cn-deeper">
            <DeeperScience moreLabel={t.deeper} lessLabel={isAr ? 'عرض أقل' : 'Show less'}>
              {t.deeperBody}
            </DeeperScience>
          </div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('action'); }}>{t.toAction}</button>
        </div>
      )}

      {phase === 'action' && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="cn-action-title serif">{t.actionTitle}</div>
          <p className="cn-action-hint">{t.actionHint}</p>
          <textarea
            className="cn-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.actionPh}
            rows={5}
            maxLength={600}
          />
          <button className="rxp-primary" disabled={!draft.trim()} onClick={saveNote}>{t.save}</button>
          <button type="button" className="cn-skip" onClick={() => { playSfx?.('click'); setPhase('done'); }}>{t.skip}</button>
        </div>
      )}

      {phase === 'done' && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <PracticeHero emoji="💞" />
          <div className="cn-action-title serif">{t.saved}</div>
          {store.notes.length > 0 && (
            <div className="cn-notes">
              <div className="rxp-label">{t.prevTitle}</div>
              {store.notes.slice(-4).reverse().map((n) => (
                <p key={n.at} className="cn-note">{n.text}</p>
              ))}
            </div>
          )}
          <button className="rxp-ghost" onClick={onBack}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.cn-setup { font-family:${SERIF}; font-size:20px; font-weight:600; color:${INK}; line-height:1.45; text-align:center; padding:14px 16px;
  border-radius:14px; background:${CARD}; border:1px solid ${LINE}; box-shadow:var(--elev-rest); }
.cn-verdict { padding:12px 15px; border-radius:13px; border:1px solid ${LINE}; background:${CARD}; }
.cn-verdict.good { border-color:color-mix(in srgb, var(--rx-hue) 55%, transparent); background:color-mix(in srgb, var(--rx-hue) 12%, transparent); }
.cn-verdict-name { font-size:14.5px; font-weight:800; color:${INK}; margin-bottom:3px; }
.cn-verdict.good .cn-verdict-name { color:var(--rx-hue-lit); }
.cn-verdict-tag { font-size:12.5px; color:${SUB}; line-height:1.55; }
.cn-feedback { margin:0; font-size:13.5px; color:${SUB}; line-height:1.7; }
.cn-summary { margin:0; font-size:16px; font-weight:700; color:${INK}; text-align:center; line-height:1.5; max-width:340px; }
.cn-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; width:100%; }
.cn-cell { padding:10px 12px; border-radius:12px; border:1px solid ${LINE}; background:${CARD}; text-align:start; }
.cn-cell.good { border-color:color-mix(in srgb, var(--rx-hue) 55%, transparent); }
.cn-cell-name { display:block; font-size:11.5px; font-weight:800; color:${INK}; margin-bottom:3px; }
.cn-cell.good .cn-cell-name { color:var(--rx-hue-lit); }
.cn-cell-tag { font-size:11px; color:${SUB}; line-height:1.45; }
.cn-deeper { width:100%; max-width:360px; }
.cn-action-title { font-family:${SERIF}; font-size:25px; font-weight:600; color:${INK}; text-align:center; }
.cn-action-hint { margin:0; font-size:13.5px; color:${SUB}; line-height:1.65; }
.cn-input { width:100%; padding:14px 16px; border-radius:14px; border:1px solid ${LINE}; background:${CARD};
  font-family:inherit; font-size:15px; line-height:1.55; color:${INK}; resize:vertical; min-height:110px; }
.cn-input:focus { outline:none; border-color:var(--rx-hue); }
.cn-skip { background:none; border:none; color:${FAINT}; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; text-decoration:underline; }
.cn-notes { width:100%; max-width:360px; display:flex; flex-direction:column; gap:7px; }
.cn-note { margin:0; font-size:13px; color:${SUB}; line-height:1.6; padding:10px 13px; border-radius:12px;
  background:${CARD}; border:1px solid ${LINE}; text-align:start; }
`;
