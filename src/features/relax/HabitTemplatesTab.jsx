import React, { useMemo, useState } from 'react';
import {
  LIFE_DOMAINS, HABIT_TEMPLATES, getTemplatesByDomain,
  isTemplateAdded, addTemplateAsHabit, domainById,
} from './habitState';

const INK = '#2d2210';
const SUB = '#8a7f6f';
const LINE = '#e3d6c4';
const CARD = '#fffdf8';
const GOLD = '#b9842f';

export default function HabitTemplatesTab({ isAr, st, setSt, playSfx }) {
  const [domain, setDomain] = useState('all');

  const templates = useMemo(() => {
    if (domain === 'all') return HABIT_TEMPLATES;
    return getTemplatesByDomain(domain);
  }, [domain]);

  const t = {
    title: isAr ? 'مكتبة العادات' : 'Habit library',
    sub: isAr ? 'قوالب جاهزة — اختر واحدة وابدأ صغيراً.' : 'Ready-made templates — pick one, start tiny.',
    all: isAr ? 'الكل' : 'All',
    add: isAr ? 'إضافة' : 'Add',
    added: isAr ? 'مضافة' : 'Added',
  };

  const onAdd = (id) => {
    playSfx?.('collect');
    setSt(addTemplateAsHabit(id));
  };

  return (
    <div className="hb-templates">
      <div className="hb-section-title">{t.title}</div>
      <p className="hb-life-hint">{t.sub}</p>
      <div className="hb-tpl-domains">
        <button type="button" className={`hb-tpl-dom${domain === 'all' ? ' on' : ''}`} onClick={() => setDomain('all')}>{t.all}</button>
        {LIFE_DOMAINS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`hb-tpl-dom${domain === d.id ? ' on' : ''}`}
            onClick={() => setDomain(d.id)}
            title={isAr ? d.ar : d.en}
          >
            {d.icon}
          </button>
        ))}
      </div>
      <div className="hb-tpl-list">
        {templates.map((tpl) => {
          const dom = domainById(tpl.domain);
          const added = isTemplateAdded(tpl.id, st);
          const title = isAr ? tpl.titleAr : tpl.titleEn;
          const tiny = isAr ? tpl.tinyAr : tpl.tinyEn;
          return (
            <div key={tpl.id} className="hb-tpl-card" style={{ borderColor: `${dom.color}55` }}>
              <div className="hb-tpl-body">
                <div className="hb-tpl-title">{tpl.icon} {title}</div>
                <div className="hb-tpl-domain" style={{ color: dom.color }}>{isAr ? dom.ar : dom.en}</div>
                <div className="hb-tpl-tiny">{tiny}</div>
              </div>
              <button
                type="button"
                className={`hb-tpl-add${added ? ' done' : ''}`}
                disabled={added}
                style={{ color: dom.color }}
                onClick={() => onAdd(tpl.id)}
              >
                {added ? t.added : `+ ${t.add}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const TEMPLATES_TAB_CSS = `
.hb-tpl-domains { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
.hb-tpl-dom { padding:8px 12px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; font-size:14px; cursor:pointer; font-family:inherit; color:${SUB}; font-weight:700; }
.hb-tpl-dom.on { border-color:${GOLD}; background:#fff8ef; color:${INK}; }
.hb-tpl-list { display:flex; flex-direction:column; gap:8px; }
.hb-tpl-card { display:flex; align-items:center; gap:10px; background:${CARD}; border:2px solid ${LINE}; border-radius:12px; padding:12px; }
.hb-tpl-body { flex:1; min-width:0; }
.hb-tpl-title { font-size:14px; font-weight:800; color:${INK}; margin-bottom:2px; }
.hb-tpl-domain { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
.hb-tpl-tiny { font-size:12px; color:${SUB}; line-height:1.4; }
.hb-tpl-add { flex-shrink:0; padding:8px 12px; border-radius:10px; border:2px solid currentColor; background:#fffaf5; font-size:12px; font-weight:800; cursor:pointer; font-family:inherit; }
.hb-tpl-add.done { opacity:0.55; cursor:default; border-color:${LINE}; color:${SUB}; }
`;
