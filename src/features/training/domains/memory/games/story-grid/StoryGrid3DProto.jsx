import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
// SAME engine as the 2D game: real authored stories, palettes with distractors,
// survival config ramp. Never re-derive the rules here.
import { makeStory, survivalCfg, BACKGROUNDS, ACTIONS, CHARS } from './index';
import '../../../../shared/c3dProto.css';

/*
 * Story Time · 3D — the REAL 2D Survival, rendered as cosmos panels.
 * WATCH: browse the story one big scene at a time (‹ › nav) under the same
 * memo countdown (survivalCfg: 52−stage×1.1s, min 30) with "Done" to skip.
 * REBUILD: the 2D construction task — empty numbered panels + palettes of
 * places / characters / actions (with the story's real distractors mixed in);
 * select a piece, tap a panel to place it (characters toggle, max 3; actions
 * need a character; eraser clears). CHECK scores each panel on background +
 * action + character-set, reveals the true story, and Survival advances the
 * stage on a perfect rebuild / steps back otherwise — exactly the 2D rules.
 */

const UI = {
  en: {
    title: 'Story Time · 3D',
    tag: 'prototype',
    watchTag: 'Watch & remember',
    places: 'Places', characters: 'Characters', actions: 'Actions', erase: 'Erase',
    selectHint: 'Tap a piece below, then tap a panel', placing: (x) => `Placing: ${x} — tap a panel`,
    erasing: 'Eraser — tap a panel to clear', needChar: 'Put a character in the panel first',
    check: '✓ Check', perfect: 'Perfect! ✓', score: (n, m) => `${n}/${m} panels correct`,
    storyWas: 'The story was:',
    next: '›', prev: '‹', doneMemo: '✓ Done — rebuild it', cont: 'Continue ›',
    story: 'Story', best: 'best', go: 'ENGAGE',
  },
  ar: {
    title: 'وقت القصة · ثلاثي الأبعاد',
    tag: 'نموذج',
    watchTag: 'شاهد وتذكّر',
    places: 'الأماكن', characters: 'الشخصيات', actions: 'الأفعال', erase: 'مسح',
    selectHint: 'اختر قطعة ثم اضغط لوحة', placing: (x) => `وضع: ${x} — اضغط لوحة`,
    erasing: 'ممحاة — اضغط لوحة لمسحها', needChar: 'ضع شخصية في اللوحة أولاً',
    check: '✓ تحقّق', perfect: 'ممتاز! ✓', score: (n, m) => `${n}/${m} لوحات صحيحة`,
    storyWas: 'كانت القصة:',
    next: '›', prev: '‹', doneMemo: '✓ تم — أعد البناء', cont: 'متابعة ›',
    story: 'قصة', best: 'أفضل', go: 'انطلق',
  },
};

// Distinct, stable tokens for the cast (2D uses drawn CharacterArt).
const CHAR_EMOJI = { kawkab: '🪐', star: '⭐', noor: '🌙', rami: '🦊', lola: '🐰' };
const nameOf = (id, isAr) => { const c = CHARS.find((x) => x.id === id); return c ? (isAr ? c.ar : c.en) : ''; };
const actionOf = (id) => ACTIONS.find((a) => a.id === id) || null;
const itemEmoji = (item) => (typeof item === 'string' ? item : item?.e || '');
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const EMPTY_PANEL = () => ({ bg: null, chars: [], action: null, say: null, item: null });

function bgColors(bgId) {
  const cfg = BACKGROUNDS[bgId];
  const hexes = (cfg?.bg || '').match(/#[0-9a-fA-F]{6}/g) || [];
  return {
    top: hexes[0] || '#f4ecdd',
    bottom: hexes[1] || hexes[0] || '#eadfc8',
    ground: cfg?.ground || '#c69a67',
    chip: cfg?.chip || '📍',
    dark: !!cfg?.dark,
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draw a story panel (place + characters + action + item) → CanvasTexture.
 * `opts`: { num, border ('ok'|'bad'|'sel'|null), big, say }
 */
function panelTexture(panel, opts = {}) {
  const W = opts.big ? 300 : 210;
  const H = opts.big ? 250 : 180;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const empty = !panel || (!panel.bg && (!panel.chars || panel.chars.length === 0) && !panel.action);

  if (panel?.bg) {
    const col = bgColors(panel.bg);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, col.top);
    grad.addColorStop(1, col.bottom);
    ctx.fillStyle = grad;
    roundRectPath(ctx, 5, 5, W - 10, H - 10, 16);
    ctx.fill();
    ctx.fillStyle = col.ground;
    ctx.fillRect(9, H - H * 0.24, W - 18, H * 0.24 - 6);
    ctx.font = `${W * 0.12}px serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(col.chip, 14, 26);
  } else {
    ctx.fillStyle = '#efe6d4';
    roundRectPath(ctx, 5, 5, W - 10, H - 10, 16);
    ctx.fill();
  }
  // border
  ctx.lineWidth = 6;
  ctx.strokeStyle = opts.border === 'ok' ? '#2e8b57'
    : opts.border === 'bad' ? '#d23b3b'
      : opts.border === 'sel' ? '#b9842f'
        : 'rgba(90,70,40,0.35)';
  if (empty && !opts.border) ctx.setLineDash([10, 8]);
  roundRectPath(ctx, 5, 5, W - 10, H - 10, 16);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (empty) {
    ctx.fillStyle = 'rgba(90,70,40,0.5)';
    ctx.font = `800 ${W * 0.3}px system-ui, sans-serif`;
    ctx.fillText('?', W / 2, H / 2);
  } else {
    // characters on the ground band
    const chars = panel.chars || [];
    const cw = W / (chars.length + 1);
    ctx.font = `${W * 0.17}px serif`;
    chars.forEach((id, i) => ctx.fillText(CHAR_EMOJI[id] || '🙂', cw * (i + 1), H - H * 0.19));
    // action above them
    if (panel.action) {
      ctx.font = `${W * 0.2}px serif`;
      ctx.fillText(actionOf(panel.action)?.e || '⚡', W / 2, H * 0.42);
    }
    // item corner
    const it = itemEmoji(panel.item);
    if (it) { ctx.font = `${W * 0.14}px serif`; ctx.fillText(it, W - W * 0.14, H * 0.2); }
    // speech bubble (watch scene only)
    if (opts.big && opts.say) {
      const txt = opts.say.length > 34 ? `${opts.say.slice(0, 33)}…` : opts.say;
      ctx.font = `700 ${Math.round(W * 0.055)}px system-ui, sans-serif`;
      const tw = Math.min(W - 30, ctx.measureText(txt).width + 22);
      ctx.fillStyle = '#fffdf8';
      roundRectPath(ctx, (W - tw) / 2, 12, tw, 30, 10);
      ctx.fill();
      ctx.strokeStyle = '#1a1208';
      ctx.lineWidth = 2.5;
      roundRectPath(ctx, (W - tw) / 2, 12, tw, 30, 10);
      ctx.stroke();
      ctx.fillStyle = '#3a2c18';
      ctx.fillText(txt, W / 2, 28);
    }
  }
  // slot number badge
  if (opts.num != null) {
    ctx.fillStyle = opts.border === 'ok' ? '#2e8b57' : opts.border === 'bad' ? '#d23b3b' : '#1a1208';
    ctx.beginPath();
    ctx.arc(20, H - 20, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '800 16px system-ui, sans-serif';
    ctx.fillText(String(opts.num), 20, H - 19);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const dockRow = { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' };
const dockLabel = { fontSize: '0.62rem', fontWeight: 800, color: 'rgba(240,226,192,0.65)', minWidth: 58, textAlign: 'end' };
const chipBtn = (sel) => ({
  border: sel ? '2px solid #e8ac4e' : '2px solid rgba(240,226,192,0.28)',
  background: sel ? 'rgba(232,172,78,0.22)' : 'rgba(20,16,10,0.72)',
  color: '#f0e2c0', borderRadius: 10, padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700,
  cursor: 'pointer', lineHeight: 1.15,
});

export default function StoryGrid3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | watch | rebuild | reveal
  const [hint, setHint] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [roundNo, setRoundNo] = useState(1);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [watchPos, setWatchPos] = useState({ i: 0, n: 0 });
  const [palettes, setPalettes] = useState(null); // { bgs, chars, actions }
  const [selState, setSelState] = useState(null); // { kind, id }
  const [fillState, setFillState] = useState({ filled: 0, len: 0 });
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 54, fitHalf: 4.4, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitHalf, renderer, dispose } = boot;

    let meshes = []; // { mesh, tex, slot }
    const clearMeshes = () => {
      for (const m of meshes) { disposeObject(m.mesh); m.tex?.dispose(); playRoot.remove(m.mesh); }
      meshes = [];
    };
    const addPanelMesh = (panel, opts, x, y, w, h, slot) => {
      const tex = panelTexture(panel, opts);
      const side = matStd(0x1d1811, { metalness: 0.15, roughness: 0.7 });
      const face = new THREE.MeshStandardMaterial({ map: tex, emissive: new THREE.Color(0xe8ac4e), emissiveIntensity: 0, metalness: 0.1, roughness: 0.65 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), [side, side, side, side, face, side]);
      mesh.position.set(x, y, 0);
      mesh.userData.slot = slot;
      mesh.userData.faceMat = face;
      playRoot.add(mesh);
      meshes.push({ mesh, tex, slot });
      return mesh;
    };

    // ── Game state (mirrors the 2D free loop exactly) ──
    const rng = makeRng((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
    let stage = 0;
    let bestN = 0;
    let rounds = 0;
    let usedIds = [];
    let story = null;
    let cfg = null;
    let panels = [];
    let sel = null;
    let watchIdx = 0;
    let gamePhase = 'watch';
    let result = { n: 0, m: 0 };
    let finished = false;
    let watchTimer = null;
    let memoLeft = 0;
    const clearWatchTimer = () => { if (watchTimer) { clearInterval(watchTimer); watchTimer = null; } };

    const len = () => (story ? story.target.length : 0);

    // ── Renders ──
    const renderWatch = () => {
      clearMeshes();
      const beat = story.target[watchIdx];
      const say = beat.say ? (isAr ? beat.say.ar : beat.say.en) : null;
      addPanelMesh(beat, { big: true, say, num: watchIdx + 1 }, 0, 0.25, 3.3, 2.75, -1);
      setFitHalf(3.1);
      setWatchPos({ i: watchIdx, n: len() });
      const narr = beat.narr ? (isAr ? beat.narr.ar : beat.narr.en) : '';
      const filled = narr
        .replace(/\{H\}/g, nameOf(story.roleChar?.H, isAr)).replace(/\{F\}/g, nameOf(story.roleChar?.F, isAr))
        .replace(/\{L\}/g, nameOf('lola', isAr)).replace(/\{R\}/g, nameOf('rami', isAr)).replace(/\{N\}/g, nameOf('noor', isAr));
      setHint(`${watchIdx + 1}/${len()} · ${filled}`);
    };

    const panelGrid = (n) => {
      const cols = n <= 2 ? n : n === 4 ? 2 : 3;
      const rows = Math.ceil(n / cols);
      return { cols, rows };
    };

    const renderRebuild = (revealInfo = null) => {
      clearMeshes();
      const n = len();
      const { cols, rows } = panelGrid(n);
      const w = coarse ? 1.62 : 1.72;
      const h = w * 0.84;
      const gapX = w + 0.18;
      const gapY = h + 0.22;
      const topY = revealInfo ? 1.75 : (rows > 1 ? 0.95 : 0.45);
      panels.forEach((p, i) => {
        const r = Math.floor(i / cols);
        const cc = i % cols;
        const rowLen = r < rows - 1 ? cols : n - cols * (rows - 1);
        const x = (cc - (rowLen - 1) / 2) * gapX;
        const y = topY - r * gapY;
        let border = null;
        if (revealInfo) border = revealInfo.ok[i] ? 'ok' : 'bad';
        addPanelMesh(p, { num: i + 1, border }, x, y, w, h, i);
      });
      if (revealInfo) {
        // The true story, smaller, below (the 2D reveal recap row).
        const sw = w * 0.62;
        const sh = h * 0.62;
        story.target.forEach((g, i) => {
          const r = Math.floor(i / cols);
          const cc = i % cols;
          const rowLen = r < rows - 1 ? cols : n - cols * (rows - 1);
          const x = (cc - (rowLen - 1) / 2) * (sw + 0.14);
          const y = -1.15 - r * (sh + 0.16);
          addPanelMesh(g, { num: i + 1, border: 'ok' }, x, y, sw, sh, -1);
        });
      }
      setFitHalf(Math.max(3.4, (cols * gapX) / 2 + 1.1, revealInfo ? 3.9 : rows * gapY * 0.9 + 1.2));
    };

    const syncFill = () => {
      const filled = panels.filter((p) => p.bg && p.chars.length > 0 && p.action).length;
      setFillState({ filled, len: len() });
    };

    // ── Phases ──
    const toRebuild = () => {
      clearWatchTimer();
      gamePhase = 'rebuild';
      setPhase('rebuild');
      sel = null;
      setSelState(null);
      setHint(t.selectHint);
      renderRebuild();
      syncFill();
    };

    const newRound = () => {
      cfg = survivalCfg(stage);
      story = makeStory(cfg.len, rng, cfg.distract, usedIds);
      usedIds = [...usedIds, story.id].slice(-4);
      panels = Array.from({ length: cfg.len }, () => EMPTY_PANEL());
      watchIdx = 0;
      result = { n: 0, m: 0 };
      sel = null;
      setSelState(null);
      setStoryTitle(story.title ? (isAr ? story.title.ar : story.title.en) : '');
      setPalettes({
        bgs: story.paletteBgs.map((id) => ({ id, chip: bgColors(id).chip, name: isAr ? BACKGROUNDS[id]?.ar : BACKGROUNDS[id]?.en })),
        chars: story.paletteChars.map((id) => ({ id, e: CHAR_EMOJI[id] || '🙂', name: nameOf(id, isAr) })),
        actions: story.paletteActions.map((id) => { const a = actionOf(id); return { id, e: a?.e || '⚡', name: isAr ? a?.ar : a?.en }; }),
      });
      setRoundNo(rounds + 1);
      gamePhase = 'watch';
      setPhase('watch');
      setBanner(null);
      memoLeft = cfg.memo;
      setTimeLeft(memoLeft);
      renderWatch();
      clearWatchTimer();
      watchTimer = setInterval(() => {
        if (finished) return;
        memoLeft = Math.max(0, memoLeft - 1);
        setTimeLeft(memoLeft);
        if (memoLeft <= 0) toRebuild();
      }, 1000);
    };

    const applyToPanel = (i) => {
      if (gamePhase !== 'rebuild') return;
      if (!sel) { setHint(t.selectHint); return; }
      const p = panels[i];
      if (sel.kind === 'erase') { panels[i] = EMPTY_PANEL(); playSfxRef.current?.('click'); }
      else if (sel.kind === 'bg') { panels[i] = { ...p, bg: sel.id }; playSfxRef.current?.('click'); }
      else if (sel.kind === 'char') {
        panels[i] = p.chars.includes(sel.id)
          ? { ...p, chars: p.chars.filter((x) => x !== sel.id) }
          : { ...p, chars: [...p.chars, sel.id].slice(-3) };
        playSfxRef.current?.('click');
      } else if (sel.kind === 'action') {
        if (p.chars.length === 0) { setHint(t.needChar); return; }
        panels[i] = { ...p, action: sel.id };
        playSfxRef.current?.('click');
      }
      renderRebuild();
      syncFill();
    };

    const check = () => {
      if (gamePhase !== 'rebuild') return;
      const n = len();
      const filled = panels.filter((p) => p.bg && p.chars.length > 0 && p.action).length;
      if (filled < n) return;
      const ok = panels.map((p, i) => {
        const g = story.target[i];
        return p.bg === g.bg && p.action === g.action && sameSet(p.chars, g.chars);
      });
      const good = ok.filter(Boolean).length;
      result = { n: good, m: n };
      playSfxRef.current?.(good === n ? 'win' : 'error');
      gamePhase = 'reveal';
      setPhase('reveal');
      const moral = story.moral ? ` ✨ ${isAr ? story.moral.ar : story.moral.en}` : '';
      setHint(`${good === n ? t.perfect : t.score(good, n)} · ${t.storyWas}${storyTitle ? ` “${storyTitle}”` : ''}${moral}`);
      renderRebuild({ ok });
    };

    const advanceRound = () => {
      if (gamePhase !== 'reveal') return;
      playSfxRef.current?.('click');
      const perfect = result.n === result.m && result.m > 0;
      rounds += 1;
      stage = perfect ? stage + 1 : Math.max(0, stage - 1);
      bestN = Math.max(bestN, stage);
      setBest(bestN);
      newRound();
    };

    // ── Pointer (panel taps) ──
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const el = renderer.domElement;
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (gamePhase !== 'rebuild') return;
      const rect = el.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(meshes.filter((m) => m.slot >= 0).map((m) => m.mesh), false);
      if (hits.length) applyToPanel(hits[0].object.userData.slot);
    };
    el.addEventListener('pointerup', onUp);

    setTick((_dt, now) => {
      for (const m of meshes) {
        if (m.slot === -1 && gamePhase === 'watch') m.mesh.rotation.y = Math.sin(now * 0.0012) * 0.05;
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        stage = 0; bestN = 0; rounds = 0; usedIds = [];
        setBest(0);
        newRound();
      },
      watchNav: (d) => {
        if (gamePhase !== 'watch') return;
        playSfxRef.current?.('click');
        watchIdx = Math.max(0, Math.min(len() - 1, watchIdx + d));
        renderWatch();
      },
      doneMemo: () => { if (gamePhase === 'watch') { playSfxRef.current?.('click'); toRebuild(); } },
      pickSel: (kind, id) => {
        if (gamePhase !== 'rebuild') return;
        playSfxRef.current?.('click');
        sel = sel && sel.kind === kind && sel.id === id ? null : { kind, id };
        setSelState(sel);
        setHint(sel
          ? (sel.kind === 'erase' ? t.erasing : t.placing(
            sel.kind === 'bg' ? (BACKGROUNDS[sel.id]?.[isAr ? 'ar' : 'en'] ?? '')
              : sel.kind === 'char' ? nameOf(sel.id, isAr)
                : (isAr ? actionOf(sel.id)?.ar : actionOf(sel.id)?.en) ?? ''))
          : t.selectHint);
      },
      check,
      advanceRound,
      stop: () => { finished = true; clearWatchTimer(); },
    };

    return () => {
      finished = true;
      clearWatchTimer();
      el.removeEventListener('pointerup', onUp);
      clearMeshes();
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { playSfx?.('click'); apiRef.current.start?.(); });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = phase === 'boot' ? [] : [
    `${t.story} ${roundNo}`,
    `${t.best} ${best}`,
    phase === 'watch' ? `⏱ ${timeLeft}s` : '',
    phase === 'rebuild' ? `${fillState.filled}/${fillState.len}` : '',
  ].filter(Boolean);

  const isSel = (kind, id) => selState && selState.kind === kind && selState.id === id;
  const allFilled = fillState.len > 0 && fillState.filled === fillState.len;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={hint}
      chip={phase === 'watch' ? `👁 ${t.watchTag}` : storyTitle ? `📖 ${storyTitle}` : '📖'}
      chipStyle={{ fontSize: '0.62rem', fontWeight: 800, color: '#e8ac4e', maxWidth: 150, whiteSpace: 'normal', lineHeight: 1.1 }}
      stats={stats}
      banner={banner === 'go' ? t.go : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
    >
      {phase === 'watch' && (
        <div className="c3d-overlay-actions">
          <button type="button" className="c3d-choice-btn" disabled={watchPos.i === 0} onClick={() => apiRef.current.watchNav?.(-1)}>{t.prev}</button>
          <button type="button" className="c3d-choice-btn" onClick={() => apiRef.current.doneMemo?.()}>{t.doneMemo}</button>
          <button type="button" className="c3d-choice-btn" disabled={watchPos.i >= watchPos.n - 1} onClick={() => apiRef.current.watchNav?.(1)}>{t.next}</button>
        </div>
      )}
      {phase === 'rebuild' && palettes && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'stretch', maxWidth: 560, margin: '0 auto', padding: '4px 6px', background: 'rgba(10,8,5,0.6)', borderRadius: 14 }}>
          <div style={dockRow}>
            <span style={dockLabel}>📍 {t.places}</span>
            {palettes.bgs.map((b) => (
              <button key={b.id} type="button" style={chipBtn(isSel('bg', b.id))} onClick={() => apiRef.current.pickSel?.('bg', b.id)}>
                {b.chip} {b.name}
              </button>
            ))}
          </div>
          <div style={dockRow}>
            <span style={dockLabel}>🙂 {t.characters}</span>
            {palettes.chars.map((cch) => (
              <button key={cch.id} type="button" style={chipBtn(isSel('char', cch.id))} onClick={() => apiRef.current.pickSel?.('char', cch.id)}>
                {cch.e} {cch.name}
              </button>
            ))}
          </div>
          <div style={dockRow}>
            <span style={dockLabel}>⚡ {t.actions}</span>
            {palettes.actions.map((a) => (
              <button key={a.id} type="button" style={chipBtn(isSel('action', a.id))} onClick={() => apiRef.current.pickSel?.('action', a.id)}>
                {a.e} {a.name}
              </button>
            ))}
            <button type="button" style={chipBtn(isSel('erase', 'x'))} onClick={() => apiRef.current.pickSel?.('erase', 'x')}>
              🧽 {t.erase}
            </button>
            <button
              type="button"
              style={{ ...chipBtn(false), background: allFilled ? '#e8ac4e' : 'rgba(20,16,10,0.72)', color: allFilled ? '#1a1208' : 'rgba(240,226,192,0.45)', fontWeight: 800 }}
              disabled={!allFilled}
              onClick={() => apiRef.current.check?.()}
            >
              {allFilled ? t.check : `${t.check} · ${fillState.filled}/${fillState.len}`}
            </button>
          </div>
        </div>
      )}
      {phase === 'reveal' && (
        <div className="c3d-overlay-actions">
          <button type="button" className="c3d-cta" onClick={() => apiRef.current.advanceRound?.()}>{t.cont}</button>
        </div>
      )}
    </C3dProtoChrome>
  );
}
