import React, { useEffect, useMemo, useState } from 'react';
import chapterContent from './chapter-content.json';
import { KAWNERA_BOOKS as B } from './books';
import { assetUrl } from '../../lib/assetUrl';
import './kawnera.css';
import Kawkab3D from './Kawkab3D';
import KawkabLab from './KawkabLab';
import { authoredChapter, authoredFor } from './authored';
import { isAuthored } from './authored/schema';
import PredictGate from './PredictGate';
import ChapterQuest from './ChapterQuest';
const DEEP = chapterContent;
const clean = (s) =>
  s
    .replace(/\b([A-Z])\s+([a-z]{2,})\b/g, '$1$2')
    .replace(/([A-Za-z])-\s+([A-Za-z])/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
export default function KawneraExperience({
  isAr = false, isActive = false, onNavigateTop, jumpTo, onChapterDone,
}) {
  const [book, setBook] = useState(null),
    [ci, setCi] = useState(null),
    [done, setDone] = useState([]),
    [tab, setTab] = useState('library'),
    [query, setQuery] = useState(''),
    [kawkabOpen, setKawkabOpen] = useState(false),
    [labOpen, setLabOpen] = useState(false),
    // Guided run by default; this opts out to the plain scrollable chapter.
    [readStraight, setReadStraight] = useState(false);
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

  // A body tapped in the sky opens its chapter directly. `jumpTo.at` is a
  // timestamp so tapping the SAME chapter twice still re-opens it.
  useEffect(() => {
    if (!jumpTo) return;
    const target = B.find((x) => x.id === jumpTo.bookId);
    if (!target) return;
    setBook(target);
    setCi(jumpTo.chapterIndex);
    setReadStraight(false);
    setLabOpen(false);
  }, [jumpTo]);
  const key = book && ci !== null ? `${book.id}-${ci}` : '';
  // True while ChapterQuest owns the screen — it renders its own Dr. Kawkab.
  const questRunning = !!book && ci !== null && !readStraight
    && isAuthored(authoredChapter(book.id, ci));
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
                    setReadStraight(false);
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
      {/* Authored chapters open as a guided run with Dr. Kawkab by default.
          `readStraight` swaps to the plain scrollable version for anyone who
          would rather just read — the content is identical either way. */}
      {book && ci !== null && !readStraight && isAuthored(authoredChapter(book.id, ci)) && (
        <ChapterQuest
          key={`${book.id}-${ci}`}
          chapter={authoredChapter(book.id, ci)}
          chapters={authoredFor(book.id)}
          book={book}
          chapterTitle={book.chapters[ci]}
          chapterNo={ci + 1}
          onExit={() => setCi(null)}
          onDone={onChapterDone}
          onOpenLab={openLab}
        />
      )}

      {book && ci !== null && readStraight && isAuthored(authoredChapter(book.id, ci)) && (() => {
        const c = book.chapters[ci];
        const a = authoredChapter(book.id, ci);
        return (
          <>
            <section className="chapterTop" style={{ '--accent': book.color }}>
              <button className="back" onClick={() => setCi(null)}>
                ← {book.code} {t.contents}
              </button>
              <small>
                CHAPTER {String(ci + 1).padStart(2, '0')} OF {book.chapters.length} • PAGES{' '}
                {a.pages[0]}–{a.pages[1]}
              </small>
              <h1>{c}</h1>
              <p>{a.question}</p>
            </section>

            <section className="chapterBody deepBody">
              <aside>
                <span style={{ background: book.color }}>{String(ci + 1).padStart(2, '0')}</span>
                <small>{book.title}</small>
                <div>
                  <button
                    disabled={ci === 0}
                    onClick={() => { setCi(ci - 1); onNavigateTop?.('auto'); }}
                  >
                    ← {t.previous}
                  </button>
                  <button
                    disabled={ci === book.chapters.length - 1}
                    onClick={() => { setCi(ci + 1); onNavigateTop?.('auto'); }}
                  >
                    {t.next} →
                  </button>
                </div>
                <nav className="chapterNav">
                  <a href="#summary">In short</a>
                  <a href="#ideas">Key ideas</a>
                  <a href="#evidence">Evidence</a>
                  <a href="#recall">Recall</a>
                </nav>
              </aside>

              <article>
                <section className="depthNotice authored">
                  <b>WRITTEN FROM THE BOOK</b>
                  <span>
                    This lesson was written from {book.title}, pages {a.pages[0]}–{a.pages[1]} —
                    explained rather than extracted, so you can check any claim against the source.
                  </span>
                </section>

                {/* Guess first, then read. See PredictGate for why this is a
                    gate rather than a paragraph. */}
                <PredictGate
                  key={`${book.id}-${ci}`}
                  predict={a.predict}
                  accent={book.color}
                />

                <section className="kawkabLesson" style={{ '--lab': book.color }}>
                  <div>
                    <small>{t.mission}</small>
                    <h2>{t.missionTitle}</h2>
                    <p>{t.missionCopy}</p>
                  </div>
                  <button onClick={openLab}>{t.openLab}</button>
                </section>

                <section id="summary" className="lessonSection">
                  <div className="label">01 • IN SHORT</div>
                  <h2>{a.question}</h2>
                  <p className="lead">{a.summary}</p>
                </section>

                {/* The chapter itself, walked in the book's own order and
                    numbering — this is the part that has to leave you knowing
                    the real chapter rather than the gist of it. */}
                <section id="ideas" className="lessonSection">
                  <div className="label">02 • THE CHAPTER, SECTION BY SECTION</div>
                  <h2>What each part of the chapter says</h2>
                  <div className="walkthrough">
                    {a.sections.map((s, i) => (
                      <article key={i}>
                        <header>
                          <span>{s.n}</span>
                          <h3>{s.title}</h3>
                        </header>
                        <p>{s.body}</p>
                        {s.points && (
                          <ul>
                            {s.points.map((p, j) => <li key={j}>{p}</li>)}
                          </ul>
                        )}
                      </article>
                    ))}
                  </div>
                </section>

                <section className="glossary">
                  <small>EVERY TERM THIS CHAPTER USES</small>
                  <dl>
                    {a.terms.map((x, i) => (
                      <React.Fragment key={i}>
                        <dt>{x.term}</dt>
                        <dd>{x.meaning}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </section>

                <section id="evidence" className="lessonSection">
                  <div className="label">03 • {t.evidence}</div>
                  <h2>{t.evidenceTitle}</h2>
                  <div className="evidence">
                    {a.evidence.map((x, i) => (
                      <article key={i}>
                        <small>{x.study}</small>
                        <p><b>What was done — </b>{x.did}</p>
                        <p><b>What was found — </b>{x.found}</p>
                      </article>
                    ))}
                  </div>
                </section>

                {/* The correction is the teaching. Naming the belief you probably
                    hold, then breaking it, is what makes the idea stick. */}
                <section className="misconception">
                  <small>WHAT MOST PEOPLE GET WRONG</small>
                  <p className="believed">“{a.misconception.believed}”</p>
                  <p className="actually">{a.misconception.actually}</p>
                </section>

                <section className="lessonSection">
                  <div className="label">04 • THE ONE THING</div>
                  <p className="takeaway">{a.takeaway}</p>
                </section>

                <section id="recall" className="recall deepRecall">
                  <small>{t.recall}</small>
                  <h2>{t.recallTitle}</h2>
                  <ol>
                    {a.recall.map((x, i) => <li key={i}>{x}</li>)}
                  </ol>
                </section>

                <button className={done.includes(key) ? 'complete done' : 'complete'} onClick={save}>
                  {done.includes(key) ? `✓ ${t.chapterComplete}` : t.markComplete}
                </button>

                <div className="source">
                  {book.title} · {book.author} · Chapter {ci + 1} · pages {a.pages[0]}–{a.pages[1]}
                </div>
              </article>
            </section>
          </>
        );
      })()}

      {book &&
        ci !== null &&
        !isAuthored(authoredChapter(book.id, ci)) &&
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
                  {/* Honest label. This path shows passages lifted from the
                      source, not a written lesson — saying so is better than
                      captioning raw extracts "Central claims". */}
                  <section className="depthNotice pending">
                    <b>SOURCE EXTRACTS</b>
                    <span>
                      Passages taken straight from {book.title}, pages {d.pages[0]}–{d.pages[1]}.
                      This chapter has not been written up yet, so read it as raw material rather
                      than as an explanation.
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
      {/* The floating guide hides while a guided chapter is running, because
          ChapterQuest renders its own Dr. Kawkab. Two instances means two WebGL
          contexts for the same 3.3MB rig, and with the Home universe holding a
          third the browser starts evicting the oldest — which is what blanked
          the universe and emptied the training characters. One at a time. */}
      {isActive && !questRunning && (
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
          checks={authoredChapter(book.id, ci)?.checks}
          authored={
            isAuthored(authoredChapter(book.id, ci)) ? authoredChapter(book.id, ci) : null
          }
          // Findings from the rest of the book, used as plausible same-domain
          // distractors in the evidence game.
          otherFindings={(authoredFor(book.id) || [])
            .flatMap((c, j) => (j === ci ? [] : c.evidence.map((e) => e.found)))}
          // Whole-book glossary, so a short chapter's pair game becomes
          // cumulative review rather than a dead activity.
          bookTerms={(authoredFor(book.id) || []).flatMap((c) => c.terms)}
          onClose={() => setLabOpen(false)}
          isAr={isAr}
        />
      )}
    </main>
  );
}
