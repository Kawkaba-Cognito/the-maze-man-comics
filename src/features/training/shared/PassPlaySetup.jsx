import React from 'react';
import { Sword } from '@phosphor-icons/react';

/**
 * Shared Pass n Play lobby — difficulty, players, rounds.
 * Used by ModeShell games and legacy hub games for one consistent look.
 */
export default function PassPlaySetup({
  isAr,
  playSfx,
  title,
  subtitle,
  showDifficulty = true,
  diffKeys = ['easy', 'med', 'hard'],
  diffLabels = {},
  diff,
  onDiffChange,
  players,
  onPlayersChange,
  rounds,
  onRoundsChange,
  roundOptions = [1, 2, 3, 4, 5],
  onStart,
  labels = {},
}) {
  const L = {
    title: isAr ? 'مرّر والعب' : 'Pass n Play',
    difficulty: isAr ? 'الصعوبة' : 'Difficulty',
    players: isAr ? 'اللاعبون (2–10)' : 'Players (2–10)',
    addPlayer: isAr ? '＋ إضافة لاعب' : '＋ Add player',
    rounds: isAr ? 'الجولات' : 'Rounds',
    roundsHint: isAr
      ? 'نفس التحدي لكل اللاعبين في كل جولة · مرّر الجهاز'
      : 'Same challenge for every player each round · pass the device',
    start: <><Sword size="1em" weight="fill" style={{ verticalAlign: '-0.15em', marginInlineEnd: 6 }} />{isAr ? 'ابدأ' : 'Start'}</>,
    ...labels,
  };

  const heroTitle = title ?? L.title;
  const heroSub = subtitle ?? L.subtitle ?? (isAr
    ? 'نفس اللوحة للجميع · اختر الصعوبة · الأفضل يفوز'
    : 'Same board for everyone · pick a difficulty · best score wins');

  const diffLabel = (k) => {
    const d = diffLabels[k];
    if (!d) return k;
    if (typeof d === 'string') return d;
    return d.label ?? (isAr ? d.ar : d.en) ?? k;
  };

  const setName = (i, v) => onPlayersChange(players.map((x, j) => (j === i ? v : x)));

  return (
    <div className="ct-pp-setup" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="ct-pp-hero-title">{heroTitle}</h1>
      <p className="ct-pp-hero-sub">{heroSub}</p>

      <div className="ct-pp-card">
        {showDifficulty && onDiffChange && (
          <>
            <div className="ct-pp-sec">{L.difficulty}</div>
            <div className="ct-pp-diff" role="group" aria-label={L.difficulty}>
              {diffKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`ct-pp-pill${diff === k ? ' sel' : ''}`}
                  onClick={() => { playSfx?.('click'); onDiffChange(k); }}
                >
                  {diffLabel(k)}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="ct-pp-sec">{L.players}</div>
        {players.map((nm, i) => (
          <div className="ct-pp-row" key={i}>
            <input
              className="ct-pp-input"
              value={nm}
              onChange={(e) => setName(i, e.target.value)}
              maxLength={20}
              aria-label={`${L.players} ${i + 1}`}
            />
            {players.length > 2 && (
              <button
                type="button"
                className="ct-pp-x"
                aria-label={isAr ? 'إزالة' : 'Remove'}
                onClick={() => { playSfx?.('click'); onPlayersChange(players.filter((_, j) => j !== i)); }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {players.length < 10 && (
          <button
            type="button"
            className="ct-pp-add"
            onClick={() => { playSfx?.('click'); onPlayersChange([...players, `Player ${players.length + 1}`]); }}
          >
            {L.addPlayer}
          </button>
        )}

        <div className="ct-pp-sec">{L.rounds}</div>
        {L.roundsHint ? <p className="ct-pp-hint">{L.roundsHint}</p> : null}
        <div className="ct-pp-rounds" role="group" aria-label={L.rounds}>
          {roundOptions.map((r) => (
            <button
              key={r}
              type="button"
              className={`ct-pp-round${rounds === r ? ' sel' : ''}`}
              onClick={() => { playSfx?.('click'); onRoundsChange(r); }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="ct-training-btn ct-training-btn--start ct-pp-start" onClick={onStart}>
        {L.start}
      </button>
    </div>
  );
}
