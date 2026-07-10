import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PLANET_TYPES, JOURNAL_MOODS,
  loadPlanets, savePlanets, createPlanet,
} from './universeStore';

const DRAG_THRESHOLD = 6; // px of movement before a tap becomes a drag

function Planet({ planet, isAr, onPointerDownPlanet, dragging }) {
  const meta = PLANET_TYPES[planet.type] || PLANET_TYPES.note;
  const label = planet.title || (isAr ? meta.ar : meta.en);
  return (
    <button
      type="button"
      className={`u-planet-spawn${dragging ? ' u-planet-dragging' : ''}`}
      onPointerDown={(e) => onPointerDownPlanet(e, planet)}
      style={{
        position: 'absolute',
        left: `${planet.x}%`,
        top: `${planet.y}%`,
        transform: 'translate(-50%,-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'grab', padding: 4,
        touchAction: 'none', zIndex: dragging ? 20 : 3,
        transition: dragging ? 'none' : 'left 0.18s ease, top 0.18s ease',
      }}
      aria-label={label}
    >
      <span
        className="u-planet-bob"
        style={{
          animationDelay: `-${(planet.id.charCodeAt(0) % 10) * 0.4}s`,
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          background: `radial-gradient(circle at 35% 30%, #fff9, ${meta.color})`,
          boxShadow: dragging
            ? `0 0 26px ${meta.color}, 0 0 8px #fff8 inset`
            : `0 0 14px ${meta.color}99, 0 0 3px #fff5 inset`,
          border: planet.type === 'goal' && planet.done ? '2px solid #8fe0a0' : 'none',
        }}
      >
        {planet.type === 'journal' && planet.mood ? planet.mood : meta.icon}
      </span>
      <span style={{
        fontSize: 9.5, fontWeight: 700, color: '#f3ecd8', textShadow: '0 1px 3px rgba(0,0,0,0.85)',
        maxWidth: 74, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        opacity: planet.type === 'goal' && planet.done ? 0.6 : 1,
        textDecoration: planet.type === 'goal' && planet.done ? 'line-through' : 'none',
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
      style={{
        position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(8,6,16,0.62)',
        backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="u-sheet-pop"
        style={{
          width: '100%', maxWidth: 460, background: 'linear-gradient(180deg, #241c38 0%, #150f24 100%)',
          borderRadius: '22px 22px 0 0', border: '1px solid rgba(232,172,78,0.28)', borderBottom: 'none',
          padding: '18px 20px calc(22px + env(safe-area-inset-bottom))', boxSizing: 'border-box',
          maxHeight: '82vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
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
            <span style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              background: `radial-gradient(circle at 35% 30%, #fff9, ${meta.color})`,
              boxShadow: `0 0 14px ${meta.color}99`,
            }}>
              {meta.icon}
            </span>
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
        <span style={{
          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, background: `radial-gradient(circle at 35% 30%, #fff9, ${meta.color})`,
          boxShadow: `0 0 14px ${meta.color}99`,
        }}>
          {type === 'journal' ? mood : meta.icon}
        </span>
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

export default function UniversePlanets({ isAr, playSfx }) {
  const [planets, setPlanets] = useState(() => loadPlanets());
  const [sheet, setSheet] = useState(null); // null | 'pick' | {mode, type, planet}
  const dragRef = useRef(null); // { id, startX, startY, moved, startPctX, startPctY }
  const [draggingId, setDraggingId] = useState(null);

  useEffect(() => { savePlanets(planets); }, [planets]);

  function onPointerDownPlanet(e, planet) {
    e.stopPropagation();
    dragRef.current = {
      id: planet.id, startX: e.clientX, startY: e.clientY,
      startPctX: planet.x, startPctY: planet.y, moved: false,
    };
    setDraggingId(planet.id);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
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
    setPlanets((prev) => prev.map((p) => (p.id === d.id ? { ...p, x: pctX, y: pctY } : p)));
  }

  function onPointerUp() {
    const d = dragRef.current;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    setDraggingId(null);
    if (d && !d.moved) {
      const planet = planets.find((p) => p.id === d.id);
      if (planet) { playSfx?.('click'); setSheet({ mode: 'edit', type: planet.type, planet }); }
    }
    dragRef.current = null;
  }

  function handlePickType(type) {
    playSfx?.('click');
    setSheet({ mode: 'add', type });
  }

  function handleSaveNew(type, fields) {
    setPlanets((prev) => [...prev, createPlanet(type, fields, prev)]);
    setSheet(null);
  }

  function handleSaveEdit(planet, fields) {
    setPlanets((prev) => prev.map((p) => (p.id === planet.id ? { ...p, ...fields } : p)));
    setSheet(null);
  }

  function handleDelete(planet) {
    setPlanets((prev) => prev.filter((p) => p.id !== planet.id));
    setSheet(null);
  }

  return (
    <>
      {planets.map((p) => (
        <Planet
          key={p.id}
          planet={p}
          isAr={isAr}
          dragging={draggingId === p.id}
          onPointerDownPlanet={onPointerDownPlanet}
        />
      ))}

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
        .u-planet-spawn { animation: uPlanetSpawn 0.42s cubic-bezier(0.2, 1.4, 0.4, 1) both; }
        @keyframes uPlanetSpawn { 0% { transform: translate(-50%,-50%) scale(0.2); opacity: 0; } 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; } }
        .u-planet-bob { animation: uPlanetBob 4.5s ease-in-out infinite; }
        @keyframes uPlanetBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .u-planet-dragging { cursor: grabbing; }
        .u-planet-dragging .u-planet-bob { animation: none; }
        .u-sheet-pop { animation: uSheetPop 0.22s ease-out both; }
        @keyframes uSheetPop { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .u-planet-spawn, .u-planet-bob, .u-sheet-pop { animation: none !important; }
        }
      `}</style>
    </>
  );
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
