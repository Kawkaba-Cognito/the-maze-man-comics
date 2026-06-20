import { createContext, useContext } from 'react';

export const PuzzleFrameContext = createContext(null);

export function usePuzzleFrame() {
  return useContext(PuzzleFrameContext);
}
