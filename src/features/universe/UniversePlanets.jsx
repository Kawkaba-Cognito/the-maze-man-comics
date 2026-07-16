import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlass, X as XIcon } from '@phosphor-icons/react';
import {
  PLANET_TYPES, JOURNAL_MOODS,
  loadPlanets, savePlanets, createPlanet,
} from './universeStore';
import { planetIconUrl } from '../../lib/planetIcons';
import ArtisticReveal from './ArtisticReveal';

const DRAG_THRESHOLD = 12; // px of movement before a tap becomes a drag — generous enough for real-finger jitter on touchscreens, not just mouse precision

/** Shared icon badge — real rendered art when available, mood/emoji fallback otherwise. */
function PlanetIconBadge({ type, mood, meta, size = 40, glow = true }) {
  const iconUrl = planetIconUrl(type);
  const showMood = type === 'journal' && mood;
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.44,
      background: showMood || !iconUrl
        ? `radial-gradient(circle at 35% 30%, #fff9, ${meta.color})`
        : `radial-gradient(circle, ${meta.color}4a 0%, ${meta.color}1f 55%, transparent 76%)`,
      boxShadow: glow ? `0 0 14px ${meta.color}99` : 'none',
    }}>
      {showMood ? mood : iconUrl ? (
        <img
          src={iconUrl}
          alt=""
          draggable={false}
          style={{
            width: '78%', height: '78%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
            pointerEvents: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none', userSelect: 'none',
          }}
        />
      ) : meta.icon}
    </span>
  );
}

/*
 * The planet's VISUAL lives in the ZenUniverse 3D layer (a colored particle
 * sphere at the same % position). This DOM button is just the invisible hit
 * area for drag/tap plus the floating label under it.
 */
function Planet({ planet, isAr, onPointerDownPlanet, dragging }) {
  const meta = PLANET_TYPES[planet.type] || PLANET_TYPES.note;
  const label = planet.title || (isAr ? meta.ar : meta.en);
  return (
    <button
      type="button"
      className={dragging ? 'u-planet-dragging' : ''}
      onPointerDown={(e) => onPointerDownPlanet(e, planet)}
      style={{
        position: 'absolute',
        left: `${planet.x}%`,
        top: `${planet.y}%`,
        transform: 'translate(-50%,-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        width: 84, height: 108, paddingBottom: 2,
        background: 'none', border: 'none', cursor: 'grab',
        touchAction: 'none', zIndex: dragging ? 20 : 3,
        transition: 'none',
      }}
      aria-label={label}
    >
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#f3ecd8', textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        opacity: planet.type === 'goal' && planet.done ? 0.6 : 1,
        textDecoration: planet.type === 'goal' && planet.done ? 'line-through' : 'none',
        filter: dragging ? `drop-shadow(0 0 8px ${meta.color})` : 'none',
      }}>
        {label}
      </span>
    </button>
  );
}

function Sheet({ children, onClose }) {
  // Portalled to <body> — #ui-shell establishes its own stacking context
  // (position:absolute + a non-auto z-index), which traps any
  // position:fixed descendant below the independently-fixed bottom tab bar
  // no matter how high its own z-index is. Escaping to body is the fix.
  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="u-sheet-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(6,4,12,0.55)',
        backdropFilter: 'blur(10px) saturate(1.3)', WebkitBackdropFilter: 'blur(10px) saturate(1.3)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="u-sheet-pop"
        style={{
          width: '100%', maxWidth: 460,
          background: 'linear-gradient(165deg, #2b2140 0%, #1a1329 55%, #140e21 100%)',
          borderRadius: '26px 26px 0 0',
          borderWidth: '1px 1px 0 1px', borderStyle: 'solid', borderColor: 'rgba(232,172,78,0.32)',
          padding: '10px 20px calc(22px + env(safe-area-inset-bottom))', boxSizing: 'border-box',
          maxHeight: '84vh', overflowY: 'auto',
          boxShadow: '0 -18px 50px rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.06) inset',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(232,172,78,0.35)', margin: '0 auto 16px' }} />
        {children}
      </div>
    </div>,
    document.body,
  );
}

function TypePicker({ isAr, onPick, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center', color: '#f3ecd8', fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
        {isAr ? 'أضف كوكباً جديداً' : 'Add a new planet'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Object.entries(PLANET_TYPES).map(([type, meta]) => (
          <button
            key={type}
            type="button"
            onClick={() => onPick(type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderRadius: 16, border: `1px solid ${meta.color}55`,
              background: `linear-gradient(160deg, ${meta.color}26 0%, rgba(255,255,255,0.04) 100%)`,
              cursor: 'pointer', textAlign: isAr ? 'right' : 'left',
            }}
          >
            <PlanetIconBadge type={type} meta={meta} size={44} />
            <span>
              <div style={{ fontWeight: 800, color: '#f3ecd8', fontSize: 14.5 }}>{isAr ? meta.ar : meta.en}</div>
              <div style={{ fontSize: 12, color: '#b9a878', marginTop: 1 }}>{isAr ? meta.promptAr : meta.promptEn}</div>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function ListSheet({ isAr, planets, onOpenPlanet, onClose }) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return planets
      .filter((p) => filterType === 'all' || p.type === filterType)
      .filter((p) => !q || (p.title || '').toLowerCase().includes(q) || (p.body || '').toLowerCase().includes(q))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [planets, query, filterType]);

  const typeTabs = [
    { id: 'all', en: 'All', ar: 'الكل' },
    ...Object.entries(PLANET_TYPES).map(([id, meta]) => ({ id, en: meta.en, ar: meta.ar })),
  ];

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: '#f3ecd8', fontSize: 16 }}>{isAr ? 'كل الكواكب' : 'All planets'}</div>
        <button type="button" onClick={onClose} aria-label={isAr ? 'إغلاق' : 'Close'} style={{ background: 'none', border: 'none', color: '#b9a878', cursor: 'pointer', display: 'flex' }}>
          <XIcon size={20} />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <MagnifyingGlass size={16} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: '#b9a878', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAr ? 'ابحث في العناوين والنصوص...' : 'Search titles and notes...'}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '10px 13px 10px 36px',
            borderRadius: 10, border: '2px solid rgba(232,172,78,0.28)', background: 'rgba(0,0,0,0.25)',
            color: '#f0e2c0', font: '600 13.5px Outfit, sans-serif',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {typeTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilterType(t.id)}
            style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: filterType === t.id ? '2px solid #e8ac4e' : '2px solid rgba(232,172,78,0.2)',
              background: filterType === t.id ? 'rgba(232,172,78,0.22)' : 'rgba(255,255,255,0.05)',
              color: filterType === t.id ? '#f5c44a' : '#b9a878',
            }}
          >
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8a7f6f', fontSize: 13.5, padding: '24px 0' }}>
          {isAr ? 'لا توجد نتائج.' : 'Nothing found.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((p) => {
            const meta = PLANET_TYPES[p.type] || PLANET_TYPES.note;
            const label = p.title || (isAr ? meta.ar : meta.en);
            const date = new Date(p.createdAt || Date.now()).toLocaleDateString(isAr ? 'ar' : 'en-US', { month: 'short', day: 'numeric' });
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPlanet(p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12,
                  border: `1px solid ${meta.color}40`, background: `linear-gradient(160deg, ${meta.color}1a 0%, rgba(255,255,255,0.03) 100%)`,
                  cursor: 'pointer', textAlign: isAr ? 'right' : 'left', width: '100%', boxSizing: 'border-box',
                }}
              >
                <PlanetIconBadge type={p.type} mood={p.mood} meta={meta} size={34} glow={false} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800, color: '#f3ecd8', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: p.type === 'goal' && p.done ? 'line-through' : 'none', opacity: p.type === 'goal' && p.done ? 0.6 : 1,
                  }}>
                    {label}
                  </div>
                  {p.body && (
                    <div style={{ fontSize: 11.5, color: '#a89878', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.body}
                    </div>
                  )}
                </span>
                <span style={{ fontSize: 10.5, color: '#8a7f6f', flexShrink: 0 }}>{date}</span>
              </button>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function PlanetForm({ isAr, type, initial, onSave, onDelete, onClose, playSfx }) {
  const meta = PLANET_TYPES[type];
  const [title, setTitle] = useState(initial?.title || '');
  const [body, setBody] = useState(initial?.body || '');
  const [done, setDone] = useState(!!initial?.done);
  const [mood, setMood] = useState(initial?.mood || JOURNAL_MOODS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEdit = !!initial;

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 10,
    border: '2px solid rgba(232,172,78,0.28)', background: 'rgba(0,0,0,0.25)',
    color: '#f0e2c0', font: '700 14px Outfit, sans-serif', marginBottom: 10,
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <PlanetIconBadge type={type} mood={type === 'journal' ? mood : null} meta={meta} size={40} />
        <div style={{ fontWeight: 800, color: '#f3ecd8', fontSize: 16 }}>{isAr ? meta.ar : meta.en}</div>
      </div>

      {type === 'journal' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {JOURNAL_MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              style={{
                width: 40, height: 40, borderRadius: '50%', fontSize: 19, cursor: 'pointer',
                border: mood === m ? '2px solid #e8ac4e' : '2px solid rgba(232,172,78,0.2)',
                background: mood === m ? 'rgba(232,172,78,0.22)' : 'rgba(255,255,255,0.05)',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {type !== 'journal' && (
        <input
          style={inputStyle}
          placeholder={isAr ? 'العنوان' : 'Title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={40}
        />
      )}

      <textarea
        style={{ ...inputStyle, minHeight: 90, resize: 'vertical', fontWeight: 500 }}
        placeholder={isAr ? meta.promptAr : meta.promptEn}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={600}
      />

      {type === 'goal' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e8dcc0', fontSize: 13.5, fontWeight: 700, margin: '2px 0 14px' }}>
          <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} style={{ width: 18, height: 18 }} />
          {isAr ? 'تم تحقيقه' : 'Achieved'}
        </label>
      )}

      {confirmDelete ? (
        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <div style={{ color: '#f0b0a8', fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>
            {isAr ? 'هل أنت متأكد من الحذف؟ لا يمكن التراجع.' : "Delete this for good? Can't be undone."}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { playSfx?.('click'); onDelete(); }}
              style={{
                flex: 1, padding: '11px', borderRadius: 10, border: '2px solid rgba(220,90,80,0.5)',
                background: 'rgba(220,90,80,0.18)', color: '#ff9a8a', fontWeight: 800, cursor: 'pointer',
              }}
            >
              {isAr ? 'نعم، احذف' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{
                flex: 1, padding: '11px', borderRadius: 10, border: '2px solid rgba(232,172,78,0.3)',
                background: 'rgba(255,255,255,0.06)', color: '#f0e2c0', fontWeight: 800, cursor: 'pointer',
              }}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {isEdit && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '12px 16px', borderRadius: 10, border: '2px solid rgba(220,90,80,0.35)',
                background: 'rgba(220,90,80,0.1)', color: '#ff9a8a', fontWeight: 800, cursor: 'pointer',
              }}
              aria-label={isAr ? 'حذف' : 'Delete'}
            >
              🗑
            </button>
          )}
          <button
            type="button"
            onClick={() => { playSfx?.('click'); onSave({ title, body, done, mood }); }}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(180deg, #f5c44a, #e8a830)', color: '#1a1208',
              fontWeight: 800, cursor: 'pointer', fontSize: 14.5,
            }}
          >
            {isEdit ? (isAr ? 'حفظ' : 'Save') : (isAr ? 'إضافة إلى الكون' : 'Add to your universe')}
          </button>
        </div>
      )}
    </Sheet>
  );
}

// Planets within this % distance get a constellation line drawn between them.
const LINK_DIST = 24;
// How close (in % units) a dragged planet has to get to Kawkab's spot before he reacts.
const KAWKAB_X = 50;
const KAWKAB_Y = 52;
const KAWKAB_RADIUS = 15;

export default function UniversePlanets({ isAr, playSfx, onDragProximity, onPlanetsChange, onDissolve, onReform }) {
  const [planets, setPlanets] = useState(() => loadPlanets());
  const [sheet, setSheet] = useState(null); // null | 'pick' | 'list' | {mode, type, planet}
  const dragRef = useRef(null); // { id, startX, startY, moved, startPctX, startPctY, samples }
  const [draggingId, setDraggingId] = useState(null);
  const glideRef = useRef(null); // rAF id of the current inertia glide
  const revealTimerRef = useRef(null); // tap -> dissolve -> reveal delay

  useEffect(() => { savePlanets(planets); }, [planets]);
  // Mirror positions/colors into the ZenUniverse 3D layer, which draws the orbs.
  useEffect(() => {
    onPlanetsChange?.(planets.map((p) => ({
      id: p.id, x: p.x, y: p.y,
      color: (PLANET_TYPES[p.type] || PLANET_TYPES.note).color,
    })));
  }, [planets, onPlanetsChange]);
  useEffect(() => () => {
    if (glideRef.current) cancelAnimationFrame(glideRef.current);
    clearTimeout(revealTimerRef.current);
  }, []);

  function stopGlide() {
    if (glideRef.current) { cancelAnimationFrame(glideRef.current); glideRef.current = null; }
  }

  function onPointerDownPlanet(e, planet) {
    e.stopPropagation();
    e.preventDefault();
    stopGlide();
    // Pointer capture keeps every subsequent move/up/cancel routed to this
    // element even if the finger drifts off it — without it, mobile touch
    // sequences can lose the target mid-drag and silently drop the tap.
    try { e.target.setPointerCapture(e.pointerId); } catch { /* not supported */ }
    dragRef.current = {
      id: planet.id, startX: e.clientX, startY: e.clientY,
      startPctX: planet.x, startPctY: planet.y, moved: false,
      samples: [{ t: performance.now(), x: planet.x, y: planet.y }],
    };
    setDraggingId(planet.id);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    if (!d.moved) return;
    const pctX = clamp(d.startPctX + (dx / window.innerWidth) * 100, 6, 94);
    const pctY = clamp(d.startPctY + (dy / window.innerHeight) * 100, 14, 86);
    d.samples.push({ t: performance.now(), x: pctX, y: pctY });
    if (d.samples.length > 6) d.samples.shift();
    setPlanets((prev) => prev.map((p) => (p.id === d.id ? { ...p, x: pctX, y: pctY } : p)));
    onDragProximity?.(Math.hypot(pctX - KAWKAB_X, pctY - KAWKAB_Y) < KAWKAB_RADIUS);
  }

  function endDrag() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    setDraggingId(null);
    onDragProximity?.(false);
  }

  // On release, keep the planet drifting with its last swipe velocity —
  // friction decays it and it softly bounces off the safe-zone edges —
  // rather than just stopping dead where the finger lifted.
  function launchInertia(id, samples) {
    if (samples.length < 2) return;
    const a = samples[0];
    const b = samples[samples.length - 1];
    const dt = Math.max(1, b.t - a.t);
    let vx = ((b.x - a.x) / dt) * 16; // %/frame-ish, scaled for a satisfying glide
    let vy = ((b.y - a.y) / dt) * 16;
    if (Math.hypot(vx, vy) < 0.06) return; // too slow to bother — treat as a plain drop
    let x = b.x, y = b.y;
    const friction = 0.94;
    const step = () => {
      vx *= friction; vy *= friction;
      x += vx; y += vy;
      if (x < 6) { x = 6; vx *= -0.5; } else if (x > 94) { x = 94; vx *= -0.5; }
      if (y < 14) { y = 14; vy *= -0.5; } else if (y > 86) { y = 86; vy *= -0.5; }
      setPlanets((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));
      if (Math.hypot(vx, vy) > 0.02) {
        glideRef.current = requestAnimationFrame(step);
      } else {
        glideRef.current = null;
      }
    };
    glideRef.current = requestAnimationFrame(step);
  }

  function onPointerUp() {
    const d = dragRef.current;
    endDrag();
    if (d && !d.moved) {
      const planet = planets.find((p) => p.id === d.id);
      if (planet) {
        // Tap: the particle orb dissolves first, then the content materializes.
        playSfx?.('click');
        onDissolve?.(planet.id);
        clearTimeout(revealTimerRef.current);
        // The overlay mounts once the particles have mostly assembled into
        // the paper (morph runs ~1s in the 3D layer).
        revealTimerRef.current = setTimeout(() => {
          setSheet({ mode: 'reveal', type: planet.type, planet });
        }, 850);
      }
    } else if (d) {
      launchInertia(d.id, d.samples);
    }
    dragRef.current = null;
  }

  // Fires instead of pointerup when the browser hijacks the gesture (e.g. a
  // touch sequence interpreted as a scroll) — must still tear down the
  // listeners/drag state, just without treating it as a completed tap.
  function onPointerCancel() {
    endDrag();
    dragRef.current = null;
  }

  function handlePickType(type) {
    playSfx?.('click');
    setSheet({ mode: 'add', type });
  }

  function handleSaveNew(type, fields) {
    // The 3D layer spawns new planets by condensing them from stardust, so
    // no DOM birth effect is needed here anymore.
    setPlanets((prev) => [...prev, createPlanet(type, fields, prev)]);
    setSheet(null);
  }

  function handleSaveEdit(planet, fields) {
    setPlanets((prev) => prev.map((p) => (p.id === planet.id ? { ...p, ...fields } : p)));
    setSheet(null);
  }

  function handleDelete(planet) {
    // The 3D layer scatters the removed planet back to stardust.
    setPlanets((prev) => prev.filter((p) => p.id !== planet.id));
    setSheet(null);
  }

  const links = useMemo(() => {
    const out = [];
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const a = planets[i], b = planets[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK_DIST) {
          const active = draggingId === a.id || draggingId === b.id;
          out.push({ key: `${a.id}-${b.id}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, active, strength: 1 - dist / LINK_DIST });
        }
      }
    }
    return out;
  }, [planets, draggingId]);

  return (
    <>
      {links.length > 0 && (
        <svg aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
          {links.map((l) => (
            <line
              key={l.key}
              x1={`${l.x1}%`} y1={`${l.y1}%`} x2={`${l.x2}%`} y2={`${l.y2}%`}
              stroke={l.active ? 'rgba(245,196,74,0.75)' : `rgba(232,220,192,${0.1 + l.strength * 0.18})`}
              strokeWidth={l.active ? 1.4 : 1}
              strokeDasharray="1 6"
              className={l.active ? 'u-link-active' : 'u-link'}
            />
          ))}
        </svg>
      )}

      {planets.map((p) => (
        <Planet
          key={p.id}
          planet={p}
          isAr={isAr}
          dragging={draggingId === p.id}
          onPointerDownPlanet={onPointerDownPlanet}
        />
      ))}

      {planets.length > 0 && (
        <button
          type="button"
          onClick={() => { playSfx?.('click'); setSheet('list'); }}
          aria-label={isAr ? 'كل الكواكب' : 'All planets'}
          style={{
            position: 'absolute', right: 18, bottom: 'calc(166px + env(safe-area-inset-bottom))',
            width: 42, height: 42, borderRadius: '50%', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(36,28,56,0.88)', border: '2px solid rgba(232,172,78,0.4)',
            color: '#f5c44a', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <MagnifyingGlass size={19} weight="bold" />
        </button>
      )}

      <button
        type="button"
        onClick={() => { playSfx?.('click'); setSheet('pick'); }}
        aria-label={isAr ? 'أضف كوكباً' : 'Add a planet'}
        style={{
          position: 'absolute', right: 18, bottom: 'calc(104px + env(safe-area-inset-bottom))',
          width: 50, height: 50, borderRadius: '50%', zIndex: 6,
          background: 'linear-gradient(180deg, #f5c44a, #e8a830)', border: '2px solid rgba(26,18,8,0.4)',
          color: '#1a1208', fontSize: 24, fontWeight: 900, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(232,172,78,0.45)',
        }}
      >
        +
      </button>

      {sheet === 'pick' && (
        <TypePicker isAr={isAr} onPick={handlePickType} onClose={() => setSheet(null)} />
      )}
      {sheet === 'list' && (
        <ListSheet
          isAr={isAr}
          planets={planets}
          onOpenPlanet={(planet) => {
            playSfx?.('click');
            onDissolve?.(planet.id);
            setSheet({ mode: 'reveal', type: planet.type, planet });
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet && sheet.mode === 'reveal' && (
        <ArtisticReveal
          isAr={isAr}
          planet={sheet.planet}
          onEdit={() => {
            playSfx?.('click');
            onReform?.(sheet.planet.id);
            setSheet({ mode: 'edit', type: sheet.type, planet: sheet.planet });
          }}
          onClose={() => {
            onReform?.(sheet.planet.id);
            setSheet(null);
          }}
        />
      )}
      {sheet && sheet.mode === 'add' && (
        <PlanetForm
          isAr={isAr}
          type={sheet.type}
          playSfx={playSfx}
          onSave={(fields) => handleSaveNew(sheet.type, fields)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet && sheet.mode === 'edit' && (
        <PlanetForm
          isAr={isAr}
          type={sheet.type}
          initial={sheet.planet}
          playSfx={playSfx}
          onSave={(fields) => handleSaveEdit(sheet.planet, fields)}
          onDelete={() => handleDelete(sheet.planet)}
          onClose={() => setSheet(null)}
        />
      )}

      <style>{`
        .u-planet-dragging { cursor: grabbing; }
        .u-sheet-pop { animation: uSheetPop 0.32s cubic-bezier(0.2, 1, 0.3, 1) both; }
        @keyframes uSheetPop { from { transform: translateY(36px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .u-sheet-backdrop { animation: uSheetFade 0.22s ease-out both; }
        @keyframes uSheetFade { from { opacity: 0; } to { opacity: 1; } }
        .u-link { animation: uLinkShimmer 3.2s linear infinite; }
        .u-link-active { animation: uLinkShimmer 1s linear infinite; }
        @keyframes uLinkShimmer { to { stroke-dashoffset: -28; } }
        @media (prefers-reduced-motion: reduce) {
          .u-sheet-pop, .u-sheet-backdrop, .u-link, .u-link-active { animation: none !important; }
        }
      `}</style>
    </>
  );
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
