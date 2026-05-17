import React from 'react';

export default function MemoModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const items = [
    {
      k: 'free',
      ic: '♾️',
      lb: t.freeMode,
      hint: t.hubNodeFreeHint,
      on: onFree,
      mod: 'ct-fq-attn-mode--free',
    },
    {
      k: 'levels',
      ic: '🎯',
      lb: t.levelMode,
      hint: t.hubNodeLevelsHint,
      on: onLevels,
      mod: 'ct-fq-attn-mode--levels',
    },
    {
      k: 'chal',
      ic: '⚔️',
      lb: t.challengeMode,
      hint: t.hubNodeChallengeHint,
      on: onChallenge,
      mod: 'ct-fq-attn-mode--chal',
    },
  ];
  return (
    <div className="ct-fq-attn-modes" role="group" aria-label={t.hubMapAria}>
      {items.map((m) => (
        <button
          key={m.k}
          type="button"
          className={`ct-fq-attn-mode ${m.mod}`}
          onClick={() => {
            playSfx('click');
            m.on();
          }}
        >
          <span className="ct-fq-attn-mode-ic" aria-hidden="true">
            {m.ic}
          </span>
          <span className="ct-fq-attn-mode-body">
            <span className="ct-fq-attn-mode-lb">{m.lb}</span>
            <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>
              {m.hint}
            </span>
          </span>
          <span className="ct-fq-attn-mode-chev" aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}
