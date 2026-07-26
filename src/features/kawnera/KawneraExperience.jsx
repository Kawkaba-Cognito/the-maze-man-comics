import React, { useEffect, useMemo, useState } from 'react';
import chapterContent from './chapter-content.json';
import { assetUrl } from '../../lib/assetUrl';
import './kawnera.css';
import Kawkab3D from './Kawkab3D';
import KawkabLab from './KawkabLab';
const B = [
  {
    id: 'enigma',
    code: 'ER',
    title: 'The Enigma of Reason',
    author: 'Hugo Mercier & Dan Sperber',
    pages: '405',
    color: '#ffcf55',
    image: assetUrl('Assets/kawnera/covers/enigma-of-reason.webp'),
    desc: 'Why did reason evolve, why is it biased, and why does it often work better between people than inside one isolated mind?',
    chapters: [
      'Reason on Trial',
      'Psychologists’ Travails',
      'From Unconscious Inferences to Intuitions',
      'Modularity',
      'Cognitive Opportunism',
      'Metarepresentations',
      'How We Use Reasons',
      'Could Reason Be a Module?',
      'Reasoning: Intuition and Reflection',
      'Reason: What Is It For?',
      'Why Is Reasoning Biased?',
      'Quality Control: How We Evaluate Arguments',
      'The Dark Side of Reason',
      'A Reason for Everything',
      'The Bright Side of Reason',
      'Is Human Reason Universal?',
      'Reasoning about Moral and Political Topics',
      'Solitary Geniuses?',
    ],
  },
  {
    id: 'social',
    code: 'SC',
    title: 'Social Cognition',
    author: 'Susan T. Fiske & Shelley E. Taylor',
    pages: '1,020',
    color: '#6fd3c7',
    image: assetUrl('Assets/kawnera/covers/social-cognition.webp'),
    desc: 'A broad map of how people perceive themselves and others, from attention and memory to attitudes, stereotypes, affect, and culture.',
    chapters: [
      'Introduction',
      'Dual Modes in Social Cognition',
      'Attention and Encoding',
      'Representation in Memory',
      'Self in Social Cognition',
      'Attribution Processes',
      'Heuristics and Shortcuts',
      'Accuracy and Efficiency in Social Inference',
      'Cognitive Structures of Attitudes',
      'Cognitive Processing of Attitudes',
      'Stereotyping: Cognition and Bias',
      'Prejudice: Cognitive and Affective Biases',
      'From Social Cognition to Affect',
      'From Affect to Social Cognition',
      'Behavior and Cognition',
    ],
  },
  {
    id: 'mindreading',
    code: 'MR',
    title: 'Mindreading and Social Cognition',
    author: 'Jane Suilin Lavelle',
    pages: '88',
    color: '#9994ef',
    image: assetUrl('Assets/kawnera/covers/mindreading.webp'),
    desc: 'A concise philosophical challenge to the idea that one universal mindreading mechanism underlies most social interaction.',
    chapters: [
      'Introduction',
      'A Brief History of Mindreading',
      'The New Pluralism',
      'Mindreading in Infancy',
      'Mindreading across Cultures',
      'Power Differentials and Mindreading',
      'Conclusions',
    ],
  },
  {
    id: 'thinking',
    code: 'TH',
    title: 'Oxford Handbook of Thinking and Reasoning',
    author: 'Keith J. Holyoak & Robert G. Morrison',
    pages: '865',
    color: '#f08f82',
    image: assetUrl('Assets/kawnera/covers/thinking-reasoning.webp'),
    desc: 'A research handbook spanning inference, decisions, problem solving, creativity, development, culture, and thinking in practice.',
    chapters: [
      'Thinking and Reasoning: A Reader’s Guide',
      'Normative Systems: Logic, Probability, and Rational Choice',
      'Bayesian Inference',
      'Knowledge Representation',
      'Computational Models of Higher Cognition',
      'Neurocognitive Methods in Higher Cognition',
      'Mental Function as Genetic Expression',
      'Dual-Process Theories of Deductive Reasoning',
      'Inference in Mental Models',
      'Similarity',
      'Concepts and Categories',
      'Causal Learning',
      'Analogy and Relational Reasoning',
      'Explanation and Abductive Inference',
      'Rational Argument',
      'Decision Making',
      'Judgmental Heuristics',
      'Cognitive Hierarchies and Emotions in Behavioral Game Theory',
      'Moral Judgment',
      'Motivated Thinking',
      'Problem Solving',
      'Rationality and Intelligence',
      'Cognition and the Creation of Ideas',
      'Insight',
      'Genius',
      'Development of Thinking in Children',
      'The Human Enigma',
      'Language and Thought',
      'Thinking in Societies and Cultures',
      'Development of Quantitative Thinking',
      'Visuospatial Thinking',
      'Gesture in Thought',
      'Impact of Aging on Thinking',
      'Thought Disorder in Schizophrenia',
      'Scientific Thinking and Reasoning',
      'Legal Reasoning',
      'Medical Reasoning and Thinking',
      'Thinking in Business',
      'Musical Thought',
      'Learning to Think: Knowledge Transfer',
    ],
  },
  {
    id: 'emotion',
    code: 'CE',
    title: 'Cognition and Emotion',
    author: 'Mick Power & Tim Dalgleish',
    pages: '473',
    color: '#a8d663',
    image: assetUrl('Assets/kawnera/covers/cognition-emotion.webp'),
    desc: 'An integrated account of normal emotion and emotional disorder, organized around appraisal, representation, and the SPAARS model.',
    chapters: [
      'Introduction',
      'The Cognitive Philosophy of Emotion',
      'Cognitive Theories of Emotion',
      'Cognitive Theories of Emotional Disorder',
      'The SPAARS Approach',
      'Fear',
      'Sadness',
      'Anger',
      'Disgust',
      'Happiness',
      'Overview and Conclusions',
    ],
  },
  {
    id: 'remediation',
    code: 'CR',
    title: 'Cognitive Remediation for Psychological Disorders',
    author: 'Medalia, Herlands, Saperstein & Revheim',
    pages: '241',
    color: '#e6a15c',
    image: assetUrl('Assets/kawnera/covers/cognitive-remediation.webp'),
    desc: 'A therapist-facing, practical guide to designing and delivering cognitive remediation programs that connect training to daily goals.',
    chapters: [
      'Introductory Information for Therapists',
      'Treatment Principles',
      'Setting Up a Cognitive Remediation Program',
      'Choosing Computerized Cognitive Exercises',
      'Intake and Assessment',
      'Treatment Planning',
      'Treating Specific Cognitive Deficits',
      'Phases of Treatment',
      'Bridging Groups',
      'Difficult Clinical Situations',
      'Program Evaluation',
    ],
  },
  {
    id: 'outcomes',
    code: 'FO',
    title: 'Cognitive Remediation to Improve Functional Outcomes',
    author: 'Alice Medalia & Christopher R. Bowie',
    pages: '233',
    color: '#e7c855',
    image: assetUrl('Assets/kawnera/covers/functional-outcomes.webp'),
    desc: 'How cognitive remediation can transfer beyond training tasks into functional improvement, engagement, metacognition, and social cognition.',
    chapters: [
      'Cognitive Remediation: An Overview',
      'Assessment and Functional Goals',
      'Treatment Planning',
      'Bridging Groups',
      'A Metacognitive Approach',
      'Implementation and Dissemination',
      'Cognitive Distortions and Engagement',
      'Choosing Computerized Exercises',
      'Compensatory Approaches',
      'Integrating Social Cognitive Training',
    ],
  },
  {
    id: 'problems',
    code: 'PS',
    title: 'Problem Solving',
    author: 'S. Ian Robertson',
    pages: '287',
    color: '#71b9d0',
    image: assetUrl('Assets/kawnera/covers/problem-solving.webp'),
    desc: 'A clear progression from problem representation and transfer to expertise, insight, creativity, and the neuroscience of solving.',
    chapters: [
      'What Is Involved in Problem Solving?',
      'Problem Representation',
      'Transfer',
      'Worked Examples and Instructional Design',
      'Developing Skill',
      'Developing Expertise',
      'Insight',
      'Creative Problem Solving',
      'The Neuroscience of Problem Solving',
      'Conclusion',
    ],
  },
  {
    id: 'assessment',
    code: 'IA',
    title: 'Contemporary Intellectual Assessment',
    author: 'Dawn P. Flanagan & Erin M. McDonough',
    pages: '1,154',
    color: '#d49ac6',
    image: assetUrl('Assets/kawnera/covers/intellectual-assessment.webp'),
    desc: 'A comprehensive guide to theories, instruments, interpretation, fairness, intervention, and emerging issues in intellectual assessment.',
    chapters: [
      'History of Intelligence Assessment',
      'History of Intelligence Test Interpretation',
      'Cattell-Horn-Carroll Theory',
      'Multiple-Intelligences Theory',
      'Triarchic Theory of Successful Intelligence',
      'PASS Theory of Neurocognitive Processes',
      'Parieto-Frontal Integration Theory',
      'Intelligence as Process, Personality, Interests, and Knowledge',
      'Wechsler Preschool, Child, and Achievement Scales',
      'Woodcock-Johnson IV Early Cognitive and Academic Development',
      'WISC-V Integrated',
      'Kaufman Assessment Battery for Children',
      'Differential Ability Scales',
      'Woodcock-Johnson IV Batteries',
      'Cognitive Assessment System',
      'WAIS-IV and WMS-IV',
      'Wechsler Nonverbal Scale',
      'Reynolds Intellectual Assessment Scales',
      'NEPSY-II',
      'Universal Nonverbal Intelligence Test',
      'Identifying Giftedness',
      'Identifying Specific Learning Disabilities',
      'Intellectual Disability Assessment',
      'Sensory, Physical Disability, and Brain Injury',
      'Culturally and Linguistically Diverse Populations',
      'Cognitive Hypothesis Testing',
      'Cross-Battery Assessment',
      'Abilities and Academic Interventions',
      'KTEA-3 and WISC-V Integration',
      'Joint Test Standards and Validity',
      'Confirmatory Factor Analysis',
      'Functional CHC Nomenclature',
      'Neuropsychological Constructs in Intelligence Tests',
      'Reading Disorders and Neuropsychological Tests',
      'Orthographic Mapping and SLD Diagnosis',
      'Assessment of Executive Functions',
      'DSM-5 Specific Learning Disorder',
      'Neuropsychological Services in Schools',
      'Assessment in Three-Tiered School Systems',
    ],
  },
];
const DEEP = chapterContent;
const clean = (s) =>
  s
    .replace(/\b([A-Z])\s+([a-z]{2,})\b/g, '$1$2')
    .replace(/([A-Za-z])-\s+([A-Za-z])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
export default function KawneraExperience({ isAr = false, isActive = false, onNavigateTop }) {
  const [book, setBook] = useState(null),
    [ci, setCi] = useState(null),
    [done, setDone] = useState([]),
    [tab, setTab] = useState('library'),
    [query, setQuery] = useState(''),
    [kawkabOpen, setKawkabOpen] = useState(false),
    [labOpen, setLabOpen] = useState(false);
  const t = isAr
    ? {
        library: 'المكتبة',
        connected: 'أفكار مترابطة',
        chaptersComplete: 'فصلًا مكتملًا',
        heroEye: 'كاونيرا · مكتبتك المعرفية · ٩ كتب',
        choose: 'اختر كتابًا.',
        build: 'وابنِ النموذج.',
        heroCopy:
          'لكل كتاب مسار تعلّم كامل. افتح الغلاف، وانتقل فصلًا بعد فصل، ودع الاسترجاع النشط يثبّت المعرفة.',
        search: 'ابحث في مكتبتك',
        collection: 'المجموعة',
        titles: 'عناوين',
        chapters: 'فصول',
        pages: 'صفحة',
        complete: 'مكتمل',
        enter: 'ادخل',
        allBooks: 'كل الكتب',
        course: 'فصلًا في المسار',
        progress: 'تقدّم المسار',
        map: 'خريطة الفصول الكاملة',
        select: 'اختر فصلًا للبدء',
        chapter: 'الفصل',
        contents: 'المحتويات',
        previous: 'السابق',
        next: 'التالي',
        grounded: 'درس مبني على الكتاب',
        groundedCopy: 'بُني هذا الدرس من المادة الفعلية في ملف الكتاب.',
        mission: 'مهمة د. كوكب التفاعلية',
        missionTitle: 'حوّل هذا الفصل إلى معرفة يمكنك استخدامها.',
        missionCopy:
          'اختبر نفسك، واسترجع المفاهيم ببطاقات الذاكرة، أو اشرح الحجة في مهمة مدتها ٦٠ ثانية.',
        openLab: 'افتح مختبر التعلّم',
        scope: 'نطاق الفصل',
        scopeTitle: 'ما الذي يحاول هذا الفصل تفسيره؟',
        claims: 'الأفكار المركزية',
        claimsTitle: 'الأفكار التي تحتاج إلى تذكّرها',
        evidence: 'الأدلة والأمثلة',
        evidenceTitle: 'كيف يدعم الفصل حجته؟',
        recall: 'استرجاع نشط · أغلق الملاحظات أولًا',
        recallTitle: 'هل تستطيع إعادة بناء الفصل؟',
        markComplete: 'ضع علامة مكتمل',
        chapterComplete: 'الفصل مكتمل',
        footer: 'استكشف الكون في داخلك.',
        mapped: 'فصلًا منظّمًا',
      }
    : {
        library: 'Library',
        connected: 'Connected Ideas',
        chaptersComplete: 'chapters complete',
        heroEye: 'KAWNERA · YOUR COGNITIVE LIBRARY · 9 BOOKS',
        choose: 'Choose a book.',
        build: 'Build the model.',
        heroCopy:
          'Every book has its own complete learning path. Open a cover, move chapter by chapter, and let active recall do the remembering.',
        search: 'Search your library',
        collection: 'The collection',
        titles: 'titles',
        chapters: 'chapters',
        pages: 'pages',
        complete: 'complete',
        enter: 'Enter',
        allBooks: 'All books',
        course: 'chapter course',
        progress: 'Course progress',
        map: 'Complete chapter map',
        select: 'Select a chapter to begin',
        chapter: 'Chapter',
        contents: 'contents',
        previous: 'Previous',
        next: 'Next',
        grounded: 'Book-grounded lesson',
        groundedCopy: 'Built from the actual material in the source PDF.',
        mission: 'Dr. Kawkab interactive mission',
        missionTitle: 'Turn this chapter into something you can use.',
        missionCopy:
          'Play a scored quiz, retrieve key concepts with memory cards, or explain the argument against a 60-second mission clock.',
        openLab: 'Open learning lab',
        scope: 'Chapter scope',
        scopeTitle: 'What this chapter is trying to explain',
        claims: 'Central claims',
        claimsTitle: 'The ideas you need to retain',
        evidence: 'Evidence & examples',
        evidenceTitle: 'How the chapter supports its case',
        recall: 'Active recall · close the notes first',
        recallTitle: 'Can you reconstruct the chapter?',
        markComplete: 'Mark chapter complete',
        chapterComplete: 'Chapter complete',
        footer: 'Explore the universe within.',
        mapped: 'mapped chapters',
      };
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const x = localStorage.getItem('atlas-book-progress');
      if (x) setDone(JSON.parse(x));
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const key = book && ci !== null ? `${book.id}-${ci}` : '';
  const save = () => {
    const n = done.includes(key) ? done.filter((x) => x !== key) : [...done, key];
    setDone(n);
    localStorage.setItem('atlas-book-progress', JSON.stringify(n));
  };
  const visible = useMemo(
    () => B.filter((b) => (b.title + b.author).toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  function showMentor() {
    setKawkabOpen(!window.matchMedia('(max-width:560px)').matches);
  }
  function openBook(b) {
    setBook(b);
    setCi(null);
    setLabOpen(false);
    showMentor();
    onNavigateTop?.('smooth');
  }
  function home() {
    setBook(null);
    setCi(null);
    setTab('library');
    setKawkabOpen(false);
    setLabOpen(false);
  }
  const openLab = () => {
    setLabOpen(true);
    setKawkabOpen(false);
  };
  const kawkabMessage = isAr
    ? book && ci !== null
      ? `الفصل ${ci + 1}: ${book.chapters[ci]}. ابدأ بالسؤال المركزي، ثم أعد بناء الحجة من الأدلة قبل اختبار تذكّرك.`
      : book
        ? `مرحبًا بك في ${book.title}. أنا مرشدك في هذا الكتاب. اتبع الفصول بالترتيب أو اختر السؤال الذي تريد فهمه أكثر.`
        : 'اختر كتابًا وابنِ نموذجه. سأرافقك في الطريق.'
    : book && ci !== null
      ? `Chapter ${ci + 1}: ${book.chapters[ci]}. Begin with the central question, then rebuild the argument from the evidence before checking your recall.`
      : book
        ? `Welcome to ${book.title}. I am your mentor for this book. Follow the chapters in order, or choose the question you most want to understand.`
        : 'Pick one book and build its model. I will keep you company along the way.';
  return (
    <main className="kawnera-app" dir={isAr ? 'rtl' : 'ltr'}>
      <header>
        <button className="brand" onClick={home} aria-label="Kawnera home">
          <span className="brandMark" aria-hidden="true">
            <img src={assetUrl('Assets/kawnera/logo.png')} alt="" />
          </span>
          <span className="brandName">
            KAWNERA<small>PSYCHOLOGY &amp; COGNITION</small>
          </span>
        </button>
        <nav>
          <button
            className={tab === 'library' ? 'on' : ''}
            onClick={() => {
              setTab('library');
              home();
            }}
          >
            {t.library}
          </button>
          <button
            className={tab === 'connected' ? 'on' : ''}
            onClick={() => {
              setTab('connected');
              setBook(null);
              setKawkabOpen(false);
              setLabOpen(false);
            }}
          >
            {t.connected}
          </button>
        </nav>
        <div className="count">
          {done.length} {t.chaptersComplete}
        </div>
      </header>
      {!book && tab === 'library' && (
        <>
          <section className="shelfHero">
            <small>{t.heroEye}</small>
            <h1>
              {t.choose}
              <br />
              <i>{t.build}</i>
            </h1>
            <p>{t.heroCopy}</p>
            <label>
              ⌕{' '}
              <input
                placeholder={t.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </section>
          <section className="shelf">
            <div className="shelfHead">
              <span>{t.collection}</span>
              <b>
                {visible.length} {t.titles} · {B.reduce((n, b) => n + b.chapters.length, 0)}{' '}
                {t.chapters}
              </b>
            </div>
            <div className="bookGrid">
              {visible.map((b, i) => {
                const d = b.chapters.filter((_, j) => done.includes(`${b.id}-${j}`)).length;
                return (
                  <button key={b.id} className="bookCard" onClick={() => openBook(b)}>
                    <div className="cover" style={{ background: b.color }}>
                      <img src={b.image} alt="" loading="lazy" />
                      <div className="coverInk">
                        <small>KAWNERA</small>
                        <strong>{b.code}</strong>
                        <span>0{i + 1}</span>
                      </div>
                    </div>
                    <section>
                      <small>
                        {b.pages} {t.pages} · {b.chapters.length} {t.chapters}
                      </small>
                      <h2>{b.title}</h2>
                      <p>{b.author}</p>
                      <div className="bar">
                        <i style={{ width: `${(d / b.chapters.length) * 100}%` }} />
                      </div>
                      <b>
                        {d}/{b.chapters.length} {t.complete} <em>{t.enter} →</em>
                      </b>
                    </section>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
      {!book && tab === 'connected' && (
        <section className="connected">
          <small>CROSS-BOOK SYNTHESIS</small>
          <h1>Connected Ideas</h1>
          <p>
            The original thematic route remains here: use it after individual books to compare how
            the authors treat reasoning, social cognition, mindreading, emotion, assessment, and
            cognitive change.
          </p>
          <div>
            {[
              'Reason as a social tool',
              'Automatic and deliberate thought',
              'How we understand other minds',
              'Memory and the self',
              'Emotion as appraisal',
              'From cognitive skill to daily function',
            ].map((x, i) => (
              <article key={x}>
                <span>0{i + 1}</span>
                <h2>{x}</h2>
                <p>
                  Trace this idea across the library and look for agreements, tensions, and
                  different levels of explanation.
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
      {book && ci === null && (
        <>
          <section className="bookHero" style={{ '--accent': book.color }}>
            <button className="back" onClick={home}>
              ← {t.allBooks}
            </button>
            <div>
              <small>
                {book.chapters.length} {t.course}
              </small>
              <h1>{book.title}</h1>
              <p>{book.desc}</p>
              <b>{book.author}</b>
            </div>
            <div className="bigCover" style={{ background: book.color }}>
              <img src={book.image} alt={book.title + ' original course artwork'} />
              <div className="bigCoverInk">
                <small>KAWNERA</small>
                <strong>{book.code}</strong>
                <span>{book.pages} PAGES</span>
              </div>
            </div>
          </section>
          <section className="toc">
            <aside>
              <small>{t.progress}</small>
              <strong>
                {book.chapters.filter((_, j) => done.includes(`${book.id}-${j}`)).length}
                <i> / {book.chapters.length}</i>
              </strong>
              <div>
                <b
                  style={{
                    width: `${(book.chapters.filter((_, j) => done.includes(`${book.id}-${j}`)).length / book.chapters.length) * 100}%`,
                  }}
                />
              </div>
              <p>{book.desc}</p>
            </aside>
            <article>
              <div className="tocHead">
                <span>{t.map}</span>
                <b>{t.select}</b>
              </div>
              {book.chapters.map((c, j) => (
                <button
                  key={c}
                  onClick={() => {
                    setCi(j);
                    setLabOpen(false);
                    showMentor();
                    onNavigateTop?.('auto');
                  }}
                >
                  <span
                    style={{
                      background: done.includes(`${book.id}-${j}`) ? book.color : 'transparent',
                    }}
                  >
                    {done.includes(`${book.id}-${j}`) ? '✓' : String(j + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <small>
                      {t.chapter} {String(j + 1).padStart(2, '0')}
                    </small>
                    <h2>{c}</h2>
                  </div>
                  <b>→</b>
                </button>
              ))}
            </article>
          </section>
        </>
      )}
      {book &&
        ci !== null &&
        (() => {
          const c = book.chapters[ci],
            d = DEEP[book.id][ci];
          const claims = [...new Set([...d.intro, ...d.core].map(clean))]
            .filter((x) => x.length > 45)
            .slice(0, 9);
          const evidence = [...new Set(d.evidence.map(clean))]
            .filter((x) => x.length > 45)
            .slice(0, 3);
          const conclusions = [...new Set(d.conclusion.map(clean))]
            .filter((x) => x.length > 45)
            .slice(0, 3);
          const sections = d.sections.filter((x) => !/^(summary|references)$/i.test(x));
          const terms = d.terms
            .filter((x) => /^[a-z][a-z'-]{4,}$/i.test(x) && !x.endsWith('-'))
            .slice(0, 8);
          return (
            <>
              <section className="chapterTop" style={{ '--accent': book.color }}>
                <button className="back" onClick={() => setCi(null)}>
                  ← {book.code} {t.contents}
                </button>
                <small>
                  CHAPTER {String(ci + 1).padStart(2, '0')} OF {book.chapters.length} • SOURCE PDF
                  PAGES {d.pages[0]}–{d.pages[1]}
                </small>
                <h1>{c}</h1>
                <p>{clean(d.intro[0] || claims[0])}</p>
              </section>
              <section className="chapterBody deepBody">
                <aside>
                  <span style={{ background: book.color }}>{String(ci + 1).padStart(2, '0')}</span>
                  <small>{book.title}</small>
                  <div>
                    <button
                      disabled={ci === 0}
                      onClick={() => {
                        setCi(ci - 1);
                        onNavigateTop?.('auto');
                      }}
                    >
                      ← {t.previous}
                    </button>
                    <button
                      disabled={ci === book.chapters.length - 1}
                      onClick={() => {
                        setCi(ci + 1);
                        onNavigateTop?.('auto');
                      }}
                    >
                      {t.next} →
                    </button>
                  </div>
                  <nav className="chapterNav">
                    <a href="#scope">Scope</a>
                    <a href="#claims">Core claims</a>
                    <a href="#evidence">Evidence</a>
                    <a href="#recall">Recall</a>
                  </nav>
                </aside>
                <article>
                  <section className="depthNotice">
                    <b>{t.grounded}</b>
                    <span>
                      {t.groundedCopy} {d.pages[0]}–{d.pages[1]}.
                    </span>
                  </section>
                  <section className="kawkabLesson" style={{ '--lab': book.color }}>
                    <div>
                      <small>{t.mission}</small>
                      <h2>{t.missionTitle}</h2>
                      <p>{t.missionCopy}</p>
                    </div>
                    <button onClick={openLab}>{t.openLab}</button>
                  </section>
                  <section id="scope" className="lessonSection">
                    <div className="label">01 • {t.scope}</div>
                    <h2>{t.scopeTitle}</h2>
                    {d.intro.slice(0, 2).map((x, i) => (
                      <p className="lead" key={i}>
                        {clean(x)}
                      </p>
                    ))}
                    {sections.length > 0 && (
                      <>
                        <h3>Argument map</h3>
                        <div className="coverage">
                          {sections.map((x, i) => (
                            <div key={i}>
                              <span>{String(i + 1).padStart(2, '0')}</span>
                              <p>{clean(x)}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </section>
                  <section id="claims" className="lessonSection">
                    <div className="label">02 • {t.claims}</div>
                    <h2>{t.claimsTitle}</h2>
                    <div className="claims">
                      {claims.map((x, i) => (
                        <div key={i}>
                          <span>{String(i + 1).padStart(2, '0')}</span>
                          <p>{x}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section id="evidence" className="lessonSection">
                    <div className="label">03 • {t.evidence}</div>
                    <h2>{t.evidenceTitle}</h2>
                    {evidence.length ? (
                      <div className="evidence">
                        {evidence.map((x, i) => (
                          <article key={i}>
                            <small>EVIDENCE {i + 1}</small>
                            <p>{x}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="lead">
                        This chapter develops its case primarily through conceptual analysis and
                        comparison. Focus on how each distinction changes the conclusion.
                      </p>
                    )}
                  </section>
                  {conclusions.length > 0 && (
                    <section className="lessonSection">
                      <div className="label">04 • WHERE THE ARGUMENT LANDS</div>
                      <h2>Conclusions and implications</h2>
                      {conclusions.map((x, i) => (
                        <p className="lead" key={i}>
                          {x}
                        </p>
                      ))}
                    </section>
                  )}
                  {terms.length > 0 && (
                    <section className="termBand">
                      <small>HIGH-FREQUENCY CHAPTER LANGUAGE</small>
                      <div>
                        {terms.map((x) => (
                          <span key={x}>{x}</span>
                        ))}
                      </div>
                    </section>
                  )}
                  <section id="recall" className="recall deepRecall">
                    <small>{t.recall}</small>
                    <h2>{t.recallTitle}</h2>
                    <ol>
                      <li>State the chapter’s central problem and answer in your own words.</li>
                      {sections.length > 1 && (
                        <li>
                          Explain how “{clean(sections[0])}” connects to “{clean(sections[1])}”.
                        </li>
                      )}
                      <li>
                        Name one piece of evidence, example, or distinction that supports the
                        argument.
                      </li>
                      <li>Identify one limit, boundary condition, or competing explanation.</li>
                      <li>
                        Apply the chapter’s model to a new situation from your own life or work.
                      </li>
                    </ol>
                  </section>
                  <button
                    className={done.includes(key) ? 'complete done' : 'complete'}
                    onClick={save}
                  >
                    {done.includes(key) ? `✓ ${t.chapterComplete}` : t.markComplete}
                  </button>
                  <div className="source">
                    SOURCE MAP • {book.title} • Chapter {ci + 1} • PDF pages {d.pages[0]}–
                    {d.pages[1]}
                  </div>
                </article>
              </section>
            </>
          );
        })()}
      <footer>
        <b>KAWNERA</b>
        <i>{t.footer}</i>
        <small>
          {B.reduce((n, b) => n + b.chapters.length, 0)} {t.mapped}
        </small>
      </footer>
      {isActive && (
        <aside
          className={book ? 'kawkabGuide mentor' : 'kawkabGuide'}
          aria-label="Dr. Kawkab study companion"
        >
          {kawkabOpen && (
            <div className="kawkabBubble" role="status">
              <b>{book ? 'DR. KAWKAB / MENTOR' : 'DR. KAWKAB'}</b>
              <p>{kawkabMessage}</p>
              {book && ci !== null && (
                <button className="kawkabGameLaunch" onClick={openLab}>
                  PLAY THIS CHAPTER
                </button>
              )}
              <small>{book ? 'MENTORING YOUR CURRENT BOOK' : 'YOUR COSMIC STUDY COMPANION'}</small>
            </div>
          )}
          <button
            className={kawkabOpen ? 'kawkabButton open' : 'kawkabButton'}
            onClick={() => setKawkabOpen((x) => !x)}
            aria-expanded={kawkabOpen}
            aria-label={kawkabOpen ? 'Close Dr. Kawkab tip' : 'Ask Dr. Kawkab for a study tip'}
          >
            <Kawkab3D active={kawkabOpen} mentor={!!book} />
            <span className="kawkabTag">
              {book ? 'DR. KAWKAB / MENTOR' : 'DR. KAWKAB / TAP ME'}
            </span>
          </button>
        </aside>
      )}
      {book && ci !== null && labOpen && (
        <KawkabLab
          bookId={book.id}
          bookTitle={book.title}
          chapterIndex={ci}
          chapterTitle={book.chapters[ci]}
          color={book.color}
          data={DEEP[book.id][ci]}
          bank={DEEP[book.id]}
          onClose={() => setLabOpen(false)}
          isAr={isAr}
        />
      )}
    </main>
  );
}
