import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { getPuzzle } from '../registry';
import { generateTakuzu, cycleTakuzuCell, isTakuzuSolved } from '../games/takuzu/takuzuEngine';
import { generateKenKen, setKenKenCell, isKenKenSolved, kenKenConflicts } from '../games/kenken/kenkenEngine';
import { generateHitori, toggleHitoriCell, isHitoriSolved } from '../games/hitori/hitoriEngine';
import { generateBridges, cycleBridgeByIslands, isBridgesSolved, findEdgeIndex } from '../games/bridges/bridgesEngine';
import { generateSudoku, setSudokuCell, isSudokuSolved, sudokuConflicts } from '../games/sudoku/sudokuEngine';
import BridgesBoard from '../games/bridges/BridgesBoard';
import { NumberPad } from '../shared/GridSizePicker';
import BlockBurst from '../games/blockburst';

function KenKenRecruitGrid({ state, setState, solved, isAr, playSfx, selected, setSelected }) {
  const size = state.size;
  const cageById = useMemo(
    () => Object.fromEntries((state.cages ?? []).map((c) => [c.id, c])),
    [state],
  );
  const conflicts = useMemo(
    () => (!solved ? kenKenConflicts(state) : new Set()),
    [state, solved],
  );

  const onCell = (r, c) => {
    playSfx('click');
    setSelected([r, c]);
  };
  const onPick = (n) => {
    if (!selected) return;
    playSfx('click');
    setState((s) => setKenKenCell(s, selected[0], selected[1], n));
  };

  return (
    <>
      <div className="mz-rec-puzzle-grid-wrap">
        <div className="ct-puzzle-grid ct-puzzle-grid--kenken mz-rec-puzzle-grid" style={{ '--puzzle-grid-n': size }}>
          {state.player.map((row, r) =>
            row.map((val, c) => {
              const cageId = state.cageMap[r][c];
              const cage = cageById[cageId];
              const leader = cage?.cells.reduce(
                (best, cell) => (cell[0] < best[0] || (cell[0] === best[0] && cell[1] < best[1]) ? cell : best),
                cage.cells[0],
              );
              const isLeader = leader?.[0] === r && leader?.[1] === c;
              const diff = (rr, cc) => rr < 0 || rr >= size || cc < 0 || cc >= size || state.cageMap[rr][cc] !== cageId;
              const edge = (cond) => (cond ? '2.5px solid #e0915a' : '1px solid rgba(255,255,255,0.12)');
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--num ct-puzzle-cell--kenken mz-rec-cell${
                    selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''
                  }${conflicts.has(`${r}-${c}`) ? ' ct-puzzle-cell--err-soft' : ''}`}
                  disabled={solved}
                  style={{
                    borderTop: edge(diff(r - 1, c)),
                    borderBottom: edge(diff(r + 1, c)),
                    borderLeft: edge(diff(r, c - 1)),
                    borderRight: edge(diff(r, c + 1)),
                  }}
                  onClick={() => onCell(r, c)}
                >
                  {isLeader ? <span className="ct-puzzle-cage-label">{cage.target}{cage.op}</span> : null}
                  <span>{val || ''}</span>
                </button>
              );
            }),
          )}
        </div>
      </div>
      <NumberPad max={size} selected={selected} isAr={isAr} playSfx={playSfx} onPick={onPick} onClear={() => onPick(0)} />
    </>
  );
}

function GridRecruit({ spec, onSolved, frozen }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const { puzzleKey, size, seed } = spec;
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (puzzleKey === 'takuzu') setState(generateTakuzu(size, seed));
    else if (puzzleKey === 'kenken') setState(generateKenKen(size, seed));
    else if (puzzleKey === 'hitori') setState(generateHitori(size, seed));
    else if (puzzleKey === 'bridges') setState(generateBridges(size, seed));
    else if (puzzleKey === 'sudoku') setState(generateSudoku(size, seed));
    setSolved(false);
    setSelected(null);
  }, [puzzleKey, size, seed]);

  useEffect(() => {
    if (frozen || !state || solved) return;
    let ok = false;
    if (puzzleKey === 'takuzu') ok = isTakuzuSolved(state);
    else if (puzzleKey === 'kenken') ok = isKenKenSolved(state);
    else if (puzzleKey === 'hitori') ok = isHitoriSolved(state);
    else if (puzzleKey === 'bridges') ok = isBridgesSolved(state);
    else if (puzzleKey === 'sudoku') ok = isSudokuSolved(state);
    if (ok) {
      setSolved(true);
      playSfx('win');
      onSolved?.();
    }
  }, [state, puzzleKey, solved, frozen, onSolved, playSfx]);

  if (!state) return null;

  if (puzzleKey === 'kenken') {
    return (
      <KenKenRecruitGrid
        state={state}
        setState={setState}
        solved={solved || frozen}
        isAr={isAr}
        playSfx={playSfx}
        selected={selected}
        setSelected={setSelected}
      />
    );
  }

  if (puzzleKey === 'bridges') {
    const onIslandTap = (id) => {
      if (solved || frozen) return;
      if (selected == null) {
        setSelected(id);
        playSfx('click');
        return;
      }
      if (selected === id) {
        setSelected(null);
        playSfx('click');
        return;
      }
      if (findEdgeIndex(state, selected, id) < 0) {
        setSelected(id);
        playSfx('click');
        return;
      }
      const next = cycleBridgeByIslands(state, selected, id);
      setSelected(null);
      if (next === state) playSfx('error');
      else {
        setState(next);
        playSfx('click');
      }
    };
    return (
      <div className="mz-rec-bridges">
        <BridgesBoard
          state={state}
          selected={selected}
          solved={solved || frozen}
          onIslandTap={onIslandTap}
        />
      </div>
    );
  }

  if (puzzleKey === 'takuzu') {
    return (
      <div className="mz-rec-puzzle-grid-wrap">
        <div className={`ct-puzzle-grid ct-puzzle-grid--takuzu mz-rec-puzzle-grid ct-puzzle-grid--n${size}`} style={{ '--puzzle-grid-n': size }}>
          {state.player.map((row, r) =>
            row.map((val, c) => {
              const fixed = state.fixed[r][c];
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--takuzu mz-rec-cell${
                    val === 0 ? ' ct-puzzle-cell--t0' : val === 1 ? ' ct-puzzle-cell--t1' : ''
                  }${fixed ? ' ct-puzzle-cell--takuzu-fixed' : ''}`}
                  disabled={(solved || frozen) || fixed}
                  onClick={() => {
                    playSfx('click');
                    setState((s) => cycleTakuzuCell(s, r, c));
                  }}
                >
                  {val == null ? '' : val}
                </button>
              );
            }),
          )}
        </div>
      </div>
    );
  }

  if (puzzleKey === 'sudoku') {
    const conflicts = sudokuConflicts(state);
    return (
      <>
        <div className="mz-rec-puzzle-grid-wrap">
          <div className="ct-puzzle-grid ct-puzzle-grid--sudoku mz-rec-puzzle-grid" style={{ '--puzzle-grid-n': size }}>
            {state.player.map((row, r) =>
              row.map((val, c) => {
                const fixed = state.fixed[r][c];
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`ct-puzzle-cell ct-puzzle-cell--num mz-rec-cell${
                      selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''
                    }${conflicts.has(`${r}-${c}`) ? ' ct-puzzle-cell--err-soft' : ''}${fixed ? ' ct-puzzle-cell--fixed' : ''}`}
                    disabled={(solved || frozen) || fixed}
                    onClick={() => { playSfx('click'); setSelected([r, c]); }}
                  >
                    {val || ''}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <NumberPad
          max={size}
          selected={selected}
          isAr={isAr}
          playSfx={playSfx}
          onPick={(n) => {
            if (!selected) return;
            playSfx('click');
            setState((s) => setSudokuCell(s, selected[0], selected[1], n));
          }}
          onClear={() => {
            if (!selected) return;
            setState((s) => setSudokuCell(s, selected[0], selected[1], 0));
          }}
        />
      </>
    );
  }

  if (puzzleKey === 'hitori') {
    return (
      <div className="mz-rec-puzzle-grid-wrap">
        <div className="ct-puzzle-grid ct-puzzle-grid--hitori mz-rec-puzzle-grid" style={{ '--puzzle-grid-n': size }}>
          {state.numbers.map((row, r) =>
            row.map((num, c) => {
              const shaded = state.player[r][c];
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--hitori mz-rec-cell${shaded ? ' ct-puzzle-cell--shaded' : ''}`}
                  disabled={solved || frozen}
                  onClick={() => {
                    playSfx('click');
                    setState((s) => toggleHitoriCell(s, r, c));
                  }}
                >
                  {shaded ? '' : num}
                </button>
              );
            }),
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default function RecruitPuzzle({ spec, onSolved, frozen }) {
  const cfg = getPuzzle(spec.puzzleKey);

  if (spec.puzzleKey === 'blockburst') {
    return (
      <div className="mz-rec-blockburst">
        <BlockBurst
          recruitMode={{ targetScore: spec.targetScore }}
          onSolved={onSolved}
          onBack={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="mz-rec-puzzle" data-puzzle={spec.puzzleKey}>
      <div className="mz-rec-puzzle-tag">{cfg?.icon} {spec.size}×{spec.size}</div>
      <GridRecruit spec={spec} onSolved={onSolved} frozen={frozen} />
    </div>
  );
}
