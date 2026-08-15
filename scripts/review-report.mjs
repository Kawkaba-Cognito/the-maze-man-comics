#!/usr/bin/env node
/*
 * review-report — renders review/findings.json as a holographic systems panel.
 *
 * One source, two renderings: `npm run review` prints the board in the
 * terminal, `npm run review:html` builds the visual. Neither hand-copies the
 * other's content, so they cannot drift apart — which is the failure this
 * whole system exists to prevent.
 *
 * Server-rendered (here, in node) rather than client-rendered from embedded
 * JSON, so the page is readable with JavaScript disabled. JS adds only
 * expand/filter.
 *
 *   node scripts/review-report.mjs      # → review/report.html
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'review/findings.json');

if (!existsSync(SRC)) {
  console.error('review/findings.json missing — run `npm run review -- --json` first.');
  process.exit(1);
}
const data = JSON.parse(readFileSync(SRC, 'utf8'));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const STATUS = {
  pass:      { label: 'CLEAR',     glyph: '●', tone: 'ok' },
  fail:      { label: 'ACTION',    glyph: '▲', tone: 'bad' },
  manual:    { label: 'YOUR CALL', glyph: '◆', tone: 'warn' },
  'not-yet': { label: 'STANDBY',   glyph: '○', tone: 'idle' },
  error:     { label: 'CHECK BROKEN', glyph: '✕', tone: 'bad' },
};

const t = data.tally || {};
const order = ['fail', 'manual', 'pass', 'not-yet'];

const summaryCells = [
  ['ACTION NEEDED', t.fail || 0, 'bad'],
  ['YOUR CALL', t.manual || 0, 'warn'],
  ['CLEAR', t.pass || 0, 'ok'],
  ['STANDBY', t['not-yet'] || 0, 'idle'],
].map(([label, n, tone]) => `
      <div class="cell" data-tone="${tone}">
        <span class="cell-n">${n}</span>
        <span class="cell-l">${label}</span>
      </div>`).join('');

const bay = (key, meta) => {
  const rows = data.results.filter((r) => r.domain === key);
  if (!rows.length) return '';
  rows.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const counts = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  const worst = counts.fail ? 'bad' : counts.manual ? 'warn' : counts.pass ? 'ok' : 'idle';

  const items = rows.map((r) => {
    const s = STATUS[r.status] || STATUS.error;
    return `
        <details class="std" data-tone="${s.tone}" data-status="${esc(r.status)}">
          <summary>
            <span class="glyph" aria-hidden="true">${s.glyph}</span>
            <span class="sid">${esc(r.id)}</span>
            <span class="stitle">${esc(r.title)}</span>
            <span class="sstat">${s.label}${r.status === 'fail' ? ` · ${esc(r.severity)}` : ''}</span>
          </summary>
          <div class="body">
            ${r.status === 'not-yet' && r.trigger
              ? `<p class="trigger"><span>DORMANT UNTIL</span> ${esc(r.trigger)}</p>` : ''}
            <p class="lede">${esc(r.what)}</p>
            <div class="field"><h4>Why this matters</h4><p>${esc(r.why)}</p></div>
            <div class="field"><h4>What was found here</h4><pre>${esc(r.evidence)}</pre></div>
            ${r.status === 'fail' || r.status === 'manual'
              ? `<div class="field"><h4>What to do</h4><p>${esc(r.fix)}</p></div>` : ''}
            ${String(r.source).startsWith('http')
              ? `<a class="src" href="${esc(r.source)}" target="_blank" rel="noopener">Source ↗</a>`
              : `<p class="src-local">Source: ${esc(r.source)}</p>`}
          </div>
        </details>`;
  }).join('');

  return `
      <section class="bay" data-tone="${worst}">
        <header class="bay-head">
          <h2>${esc(meta.label)}</h2>
          <p>${esc(meta.blurb)}</p>
          <span class="bay-count">${rows.length}</span>
        </header>
        <div class="stds">${items}</div>
      </section>`;
};

const bays = Object.entries(data.domains).map(([k, m]) => bay(k, m)).join('');
const stamp = new Date(data.generated).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

const html = `<title>Review Board — Brain Games</title>
<style>
  /* A holographic projection has no light mode. Single theme, deliberately. */
  :root{
    --void:#070b14; --panel:#0d1526; --panel-2:#111d33;
    --holo:#4fd8c4; --holo-dim:#2b7f75;
    --caution:#f0a860; --critical:#ff6b7a; --dormant:#46587a;
    --ink:#dceaf5; --ink-2:#8fa3bd; --ink-3:#5f7594;
    --rule:#1b2a45;
    --mono:ui-monospace,"SF Mono","Cascadia Mono","Roboto Mono",Menlo,Consolas,monospace;
    --sans:ui-sans-serif,system-ui,"Segoe UI",Inter,Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box}
  body{
    margin:0; background:var(--void); color:var(--ink);
    font-family:var(--sans); line-height:1.6;
    background-image:
      linear-gradient(rgba(79,216,196,.028) 1px,transparent 1px),
      linear-gradient(90deg,rgba(79,216,196,.028) 1px,transparent 1px);
    background-size:44px 44px;
  }
  .wrap{max-width:920px;margin:0 auto;padding:40px 20px 88px}

  /* ── Masthead ─────────────────────────────────────────── */
  .top{position:relative;border:1px solid var(--rule);background:linear-gradient(160deg,var(--panel),#0a1120);padding:26px 24px 22px;overflow:hidden}
  .top::after{content:"";position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(transparent 0%,rgba(79,216,196,.055) 50%,transparent 100%);
    height:38%;animation:sweep 7s linear infinite}
  @keyframes sweep{0%{transform:translateY(-120%)}100%{transform:translateY(360%)}}
  .eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.22em;color:var(--holo);margin:0 0 10px}
  h1{font-family:var(--mono);font-size:clamp(24px,4.6vw,36px);font-weight:600;letter-spacing:.02em;
     margin:0 0 8px;text-wrap:balance;text-shadow:0 0 22px rgba(79,216,196,.32)}
  .sub{margin:0;color:var(--ink-2);max-width:62ch;font-size:15px}
  .stamp{font-family:var(--mono);font-size:11px;color:var(--ink-3);margin-top:14px;letter-spacing:.06em}

  /* ── Posture summary ──────────────────────────────────── */
  .cells{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:1px;
         background:var(--rule);border:1px solid var(--rule);border-top:0}
  .cell{background:var(--panel);padding:16px 14px;display:flex;flex-direction:column;gap:3px}
  .cell-n{font-family:var(--mono);font-size:30px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1}
  .cell-l{font-family:var(--mono);font-size:10px;letter-spacing:.16em;color:var(--ink-3)}
  [data-tone="ok"] .cell-n,.cell[data-tone="ok"] .cell-n{color:var(--holo)}
  .cell[data-tone="bad"] .cell-n{color:var(--critical)}
  .cell[data-tone="warn"] .cell-n{color:var(--caution)}
  .cell[data-tone="idle"] .cell-n{color:var(--dormant)}

  /* ── Filter ───────────────────────────────────────────── */
  .filters{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0 6px}
  .filters button{font-family:var(--mono);font-size:11px;letter-spacing:.12em;cursor:pointer;
    background:transparent;color:var(--ink-2);border:1px solid var(--rule);padding:7px 13px}
  .filters button:hover{border-color:var(--holo-dim);color:var(--ink)}
  .filters button[aria-pressed="true"]{border-color:var(--holo);color:var(--holo);
    box-shadow:inset 0 0 14px rgba(79,216,196,.12)}
  .filters button:focus-visible{outline:2px solid var(--holo);outline-offset:2px}

  /* ── Bays ─────────────────────────────────────────────── */
  .bay{margin-top:26px;border:1px solid var(--rule);background:var(--panel);position:relative}
  .bay::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px}
  .bay[data-tone="bad"]::before{background:var(--critical)}
  .bay[data-tone="warn"]::before{background:var(--caution)}
  .bay[data-tone="ok"]::before{background:var(--holo)}
  .bay[data-tone="idle"]::before{background:var(--dormant)}
  .bay-head{padding:18px 22px 16px;border-bottom:1px solid var(--rule);position:relative}
  .bay-head h2{font-family:var(--mono);font-size:13px;letter-spacing:.2em;text-transform:uppercase;
    margin:0 0 7px;color:var(--ink)}
  .bay-head p{margin:0;color:var(--ink-2);font-size:14px;max-width:64ch}
  .bay-count{position:absolute;top:16px;right:20px;font-family:var(--mono);font-size:11px;color:var(--ink-3)}

  /* ── Standards ────────────────────────────────────────── */
  .std{border-bottom:1px solid var(--rule)}
  .std:last-child{border-bottom:0}
  .std[hidden]{display:none}
  summary{list-style:none;cursor:pointer;display:grid;
    grid-template-columns:26px 62px 1fr auto;align-items:baseline;gap:10px;padding:13px 22px}
  summary::-webkit-details-marker{display:none}
  summary:hover{background:var(--panel-2)}
  summary:focus-visible{outline:2px solid var(--holo);outline-offset:-2px}
  .glyph{font-size:11px;line-height:1.6}
  .std[data-tone="ok"] .glyph{color:var(--holo)}
  .std[data-tone="bad"] .glyph{color:var(--critical)}
  .std[data-tone="warn"] .glyph{color:var(--caution)}
  .std[data-tone="idle"] .glyph{color:var(--dormant)}
  .sid{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:.08em}
  .stitle{font-size:15px;color:var(--ink)}
  .sstat{font-family:var(--mono);font-size:10px;letter-spacing:.14em;color:var(--ink-3);white-space:nowrap}
  .std[data-tone="bad"] .sstat{color:var(--critical)}
  .std[data-tone="warn"] .sstat{color:var(--caution)}

  .body{padding:4px 22px 24px 58px;border-top:1px dashed var(--rule);margin-top:-1px}
  .lede{color:var(--ink);font-size:15px;margin:16px 0 0;max-width:66ch}
  .trigger{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--dormant);
    margin:14px 0 0;border:1px solid var(--rule);padding:7px 11px;display:inline-block}
  .trigger span{color:var(--ink-3)}
  .field{margin-top:20px}
  .field h4{font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;
    color:var(--holo);margin:0 0 7px;font-weight:500}
  .field p{margin:0;color:var(--ink-2);font-size:14.5px;max-width:66ch}
  .field pre{margin:0;font-family:var(--mono);font-size:12.5px;color:var(--ink-2);
    background:#0a1120;border:1px solid var(--rule);padding:12px 14px;
    white-space:pre-wrap;overflow-x:auto;max-width:100%}
  .src{display:inline-block;margin-top:18px;font-family:var(--mono);font-size:11px;
    letter-spacing:.1em;color:var(--holo);text-decoration:none;border-bottom:1px solid var(--holo-dim);padding-bottom:2px}
  .src:hover{border-color:var(--holo)}
  .src-local{margin-top:18px;font-family:var(--mono);font-size:11px;color:var(--ink-3)}

  footer{margin-top:38px;border-top:1px solid var(--rule);padding-top:18px;
    color:var(--ink-3);font-size:13px}
  footer code{font-family:var(--mono);color:var(--ink-2)}

  @media (prefers-reduced-motion:reduce){.top::after{animation:none;display:none}}
  @media (max-width:560px){
    summary{grid-template-columns:20px 1fr;row-gap:2px}
    .sid{grid-column:2}.stitle{grid-column:2}.sstat{grid-column:2}
    .body{padding-left:22px}
  }
</style>

<div class="wrap">
  <header class="top">
    <p class="eyebrow">STANDING REVIEW · BRAIN GAMES</p>
    <h1>Systems Review</h1>
    <p class="sub">What an app like this one is actually held to — scientific validity, privacy law, application security, and the backend that does not exist yet. Every line below is either a check that ran against this repository or a citation to an authority outside it.</p>
    <p class="stamp">GENERATED ${esc(stamp)} · ${data.results.length} STANDARDS</p>
  </header>

  <div class="cells">${summaryCells}</div>

  <div class="filters" role="group" aria-label="Filter standards by status">
    <button type="button" data-f="all" aria-pressed="true">ALL</button>
    <button type="button" data-f="fail" aria-pressed="false">ACTION NEEDED</button>
    <button type="button" data-f="manual" aria-pressed="false">YOUR CALL</button>
    <button type="button" data-f="pass" aria-pressed="false">CLEAR</button>
    <button type="button" data-f="not-yet" aria-pressed="false">STANDBY</button>
  </div>
${bays}

  <footer>
    <p>This board <strong>reports</strong>. The gate that <strong>blocks</strong> is <code>npm run audit:sec</code>. Regenerate with <code>npm run review:html</code>.</p>
    <p>STANDBY items are genuine requirements that do not apply yet — you cannot rate-limit a server you have not built. They are listed so nothing is discovered late.</p>
  </footer>
</div>

<script>
  const btns = document.querySelectorAll('.filters button');
  const stds = document.querySelectorAll('.std');
  btns.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.f;
    btns.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    stds.forEach((s) => { s.hidden = f !== 'all' && s.dataset.status !== f; });
    document.querySelectorAll('.bay').forEach((bay) => {
      bay.hidden = ![...bay.querySelectorAll('.std')].some((s) => !s.hidden);
    });
  }));
</script>
`;

writeFileSync(join(ROOT, 'review/report.html'), html);
console.log(`review/report.html written — ${data.results.length} standards.`);
