import { createProfileStore } from '../../../../../../lib/storage';

const store = createProfileStore('mm_memo_span_v1');

export const loadMemoSpanProfile = store.load;
export const saveMemoSpanProfile = store.save;
