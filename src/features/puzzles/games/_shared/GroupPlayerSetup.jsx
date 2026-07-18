import React, { useEffect, useState } from 'react';
import { createProfileStore } from '../../../../lib/storage';

const store = createProfileStore('mm_group_players_v1', {
  names: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
});

export function loadGroupPlayerNames(min = 2, max = 10) {
  const { names } = store.load();
  const list = Array.isArray(names) ? names.map((n) => String(n || '').trim()).filter(Boolean) : [];
  while (list.length < min) list.push(`Player ${list.length + 1}`);
  return list.slice(0, max);
}

export function saveGroupPlayerNames(names) {
  const cleaned = names.map((n, i) => String(n || '').trim() || `Player ${i + 1}`);
  store.save({ names: cleaned });
  return cleaned;
}

/**
 * Editable player name list (Pass n Play style) for Group Challenge.
 */
export default function GroupPlayerSetup({
  isAr,
  playSfx,
  players,
  onPlayersChange,
  min = 2,
  max = 10,
  label,
}) {
  const L = {
    players: label || (isAr ? `اللاعبون (${min}–${max})` : `Players (${min}–${max})`),
    add: isAr ? '＋ إضافة لاعب' : '＋ Add player',
    remove: isAr ? 'إزالة' : 'Remove',
  };

  const setName = (i, v) => onPlayersChange(players.map((x, j) => (j === i ? v : x)));

  return (
    <div className="gc-section">
      <div className="gc-label">{L.players}</div>
      <div className="gc-players">
        {players.map((nm, i) => (
          <div className="gc-player-row" key={i}>
            <input
              className="gc-player-input"
              value={nm}
              onChange={(e) => setName(i, e.target.value)}
              maxLength={20}
              aria-label={`${L.players} ${i + 1}`}
            />
            {players.length > min && (
              <button
                type="button"
                className="gc-player-x"
                aria-label={L.remove}
                onClick={() => {
                  playSfx?.('click');
                  onPlayersChange(players.filter((_, j) => j !== i));
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {players.length < max && (
          <button
            type="button"
            className="gc-add-player"
            onClick={() => {
              playSfx?.('click');
              onPlayersChange([...players, `Player ${players.length + 1}`]);
            }}
          >
            {L.add}
          </button>
        )}
      </div>
    </div>
  );
}

/** Hook: load/persist names for a group game lobby. */
export function useGroupPlayers(min = 2, max = 10) {
  const [players, setPlayers] = useState(() => loadGroupPlayerNames(min, max));

  useEffect(() => {
    if (players.length < min) {
      setPlayers((p) => {
        const next = [...p];
        while (next.length < min) next.push(`Player ${next.length + 1}`);
        return next;
      });
    }
  }, [players.length, min]);

  const commit = (list) => {
    const cleaned = saveGroupPlayerNames(list.slice(0, max));
    setPlayers(cleaned);
    return cleaned;
  };

  return [players, setPlayers, commit];
}
