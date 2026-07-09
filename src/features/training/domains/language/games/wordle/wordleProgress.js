import { createProfileStore } from '../../../../../../lib/storage';

const store = createProfileStore('mm_wordle_profile_v1', {
  tel: [],
  done: {},
  bestFree: 0,
  bestStages: 0,
  bestFreeScore: 0,
});

export const loadWordleProfile = store.load;
export const saveWordleProfile = store.save;
