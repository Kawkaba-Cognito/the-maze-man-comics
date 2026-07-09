import React from 'react';
import { TrainingScreenShell } from '../../../../../shared/TrainingScreens';
import { CASE_FILE_CONFIG, CASE_FILE_VARIANTS } from './caseFileConfig';
import { PT } from './protoUtils';

export default function ProtoPicker({ isAr, playSfx, onPick, onBack }) {
  const t = isAr ? PT.ar : PT.en;
  const title = isAr ? 'تحسينات ملف القضية' : 'Case File Enhancements';
  const blurb = isAr
    ? 'جرّب ٣ تحسينات على نفس القضيتين. اختر المفضل لديك.'
    : 'Try 3 Case File enhancements on the same 2 cases. Pick your favourite.';

  return (
    <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack} title={title} tag={isAr ? 'مؤقت' : 'temporary'} hub>
      <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: '#5a4a32', lineHeight: 1.5, textAlign: 'center' }}>{blurb}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CASE_FILE_VARIANTS.map((id) => {
          const cfg = CASE_FILE_CONFIG[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => { playSfx?.('click'); onPick(id); }}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start', width: '100%', padding: '14px 16px',
                borderRadius: 14, border: '2px solid #d9c294', background: '#fbf3e4', cursor: 'pointer',
                textAlign: 'start', color: '#2d2210', boxShadow: '3px 3px 0 rgba(26,18,8,0.12)',
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{cfg.ic}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontWeight: 900, fontSize: 16 }}>{cfg.label[isAr ? 'ar' : 'en']}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#6a5a42', lineHeight: 1.45 }}>{cfg.blurb[isAr ? 'ar' : 'en']}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ margin: '16px 0 0', fontWeight: 700, fontSize: 12, color: '#a49a88', textAlign: 'center' }}>
        {isAr ? 'القضيتان: كعكة العرس · كعكات منتصف الليل' : 'Cases: Wedding Cake · Midnight Muffins'}
      </p>
    </TrainingScreenShell>
  );
}
