import { createProfileStore } from '../../../../../../lib/storage';

const store = createProfileStore('mm_stroop_profile_v1', {
  tel: [],
  done: {},
  bestFree: 0,
  bestStages: 0,
});

export const loadStroopProfile = store.load;
export const saveStroopProfile = store.save;
