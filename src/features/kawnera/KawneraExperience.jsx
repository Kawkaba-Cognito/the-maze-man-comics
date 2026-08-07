import React, { useEffect, useState } from 'react';
import { KAWNERA_BOOKS as B, bookTitle, chapterTitle, toArabicDigits } from './books';
import { assetUrl } from '../../lib/assetUrl';
import './kawnera.css';
import './kawneraShelf.css';

/*
 * Kawnera — the library.
 *
 * ── What changed on 2026-08-07 ──
 *
 * This was a nine-textbook reader: real titles and authors, a 600 KB
 * `chapter-content.json` of text extracted from the source PDFs, and one book
 * rewritten by hand under `authored/`. None of that material was ours to
 * publish, so it is all gone. What survives is what we made: nine cover
 * paintings, Dr. Kawkab, and the shape of the thing.
 *
 * So the library is now a SHELF WITHOUT BOOKS, and it says so rather than
 * pretending otherwise. Nine numbered volumes, each a world you can look at and
 * open, each chapter an honest "still being written". When real lessons are
 * authored they slot into the same three screens.
 *
 * ── What is parked, not deleted ──
 *
 * ChapterQuest, ChapterGames, ChapterFigures, PredictGate and KawkabLab are the
 * ENGINE — predict-gate, scored recall, evidence games. They are ours, they
 * work, and they are the expensive part to rebuild, so they stay on disk
 * unreferenced rather than being deleted with the content they happened to be
 * reading. `authored/index.js` is the seam they come back through.
 */

const pad = (n) => String(n).padStart(2, '0');
/** Ordinals — a volume or chapter NUMBER, zero-padded so they align in a list. */
const ord = (n, isAr) => (isAr ? toArabicDigits(n) : pad(n));
/** Counts — "7 chapters", never "07 chapters". */
const count = (n, isAr) => (isAr ? toArabicDigits(n) : String(n));

/*
 * A hand-set scatter, so nine worlds read as a constellation rather than a
 * product grid — the same language Home and Wellbeing use. Each value is a
 * fraction of one cell's height, applied as a transform, which means the layout
 * itself stays an ordinary responsive grid: it reflows from three columns to
 * two to one without any of these numbers needing to change.
 */
const DRIFT = [-0.16, 0.1, -0.06, 0.14, -0.18, 0.04, -0.02, 0.16, -0.1];

const STR = {
  en: {
    brandSub: 'PSYCHOLOGY & COGNITION',
    eyebrow: 'KAWNERA · YOUR LIBRARY',
    volumes: 'VOLUMES',
    title: 'Your Library',
    lede: 'Nine worlds are mapped and waiting. Their lessons are being written — open one to see how far it has come.',
    chapters: 'chapters',
    complete: 'complete',
    open: 'Open',
    back: 'Library',
    volume: 'VOLUME',
    chapter: 'CHAPTER',
    contents: 'Contents',
    progress: 'Progress',
    soonKicker: 'BEING WRITTEN',
    soonTitle: 'This chapter has no lesson yet',
    soonCopy:
      'The volume is mapped, but its writing has not started. When it does, this is where the chapter opens — a question to predict, the argument to rebuild, and a recall check at the end.',
    soonBack: 'Back to contents',
    footer: 'Explore the universe within.',
    mapped: 'chapters mapped',
    guide: 'DR. KAWKAB',
    guideTap: 'DR. KAWKAB / TAP ME',
    guideMentor: 'DR. KAWKAB / MENTOR',
    guideFoot: 'YOUR COSMIC STUDY COMPANION',
  },
  ar: {
    brandSub: 'علم النفس والإدراك',
    eyebrow: 'كاونيرا · مكتبتك',
    volumes: 'مجلدات',
    title: 'مكتبتك',
    lede: 'تسعة عوالم مرسومة وبانتظارك. دروسها قيد الكتابة — افتح واحدًا لترى إلى أين وصل.',
    chapters: 'فصول',
    complete: 'مكتمل',
    open: 'افتح',
    back: 'المكتبة',
    volume: 'المجلد',
    chapter: 'الفصل',
    contents: 'المحتويات',
    progress: 'التقدّم',
    soonKicker: 'قيد الكتابة',
    soonTitle: 'لا يوجد درس لهذا الفصل بعد',
    soonCopy:
      'المجلد مرسوم، لكن كتابته لم تبدأ. حين تبدأ، سيُفتح الفصل هنا — سؤال تتوقّعه، وحجة تعيد بناءها، واختبار استرجاع في النهاية.',
    soonBack: 'العودة إلى المحتويات',
    footer: 'استكشف الكون في داخلك.',
    mapped: 'فصلًا منظّمًا',
    guide: 'د. كوكب',
    guideTap: 'د. كوكب / اضغط',
    guideMentor: 'د. كوكب / المرشد',
    guideFoot: 'رفيقك الكوني في الدراسة',
  },
};

/** The cover painting, cropped into a world. Shared by the shelf and the volume page. */
function VolumeOrb({ book, size }) {
  return (
    <span className={`kw-orb${size === 'lg' ? ' kw-orb--lg' : ''}`} aria-hidden="true">
      {/*
        Deliberately NOT `loading="lazy"`. The whole shelf is one screen of nine
        orbs, so lazy-loading defers the very images the page exists to show —
        every world painted as a black circle and popped in afterwards. At ~60KB
        each (they were 300KB until they were resized to the size they actually
        render at) the entire shelf is lighter than one of the old covers.
      */}
      <img src={book.image} alt="" decoding="async" draggable={false} />
      <i className="kw-orb-shade" />
      <i className="kw-orb-rim" />
    </span>
  );
}

export default function KawneraExperience({
  isAr = false, isActive = false, onNavigateTop, jumpTo,
}) {
  const [book, setBook] = useState(null);
  const [ci, setCi] = useState(null);
  const [done, setDone] = useState([]);
  const [kawkabOpen, setKawkabOpen] = useState(false);
  const t = isAr ? STR.ar : STR.en;

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const x = localStorage.getItem('atlas-book-progress');
        if (x) setDone(JSON.parse(x));
      } catch { /* corrupt or unavailable storage is not worth a crash */ }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // A body tapped in Home's sky parks its chapter here. It still lands on the
  // right volume; with no lesson written it opens the placeholder instead of a
  // chapter, which is the honest outcome rather than a dead end.
  useEffect(() => {
    if (!jumpTo) return;
    const target = B.find((x) => x.id === jumpTo.bookId);
    if (!target) return;
    setBook(target);
    setCi(jumpTo.chapterIndex);
  }, [jumpTo]);

  const doneIn = (b) => b.chapters.filter((_, j) => done.includes(`${b.id}-${j}`)).length;

  function openBook(b) {
    setBook(b);
    setCi(null);
    setKawkabOpen(!window.matchMedia('(max-width:560px)').matches);
    onNavigateTop?.('smooth');
  }
  function home() {
    setBook(null);
    setCi(null);
    setKawkabOpen(false);
    onNavigateTop?.('smooth');
  }

  const guideMessage = book && ci !== null
    ? (isAr
      ? `${t.volume} ${ord(book.no, true)} · ${t.chapter} ${ord(ci + 1, true)}. لم يُكتب هذا الدرس بعد — سأكون هنا حين يُكتب.`
      : `Volume ${book.no}, chapter ${pad(ci + 1)} has not been written yet. I will be here when it is.`)
    : book
      ? (isAr
        ? `${bookTitle(book, true)}: ${count(book.chapterCount, true)} فصلًا مرسومًا وبلا محتوى بعد.`
        : `${bookTitle(book, false)} is mapped to ${book.chapterCount} chapters, none written yet.`)
      : (isAr
        ? 'تسعة عوالم بانتظار دروسها. تجوّل بينها الآن.'
        : 'Nine worlds are waiting for their lessons. Wander them for now.');

  return (
    <main className="kawnera-app kawnera-app--universe kw" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="kw-bar">
        <button className="kw-brand" onClick={home} aria-label="Kawnera home">
          <span className="kw-brand-mark" aria-hidden="true">
            <img src={assetUrl('Assets/kawnera/logo.png')} alt="" />
          </span>
          <span className="kw-brand-name">
            KAWNERA<small>{t.brandSub}</small>
          </span>
        </button>
        <div className="kw-bar-count">
          {count(done.length, isAr)} {t.complete}
        </div>
      </header>

      {/* ── The shelf: nine worlds ── */}
      {!book && (
        <section className="kw-sky">
          <div className="kw-sky-head">
            <small>
              {t.eyebrow} · {count(B.length, isAr)} {t.volumes}
            </small>
            <h1>{t.title}</h1>
            <p>{t.lede}</p>
          </div>

          <div className="kw-constellation">
            {B.map((b, i) => {
              const d = doneIn(b);
              return (
                <button
                  key={b.id}
                  type="button"
                  className="kw-world"
                  style={{ '--world': b.color, '--drift': DRIFT[i % DRIFT.length] }}
                  onClick={() => openBook(b)}
                  aria-label={`${bookTitle(b, isAr)} — ${b.chapterCount} ${t.chapters}`}
                >
                  <VolumeOrb book={b} />
                  <span className="kw-world-no">{ord(b.no, isAr)}</span>
                  <span className="kw-world-meta">
                    {count(b.chapterCount, isAr)} {t.chapters}
                    {d > 0 && ` · ${count(d, isAr)} ${t.complete}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── One volume: its number, its progress, its numbered chapters ── */}
      {book && ci === null && (
        <section className="kw-volume" style={{ '--world': book.color }}>
          <button type="button" className="kw-back" onClick={home}>
            ← {t.back}
          </button>

          <div className="kw-volume-head">
            <VolumeOrb book={book} size="lg" />
            <div className="kw-volume-id">
              <small>
                {t.volume} {ord(book.no, isAr)}
              </small>
              <h1>{bookTitle(book, isAr)}</h1>
              <div className="kw-meter" role="img"
                aria-label={`${doneIn(book)} / ${book.chapterCount} ${t.complete}`}>
                <i style={{ width: `${(doneIn(book) / book.chapterCount) * 100}%` }} />
              </div>
              <b>
                {t.progress} · {count(doneIn(book), isAr)} / {count(book.chapterCount, isAr)}
              </b>
            </div>
          </div>

          <div className="kw-contents">
            <div className="kw-contents-head">
              <span>{t.contents}</span>
              <b>
                {count(book.chapterCount, isAr)} {t.chapters}
              </b>
            </div>
            <ol className="kw-chapter-list">
              {book.chapters.map((_, j) => (
                <li key={j}>
                  <button
                    type="button"
                    onClick={() => {
                      setCi(j);
                      onNavigateTop?.('auto');
                    }}
                  >
                    <span className="kw-chapter-no">{ord(j + 1, isAr)}</span>
                    <span className="kw-chapter-name">{chapterTitle(book, j, isAr)}</span>
                    <b aria-hidden="true">→</b>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── A chapter with nothing in it, said plainly ── */}
      {book && ci !== null && (
        <section className="kw-soon" style={{ '--world': book.color }}>
          <button type="button" className="kw-back" onClick={() => setCi(null)}>
            ← {t.soonBack}
          </button>
          <div className="kw-soon-card">
            <VolumeOrb book={book} />
            <small>
              {t.volume} {ord(book.no, isAr)} · {t.chapter} {ord(ci + 1, isAr)}
            </small>
            <h1>{t.soonTitle}</h1>
            <p>{t.soonCopy}</p>
            <span className="kw-soon-flag">{t.soonKicker}</span>
          </div>
        </section>
      )}

      <footer className="kw-foot">
        <b>KAWNERA</b>
        <i>{t.footer}</i>
        <small>
          {count(B.reduce((n, b) => n + b.chapterCount, 0), isAr)} {t.mapped}
        </small>
      </footer>

      {/* One Dr. Kawkab at a time: this rig is a WebGL context, and the Home
          universe already holds one. A second pair used to make the browser
          evict the oldest, which is what blanked the universe. */}
      {isActive && (
        <aside
          className={book ? 'kawkabGuide mentor' : 'kawkabGuide'}
          aria-label="Dr. Kawkab study companion"
        >
          {kawkabOpen && (
            <div className="kawkabBubble" role="status">
              <b>{book ? t.guideMentor : t.guide}</b>
              <p>{guideMessage}</p>
              <small>{t.guideFoot}</small>
            </div>
          )}
          <button
            type="button"
            className={kawkabOpen ? 'kawkabButton open' : 'kawkabButton'}
            onClick={() => setKawkabOpen((x) => !x)}
            aria-expanded={kawkabOpen}
            aria-label={kawkabOpen ? 'Close Dr. Kawkab tip' : 'Ask Dr. Kawkab for a study tip'}
          >
            {/* The same Kawkab the Training hub uses — one character across the
                app, and one fewer WebGL context on this tab (the 3D rig that
                was here competed with Home's universe for a scarce resource;
                see Kawkab3D, which stays on disk for the parked chapter run). */}
            <img
              className="kw-guide-art"
              src={assetUrl('Assets/characters/kawkab/kawkab-planet.webp')}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
            <span className="kawkabTag">{book ? t.guideMentor : t.guideTap}</span>
          </button>
        </aside>
      )}
    </main>
  );
}
