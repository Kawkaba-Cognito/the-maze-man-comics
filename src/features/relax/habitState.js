/**
 * Life habit system — Phase A foundation.
 * Identity-agnostic tracker with domains, if-then recipes, heatmap, grace days.
 */
import { loadWorkout, isDoneToday } from '../workout/workoutState';
import { timeToMinutes, nowMinutes } from '../workout/reminders';

export const HABIT_KEY = 'rx_habits_v2';
const HABIT_KEY_V1 = 'rx_habits_v1';
export const GRACE_PER_MONTH = 2;
export const FORMATION_DAYS = 66;

export const LIFE_DOMAINS = [
  { id: 'body', icon: '💪', color: '#5aa07a', en: 'Body', ar: 'الجسد' },
  { id: 'mind', icon: '🧠', color: '#5aa9c8', en: 'Mind', ar: 'العقل' },
  { id: 'relationships', icon: '❤️', color: '#c86f8f', en: 'Relationships', ar: 'العلاقات' },
  { id: 'work', icon: '🎯', color: '#e8ac4e', en: 'Work & Purpose', ar: 'العمل والغاية' },
  { id: 'rest', icon: '🌙', color: '#7b86c8', en: 'Rest & Joy', ar: 'الراحة والفرح' },
  { id: 'environment', icon: '🏠', color: '#b07ac8', en: 'Environment', ar: 'البيئة' },
  { id: 'money', icon: '💰', color: '#c9a24b', en: 'Money & Admin', ar: 'المال والإدارة' },
  { id: 'contribution', icon: '🤝', color: '#c47a3e', en: 'Contribution', ar: 'المساهمة' },
];

export const SKIP_REASONS = [
  { id: 'busy', en: 'Too busy today', ar: 'مشغول اليوم' },
  { id: 'travel', en: 'Traveling / away', ar: 'مسافر / بعيد' },
  { id: 'sick', en: 'Not feeling well', ar: 'لا أشعر بحالة جيدة' },
  { id: 'forgot', en: 'Forgot', ar: 'نسيت' },
  { id: 'other', en: 'Other reason', ar: 'سبب آخر' },
];

/** Preset templates — seeded as default habits on first run. */
export const HABIT_PRESETS = [
  {
    id: 'calm', domain: 'mind', icon: '🫁', color: '#5aa9c8',
    en: 'Calm moment', ar: 'لحظة هدوء',
    anchorEn: 'After I pause at my desk', anchorAr: 'بعد أن أتوقف عند مكتبي',
    tinyEn: 'Take 3 slow breaths', tinyAr: 'أخذ 3 أنفاس بطيئة',
    type: 'link', practiceId: 'breathe', frequency: 'daily',
  },
  {
    id: 'training', domain: 'mind', icon: '🧠', color: '#e8ac4e',
    en: 'Training', ar: 'تدريب',
    anchorEn: 'When I open the app', anchorAr: 'عندما أفتح التطبيق',
    tinyEn: 'Complete today\'s workout', tinyAr: 'أكمل تمرين اليوم',
    type: 'auto', source: 'workout', frequency: 'daily',
  },
  {
    id: 'mindful', domain: 'mind', icon: '🧘', color: '#c47a3e',
    en: 'Mindfulness', ar: 'يقظة',
    anchorEn: 'After I wake up', anchorAr: 'بعد أن أستيقظ',
    tinyEn: 'One minute of stillness', tinyAr: 'دقيقة واحدة من السكون',
    type: 'auto', source: 'mbsr', frequency: 'daily',
  },
  {
    id: 'water', domain: 'body', icon: '💧', color: '#5aa07a',
    en: 'Drink water', ar: 'شرب ماء',
    anchorEn: 'After I finish a meal', anchorAr: 'بعد أن أنهي وجبة',
    tinyEn: 'Drink one glass of water', tinyAr: 'أشرب كوباً واحداً من الماء',
    type: 'manual', frequency: 'daily',
  },
  {
    id: 'gratitude', domain: 'rest', icon: '✨', color: '#c9a24b',
    en: 'Gratitude', ar: 'امتنان',
    anchorEn: 'Before I go to sleep', anchorAr: 'قبل أن أنام',
    tinyEn: 'Write one thing I\'m thankful for', tinyAr: 'أكتب شيئاً واحداً أشكر عليه',
    type: 'link', practiceId: 'ikigai', frequency: 'daily',
  },
];
const DEFAULT_ACTIVE = ['calm', 'training', 'mindful', 'water'];
export const WHEEL_RECHECK_DAYS = 90;
export const MAX_IDENTITIES = 2;

export const IDENTITY_PRESETS = [
  { id: 'calm', icon: '🌿', en: 'A calm person', ar: 'شخص هادئ' },
  { id: 'learner', icon: '📚', en: 'A lifelong learner', ar: 'متعلّم مدى الحياة' },
  { id: 'healthy', icon: '💪', en: 'Someone who cares for their body', ar: 'من يعتني بجسده' },
  { id: 'present', icon: '❤️', en: 'A present partner & friend', ar: 'شريك وصديق حاضر' },
  { id: 'focused', icon: '🎯', en: 'A focused creator', ar: 'مبدع مركّز' },
  { id: 'generous', icon: '🤝', en: 'Someone who contributes', ar: 'من يساهم في مجتمعه' },
];

/** Wellbeing practices that also count toward the Calm moment habit. */
export const CALM_PRACTICES = new Set(['breathe', 'grounding', 'pmr', 'soundbath', 'nature']);

/** Curated template library — browse & add beyond presets. */
export const HABIT_TEMPLATES = [
  { id: 'tpl_bed', domain: 'body', icon: '🛏️', titleEn: 'Consistent bedtime', titleAr: 'وقت نوم ثابت', anchorEn: 'At 10pm', anchorAr: 'الساعة 10 مساءً', tinyEn: 'Put phone on charger outside bedroom', tinyAr: 'أضع الهاتف على الشاحن خارج الغرفة' },
  { id: 'tpl_floss', domain: 'body', icon: '🦷', titleEn: 'Floss', titleAr: 'خيط أسنان', anchorEn: 'After I brush my teeth at night', anchorAr: 'بعد تنظيف أسناني ليلاً', tinyEn: 'Floss one tooth', tinyAr: 'أستخدم الخيط على سن واحد' },
  { id: 'tpl_steps', domain: 'body', icon: '👟', titleEn: 'Daily steps', titleAr: 'خطوات يومية', anchorEn: 'After lunch', anchorAr: 'بعد الغداء', tinyEn: 'Walk for 5 minutes', tinyAr: 'أمشي 5 دقائق' },
  { id: 'tpl_journal', domain: 'mind', icon: '📝', titleEn: 'Brain dump', titleAr: 'تفريغ ذهني', anchorEn: 'Before I start work', anchorAr: 'قبل أن أبدأ العمل', tinyEn: 'Write 3 lines in a notebook', tinyAr: 'أكتب 3 أسطر في دفتر' },
  { id: 'tpl_nophone', domain: 'mind', icon: '📵', titleEn: 'Phone-free morning', titleAr: 'صباح بلا هاتف', anchorEn: 'When I wake up', anchorAr: 'عند الاستيقاظ', tinyEn: 'Wait 10 minutes before opening phone', tinyAr: 'أنتظر 10 دقائق قبل فتح الهاتف' },
  { id: 'tpl_read', domain: 'mind', icon: '📖', titleEn: 'Read daily', titleAr: 'قراءة يومية', anchorEn: 'After dinner', anchorAr: 'بعد العشاء', tinyEn: 'Read one page', tinyAr: 'أقرأ صفحة واحدة' },
  { id: 'tpl_call', domain: 'relationships', icon: '📞', titleEn: 'Check in', titleAr: 'تواصل', anchorEn: 'Every Sunday', anchorAr: 'كل أحد', tinyEn: 'Call or message one person I care about', tinyAr: 'أتصل أو أرسل لشخص أحب' },
  { id: 'tpl_hug', domain: 'relationships', icon: '🤗', titleEn: 'Quality moment', titleAr: 'لحظة quality', anchorEn: 'When I see someone I love', anchorAr: 'عندما أرى من أحب', tinyEn: 'Give full attention for 2 minutes', tinyAr: 'أمنح اهتماماً كاملاً لدقيقتين' },
  { id: 'tpl_deep', domain: 'work', icon: '🔒', titleEn: 'Deep work block', titleAr: 'عمل عميق', anchorEn: 'After morning coffee', anchorAr: 'بعد قهوة الصباح', tinyEn: '25 minutes on my top priority', tinyAr: '25 دقيقة على أولويتي' },
  { id: 'tpl_shutdown', domain: 'work', icon: '🌅', titleEn: 'Work shutdown', titleAr: 'إنهاء العمل', anchorEn: 'At end of workday', anchorAr: 'نهاية يوم العمل', tinyEn: 'Write tomorrow\'s top 1 task', tinyAr: 'أكتب مهمة الغد الأولى' },
  { id: 'tpl_hobby', domain: 'rest', icon: '🎨', titleEn: 'Creative play', titleAr: 'لعب إبداعي', anchorEn: 'After work', anchorAr: 'بعد العمل', tinyEn: '10 minutes on a hobby', tinyAr: '10 دقائق على هواية' },
  { id: 'tpl_nature', domain: 'rest', icon: '🌳', titleEn: 'Outside moment', titleAr: 'لحظة في الخارج', anchorEn: 'Before noon', anchorAr: 'قبل الظهر', tinyEn: 'Step outside for 2 minutes', tinyAr: 'أخرج للخارج دقيقتين' },
  { id: 'tpl_desk', domain: 'environment', icon: '🗂️', titleEn: 'Clear desk', titleAr: 'مكتب نظيف', anchorEn: 'Before I leave my desk', anchorAr: 'قبل مغادرة مكتبي', tinyEn: 'Put away 3 items', tinyAr: 'أرتب 3 أشياء' },
  { id: 'tpl_laundry', domain: 'environment', icon: '🧺', titleEn: 'One load', titleAr: 'غسلة واحدة', anchorEn: 'Every Saturday morning', anchorAr: 'صباح كل سبت', tinyEn: 'Start one laundry load', tinyAr: 'أبدأ غسلة واحدة' },
  { id: 'tpl_budget', domain: 'money', icon: '📊', titleEn: 'Weekly budget', titleAr: 'ميزانية أسبوعية', anchorEn: 'Sunday evening', anchorAr: 'مساء الأحد', tinyEn: 'Review last week\'s spending', tinyAr: 'أراجع مصاريف الأسبوع' },
  { id: 'tpl_save', domain: 'money', icon: '🏦', titleEn: 'Save something', titleAr: 'ادّخار', anchorEn: 'On payday', anchorAr: 'يوم الراتب', tinyEn: 'Move any amount to savings', tinyAr: 'أحوّل أي مبلغ للادّخار' },
  { id: 'tpl_help', domain: 'contribution', icon: '💝', titleEn: 'Help someone', titleAr: 'مساعدة', anchorEn: 'When I notice a need', anchorAr: 'عندما ألاحظ حاجة', tinyEn: 'Do one small helpful act', tinyAr: 'أقدّم مساعدة صغيرة' },
  { id: 'tpl_thanks', domain: 'contribution', icon: '🙏', titleEn: 'Thank someone', titleAr: 'شكر', anchorEn: 'Before bed', anchorAr: 'قبل النوم', tinyEn: 'Send one thank-you message', tinyAr: 'أرسل رسالة شكر واحدة' },
];

export const REFLECTION_QUESTIONS = [
  { id: 'easy', en: 'What habit felt easiest this week?', ar: 'أي عادة كانت الأسهل هذا الأسبوع؟' },
  { id: 'block', en: 'What got in the way?', ar: 'ما الذي عرقلك؟' },
  { id: 'adjust', en: 'One small adjustment for next week?', ar: 'تعديل صغير واحد للأسبوع القادم؟' },
];

/** Tiny habit ideas per domain — suggested when wheel scores are low. */
export const DOMAIN_SUGGESTIONS = {
  body: [
    { id: 'sug_stretch', titleEn: 'Morning stretch', titleAr: 'تمدّد صباحي', anchorEn: 'After I get out of bed', anchorAr: 'بعد أن أنهض من السرير', tinyEn: 'Stretch for 30 seconds', tinyAr: 'أتمدّد لمدة 30 ثانية' },
    { id: 'sug_walk', titleEn: 'Short walk', titleAr: 'مشي قصير', anchorEn: 'After I finish lunch', anchorAr: 'بعد الغداء', tinyEn: 'Walk for 5 minutes', tinyAr: 'أمشي 5 دقائق' },
  ],
  mind: [
    { id: 'sug_read', titleEn: 'Learn something', titleAr: 'تعلّم شيئاً', anchorEn: 'After I sit with my morning drink', anchorAr: 'بعد مشروبي الصباحي', tinyEn: 'Read or train for 5 minutes', tinyAr: 'أقرأ أو أتدرّب 5 دقائق' },
  ],
  relationships: [
    { id: 'sug_reach', titleEn: 'Reach out', titleAr: 'تواصل', anchorEn: 'After I finish dinner', anchorAr: 'بعد العشاء', tinyEn: 'Send one thoughtful message', tinyAr: 'أرسل رسالة لطيفة لشخص واحد' },
    { id: 'sug_listen', titleEn: 'Active listening', titleAr: 'استماع فعّال', anchorEn: 'When someone talks to me today', anchorAr: 'عندما يتحدث إليّ أحد', tinyEn: 'Put my phone away for one conversation', tinyAr: 'أبعد هاتفي في محادثة واحدة' },
  ],
  work: [
    { id: 'sug_plan', titleEn: 'Daily priority', titleAr: 'أولوية يومية', anchorEn: 'After I open my laptop', anchorAr: 'بعد أن أفتح حاسوبي', tinyEn: 'Write my top 1 priority', tinyAr: 'أكتب أولويتي الوحيدة لليوم' },
  ],
  rest: [
    { id: 'sug_play', titleEn: 'Joy break', titleAr: 'استراحة فرح', anchorEn: 'After I finish work', anchorAr: 'بعد انتهاء العمل', tinyEn: 'Do one thing just for fun', tinyAr: 'أفعل شيئاً للمتعة فقط' },
  ],
  environment: [
    { id: 'sug_tidy', titleEn: 'Tiny tidy', titleAr: 'ترتيب صغير', anchorEn: 'Before I leave a room', anchorAr: 'قبل أن أغادر غرفة', tinyEn: 'Put one thing back in place', tinyAr: 'أعيد شيئاً واحداً لمكانه' },
  ],
  money: [
    { id: 'sug_track', titleEn: 'Money check-in', titleAr: 'مراجعة مالية', anchorEn: 'Every Sunday morning', anchorAr: 'كل صباح أحد', tinyEn: 'Review spending for 2 minutes', tinyAr: 'أراجع مصاريفي لدقيقتين' },
  ],
  contribution: [
    { id: 'sug_kind', titleEn: 'Small kindness', titleAr: 'لطف صغير', anchorEn: 'When I notice someone struggling', anchorAr: 'عندما ألاحظ شخصاً يحتاج مساعدة', tinyEn: 'Offer one small help', tinyAr: 'أقدّم مساعدة صغيرة' },
  ],
};

export const todayKey = (d = new Date()) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const monthKey = (d = new Date()) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const uid = () => `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

function presetToHabit(p, active = true) {
  return {
    id: p.id,
    presetId: p.id,
    domain: p.domain,
    icon: p.icon,
    color: p.color,
    titleEn: p.en,
    titleAr: p.ar,
    anchorEn: p.anchorEn || '',
    anchorAr: p.anchorAr || '',
    tinyEn: p.tinyEn || p.en,
    tinyAr: p.tinyAr || p.ar,
    frequency: p.frequency || 'daily',
    daysOfWeek: p.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    active,
    type: p.type || 'manual',
    practiceId: p.practiceId || null,
    source: p.source || null,
    createdAt: todayKey(),
    reminderTime: p.reminderTime || null,
    stackAfter: null,
  };
}

function defaultSettings() {
  return {
    remindersEnabled: true,
    morningDigestEnabled: true,
    morningDigestTime: '08:00',
  };
}

function defaultLife() {
  return {
    identities: [],
    customIdentity: '',
    wheel: { scores: {}, lastCheck: null },
    reflections: {},
  };
}

function defaultState() {
  return {
    version: 4,
    habits: HABIT_PRESETS.map((p) => presetToHabit(p, DEFAULT_ACTIVE.includes(p.id))),
    log: {},
    graceUsed: {},
    life: defaultLife(),
    settings: defaultSettings(),
    reminderDismiss: {},
  };
}

function normalizeHabit(h) {
  return {
    ...h,
    reminderTime: h.reminderTime ?? null,
    stackAfter: h.stackAfter ?? null,
  };
}

function normalizeState(v) {
  const st = {
    version: 4,
    habits: (Array.isArray(v.habits) ? v.habits : HABIT_PRESETS.map((p) => presetToHabit(p, DEFAULT_ACTIVE.includes(p.id)))).map(normalizeHabit),
    log: v.log && typeof v.log === 'object' ? v.log : {},
    graceUsed: v.graceUsed && typeof v.graceUsed === 'object' ? v.graceUsed : {},
    life: { ...defaultLife(), ...(v.life && typeof v.life === 'object' ? v.life : {}) },
    settings: { ...defaultSettings(), ...(v.settings && typeof v.settings === 'object' ? v.settings : {}) },
    reminderDismiss: v.reminderDismiss && typeof v.reminderDismiss === 'object' ? v.reminderDismiss : {},
  };
  if (!st.life.wheel || typeof st.life.wheel !== 'object') st.life.wheel = { scores: {}, lastCheck: null };
  if (!st.life.wheel.scores) st.life.wheel.scores = {};
  if (!st.life.reflections) st.life.reflections = {};
  if (!Array.isArray(st.life.identities)) st.life.identities = [];
  return st;
}

function migrateV1(v1) {
  const st = defaultState();
  const enabled = Array.isArray(v1.enabled) && v1.enabled.length ? v1.enabled : DEFAULT_ACTIVE;
  st.habits = HABIT_PRESETS.map((p) => presetToHabit(p, enabled.includes(p.id)));
  if (v1.manual && typeof v1.manual === 'object') {
    st.log = {};
    for (const [day, entries] of Object.entries(v1.manual)) {
      if (!entries || typeof entries !== 'object') continue;
      st.log[day] = {};
      for (const [hid, val] of Object.entries(entries)) {
        if (val) st.log[day][hid] = { status: 'done', variant: 'tiny' };
      }
    }
  }
  return st;
}

export function loadHabits() {
  try {
    const raw = localStorage.getItem(HABIT_KEY);
    if (raw) {
      const v = JSON.parse(raw);
      if ((v?.version >= 2 && v?.version <= 4) && Array.isArray(v.habits)) {
        const st = normalizeState(v);
        if (v.version < 4) saveHabits(st);
        return st;
      }
    }
  } catch { /* ignore */ }

  try {
    const v1raw = localStorage.getItem(HABIT_KEY_V1);
    if (v1raw) {
      const v1 = JSON.parse(v1raw);
      const migrated = migrateV1(v1);
      saveHabits(migrated);
      return migrated;
    }
  } catch { /* ignore */ }

  const st = defaultState();
  saveHabits(st);
  return st;
}

export function saveHabits(st) {
  try { localStorage.setItem(HABIT_KEY, JSON.stringify(st)); } catch { /* ignore */ }
  return st;
}

export function domainById(id) {
  return LIFE_DOMAINS.find((d) => d.id === id) || LIFE_DOMAINS[1];
}

function mbsrDoneOn(date) {
  try {
    const cp = JSON.parse(localStorage.getItem('mbsr_completed'));
    return !!cp?.[date];
  } catch { return false; }
}

export function isAutoDone(habit, date = todayKey()) {
  if (habit.type !== 'auto') return false;
  if (habit.source === 'workout') return date === todayKey() && isDoneToday(loadWorkout());
  if (habit.source === 'mbsr') return mbsrDoneOn(date);
  return false;
}

export function isDueToday(habit, date = new Date()) {
  if (!habit.active) return false;
  const dow = new Date(date).getDay();
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekdays') return dow >= 1 && dow <= 5;
  if (habit.frequency === 'weekly') {
    const days = habit.daysOfWeek?.length ? habit.daysOfWeek : [1];
    return days.includes(dow);
  }
  if (habit.frequency === 'custom') {
    return (habit.daysOfWeek || []).includes(dow);
  }
  return true;
}

export function getLogEntry(st, habitId, date = todayKey()) {
  return st.log?.[date]?.[habitId] || null;
}

/** Returns: done | skip | pending | auto | not-due */
export function getHabitStatus(habit, st = loadHabits(), date = todayKey()) {
  const d = new Date(`${date}T12:00:00`);
  if (!isDueToday(habit, d)) return 'not-due';
  if (isAutoDone(habit, date)) return 'auto';
  const entry = getLogEntry(st, habit.id, date);
  if (entry?.status === 'done') return 'done';
  if (entry?.status === 'skip') return 'skip';
  return 'pending';
}

export function isHabitDone(habit, st = loadHabits(), date = todayKey()) {
  const s = getHabitStatus(habit, st, date);
  return s === 'done' || s === 'auto';
}

export function getTodayHabits(st = loadHabits(), date = todayKey()) {
  return st.habits.filter((h) => isDueToday(h, new Date(`${date}T12:00:00`)));
}

export function getActiveHabits(st = loadHabits()) {
  return st.habits.filter((h) => h.active);
}

export function getTodayProgress(st = loadHabits(), date = todayKey()) {
  const habits = getTodayHabits(st, date);
  const done = habits.filter((h) => isHabitDone(h, st, date)).length;
  const skipped = habits.filter((h) => getHabitStatus(h, st, date) === 'skip').length;
  return {
    habits,
    done,
    skipped,
    total: habits.length,
    allDone: habits.length > 0 && done === habits.length,
  };
}

export function markDone(habitId, date = todayKey()) {
  const st = loadHabits();
  const habit = st.habits.find((h) => h.id === habitId);
  if (!habit || habit.type === 'auto') return st;
  st.log[date] = { ...(st.log[date] || {}), [habitId]: { status: 'done', variant: 'tiny', at: Date.now() } };
  return saveHabits(st);
}

export function markSkip(habitId, reason = 'other', useGrace = false, date = todayKey()) {
  const st = loadHabits();
  const habit = st.habits.find((h) => h.id === habitId);
  if (!habit || habit.type === 'auto') return st;
  st.log[date] = {
    ...(st.log[date] || {}),
    [habitId]: { status: 'skip', reason, grace: !!useGrace, at: Date.now() },
  };
  if (useGrace) {
    const mk = monthKey(new Date(`${date}T12:00:00`));
    st.graceUsed[mk] = (st.graceUsed[mk] || 0) + 1;
  }
  return saveHabits(st);
}

export function toggleManual(habitId, date = todayKey()) {
  const st = loadHabits();
  const habit = st.habits.find((h) => h.id === habitId);
  if (!habit || habit.type === 'auto') return st;
  const entry = getLogEntry(st, habitId, date);
  if (entry?.status === 'done') {
    const day = { ...(st.log[date] || {}) };
    delete day[habitId];
    st.log[date] = day;
  } else {
    st.log[date] = { ...(st.log[date] || {}), [habitId]: { status: 'done', variant: 'tiny', at: Date.now() } };
  }
  return saveHabits(st);
}

export function graceRemaining(st = loadHabits(), d = new Date()) {
  const mk = monthKey(d);
  return Math.max(0, GRACE_PER_MONTH - (st.graceUsed[mk] || 0));
}

export function computeStreak(st = loadHabits()) {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = todayKey(d);
    const habits = getTodayHabits(st, key);
    if (!habits.length) break;
    const allDone = habits.every((h) => isHabitDone(h, st, key));
    if (!allDone) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Rolling consistency — grace skips count as completed (up to GRACE_PER_MONTH per month). */
export function computeConsistency(st = loadHabits(), windowDays = 30) {
  let expected = 0;
  let completed = 0;
  const d = new Date();
  for (let i = 0; i < windowDays; i++) {
    const key = todayKey(d);
    const habits = getTodayHabits(st, key);
    for (const h of habits) {
      expected += 1;
      const status = getHabitStatus(h, st, key);
      if (status === 'done' || status === 'auto') completed += 1;
      else if (status === 'skip') {
        const entry = getLogEntry(st, h.id, key);
        if (entry?.grace) completed += 1;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  const pct = expected ? Math.round((completed / expected) * 100) : 0;
  return { expected, completed, pct };
}

export function getHeatmap(st = loadHabits(), weeks = 12) {
  const days = weeks * 7;
  const cells = [];
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const key = todayKey(d);
    const habits = getTodayHabits(st, key);
    let level = 0;
    if (habits.length) {
      const done = habits.filter((h) => isHabitDone(h, st, key)).length;
      const ratio = done / habits.length;
      if (ratio >= 1) level = 4;
      else if (ratio >= 0.75) level = 3;
      else if (ratio >= 0.5) level = 2;
      else if (ratio > 0) level = 1;
    }
    cells.push({ date: key, level, total: habits.length, done: habits.filter((h) => isHabitDone(h, st, key)).length });
    d.setDate(d.getDate() + 1);
  }
  return cells;
}

/** Habits skipped/missed yesterday that are still pending today — "never miss twice". */
export function getNeverMissTwice(st = loadHabits()) {
  const today = todayKey();
  const yd = new Date();
  yd.setDate(yd.getDate() - 1);
  const yesterday = todayKey(yd);
  const flagged = [];
  for (const h of st.habits.filter((x) => x.active)) {
    if (!isDueToday(h, new Date(`${yesterday}T12:00:00`))) continue;
    if (!isDueToday(h, new Date(`${today}T12:00:00`))) continue;
    const yStatus = getHabitStatus(h, st, yesterday);
    const tStatus = getHabitStatus(h, st, today);
    const missedYesterday = yStatus === 'pending' || yStatus === 'skip';
    const notDoneToday = tStatus === 'pending';
    if (missedYesterday && notDoneToday) flagged.push(h);
  }
  return flagged;
}

export function addHabit(fields) {
  const st = loadHabits();
  const habit = {
    id: uid(),
    presetId: null,
    domain: fields.domain || 'mind',
    icon: fields.icon || domainById(fields.domain).icon,
    color: fields.color || domainById(fields.domain).color,
    titleEn: fields.titleEn?.trim() || 'New habit',
    titleAr: fields.titleAr?.trim() || fields.titleEn?.trim() || 'عادة جديدة',
    anchorEn: fields.anchorEn?.trim() || '',
    anchorAr: fields.anchorAr?.trim() || '',
    tinyEn: fields.tinyEn?.trim() || '',
    tinyAr: fields.tinyAr?.trim() || '',
    frequency: fields.frequency || 'daily',
    daysOfWeek: fields.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    active: true,
    type: 'manual',
    practiceId: null,
    source: null,
    suggestionId: fields.suggestionId || null,
    templateId: fields.templateId || null,
    createdAt: todayKey(),
    reminderTime: fields.reminderTime || null,
    stackAfter: fields.stackAfter || null,
  };
  st.habits.push(habit);
  return saveHabits(st);
}

export function updateHabit(habitId, patch) {
  const st = loadHabits();
  const i = st.habits.findIndex((h) => h.id === habitId);
  if (i < 0) return st;
  st.habits[i] = { ...st.habits[i], ...patch };
  return saveHabits(st);
}

export function toggleHabitActive(habitId) {
  const st = loadHabits();
  const h = st.habits.find((x) => x.id === habitId);
  if (!h) return st;
  h.active = !h.active;
  return saveHabits(st);
}

export function deleteHabit(habitId) {
  const st = loadHabits();
  const h = st.habits.find((x) => x.id === habitId);
  if (!h || h.presetId) {
    if (h?.presetId) return toggleHabitActive(habitId);
    return st;
  }
  st.habits = st.habits.filter((x) => x.id !== habitId);
  return saveHabits(st);
}

export function addPresetHabit(presetId) {
  const st = loadHabits();
  const existing = st.habits.find((h) => h.presetId === presetId || h.id === presetId);
  if (existing) {
    existing.active = true;
    return saveHabits(st);
  }
  const p = HABIT_PRESETS.find((x) => x.id === presetId);
  if (!p) return st;
  st.habits.push(presetToHabit(p, true));
  return saveHabits(st);
}

/** @deprecated use toggleHabitActive — kept for RelaxScreen compat */
export function toggleEnabled(habitId) {
  return toggleHabitActive(habitId);
}

/** Mark linked wellbeing practice done for today (all matching habits + calm group). */
export function markWellbeingPracticeDone(practiceId) {
  if (!practiceId) return;
  const st = loadHabits();
  const day = todayKey();
  const mark = (h) => {
    st.log[day] = { ...(st.log[day] || {}), [h.id]: { status: 'done', variant: 'tiny', source: practiceId, at: Date.now() } };
  };
  let changed = false;
  for (const h of st.habits.filter((x) => x.active && x.practiceId === practiceId)) {
    mark(h);
    changed = true;
  }
  if (CALM_PRACTICES.has(practiceId)) {
    for (const h of st.habits.filter((x) => x.active && (x.presetId === 'calm' || x.id === 'calm'))) {
      if (!st.log[day]?.[h.id]) { mark(h); changed = true; }
    }
  }
  if (changed) saveHabits(st);
}

export function habitTitle(h, isAr) {
  return isAr ? (h.titleAr || h.titleEn) : (h.titleEn || h.titleAr);
}

export function habitRecipe(h, isAr) {
  const anchor = isAr ? (h.anchorAr || h.anchorEn) : (h.anchorEn || h.anchorAr);
  const tiny = isAr ? (h.tinyAr || h.tinyEn) : (h.tinyEn || h.tinyAr);
  if (anchor && tiny) return `${anchor} → ${tiny}`;
  return tiny || anchor || '';
}

// ── Phase B: identity, wheel, suggestions, reflection ──

export function weekKey(d = new Date()) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return todayKey(dt);
}

export function setIdentities(ids, customIdentity = '') {
  const st = loadHabits();
  st.life.identities = ids.slice(0, MAX_IDENTITIES);
  st.life.customIdentity = customIdentity.trim();
  return saveHabits(st);
}

export function saveWheelScores(scores) {
  const st = loadHabits();
  st.life.wheel = { scores: { ...scores }, lastCheck: todayKey() };
  return saveHabits(st);
}

export function getWheelScores(st = loadHabits()) {
  return st.life?.wheel?.scores || {};
}

export function wheelRecheckDue(st = loadHabits()) {
  const last = st.life?.wheel?.lastCheck;
  if (!last) return true;
  const then = new Date(`${last}T12:00:00`);
  const now = new Date();
  const diff = (now - then) / 86400000;
  return diff >= WHEEL_RECHECK_DAYS;
}

export function getLowDomains(st = loadHabits(), count = 2) {
  const scores = getWheelScores(st);
  const rated = LIFE_DOMAINS
    .map((d) => ({ ...d, score: scores[d.id] ?? null }))
    .filter((d) => d.score != null);
  if (!rated.length) return [];
  rated.sort((a, b) => a.score - b.score);
  return rated.slice(0, count);
}

function habitMatchesSuggestion(h, sug) {
  const a = (h.titleEn || '').toLowerCase();
  const b = (sug.titleEn || '').toLowerCase();
  return a === b || h.suggestionId === sug.id;
}

export function getSuggestionsForDomain(domainId, st = loadHabits()) {
  const pool = DOMAIN_SUGGESTIONS[domainId] || [];
  const presets = HABIT_PRESETS.filter((p) => p.domain === domainId);
  const activeTitles = new Set(st.habits.filter((h) => h.active).map((h) => (h.titleEn || '').toLowerCase()));
  const items = [];
  for (const p of presets) {
    const exists = st.habits.some((h) => h.presetId === p.id && h.active);
    if (!exists) items.push({ kind: 'preset', id: p.id, domain: domainId, ...p });
  }
  for (const s of pool) {
    const exists = st.habits.some((h) => h.active && habitMatchesSuggestion(h, s));
    if (!exists && !activeTitles.has(s.titleEn.toLowerCase())) {
      items.push({ kind: 'suggestion', domain: domainId, ...s });
    }
  }
  return items;
}

export function getFocusSuggestions(st = loadHabits()) {
  const low = getLowDomains(st, 2);
  if (!low.length) {
    return LIFE_DOMAINS.slice(0, 2).flatMap((d) => getSuggestionsForDomain(d.id, st).slice(0, 1));
  }
  return low.flatMap((d) => getSuggestionsForDomain(d.id, st).slice(0, 2));
}

export function addSuggestionAsHabit(item) {
  if (item.kind === 'preset') return addPresetHabit(item.id);
  return addHabit({
    domain: item.domain,
    titleEn: item.titleEn,
    titleAr: item.titleAr,
    anchorEn: item.anchorEn,
    anchorAr: item.anchorAr,
    tinyEn: item.tinyEn,
    tinyAr: item.tinyAr,
    suggestionId: item.id,
  });
}

export function saveReflection(answers, wk = weekKey()) {
  const st = loadHabits();
  st.life.reflections[wk] = { ...answers, savedAt: Date.now() };
  return saveHabits(st);
}

export function getReflection(st = loadHabits(), wk = weekKey()) {
  return st.life?.reflections?.[wk] || null;
}

export function isReflectionDue(st = loadHabits()) {
  return !getReflection(st, weekKey());
}

export function identityLabel(st = loadHabits(), isAr = false) {
  const ids = st.life?.identities || [];
  const parts = ids.map((id) => {
    const p = IDENTITY_PRESETS.find((x) => x.id === id);
    return p ? (isAr ? p.ar : p.en) : null;
  }).filter(Boolean);
  if (st.life?.customIdentity) parts.push(st.life.customIdentity);
  return parts.join(' · ');
}

export function wheelAverage(st = loadHabits()) {
  const scores = Object.values(getWheelScores(st)).filter((v) => v != null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

// ── Phase C: automaticity, stacks, reminders, export ──

export function getAutomaticity(habit, st = loadHabits()) {
  const start = new Date(`${habit.createdAt || todayKey()}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let completedDays = 0;
  const d = new Date(start);
  while (d <= today) {
    if (isDueToday(habit, d) && isHabitDone(habit, st, todayKey(d))) completedDays += 1;
    d.setDate(d.getDate() + 1);
  }
  const week = Math.min(10, Math.max(1, Math.ceil(completedDays / 7) || (completedDays > 0 ? 1 : 0)));
  const pct = Math.min(100, Math.round((completedDays / FORMATION_DAYS) * 100));
  const phase = completedDays >= Math.round(FORMATION_DAYS * 0.85) ? 'stable' : 'forming';
  return { completedDays, week, pct, phase, target: FORMATION_DAYS };
}

/** Chains of 2+ habits linked via stackAfter. */
export function getStackChains(st = loadHabits()) {
  const active = st.habits.filter((h) => h.active);
  const byId = Object.fromEntries(active.map((h) => [h.id, h]));
  const hasChild = new Set(active.filter((h) => h.stackAfter && byId[h.stackAfter]).map((h) => h.stackAfter));
  const roots = active.filter((h) => !h.stackAfter || !byId[h.stackAfter]);
  const chains = [];
  for (const root of roots) {
    const chain = [root];
    let cur = root;
    for (;;) {
      const next = active.find((h) => h.stackAfter === cur.id);
      if (!next) break;
      chain.push(next);
      cur = next;
    }
    if (chain.length >= 2) chains.push(chain);
  }
  // Orphan stackAfter pointing to inactive habit — treat as single-item skip
  return chains;
}

export function setHabitReminder(habitId, reminderTime) {
  return updateHabit(habitId, { reminderTime: reminderTime || null });
}

export function setHabitStack(habitId, stackAfterId) {
  const st = loadHabits();
  if (stackAfterId === habitId) stackAfterId = null;
  if (stackAfterId) {
    const target = st.habits.find((h) => h.id === stackAfterId);
    if (!target) stackAfterId = null;
    else {
      let walk = stackAfterId;
      const seen = new Set([habitId]);
      while (walk) {
        if (seen.has(walk)) { stackAfterId = null; break; }
        seen.add(walk);
        const h = st.habits.find((x) => x.id === walk);
        walk = h?.stackAfter || null;
      }
    }
  }
  return updateHabit(habitId, { stackAfter: stackAfterId || null });
}

export function setRemindersEnabled(enabled) {
  const st = loadHabits();
  st.settings = { ...st.settings, remindersEnabled: !!enabled };
  return saveHabits(st);
}

function reminderDismissKey(habitId, date = todayKey()) {
  return `${habitId}_${date}`;
}

export function dismissHabitReminder(habitId, date = todayKey()) {
  const st = loadHabits();
  st.reminderDismiss[reminderDismissKey(habitId, date)] = true;
  return saveHabits(st);
}

export function isReminderDismissed(st, habitId, date = todayKey()) {
  return !!st.reminderDismiss?.[reminderDismissKey(habitId, date)];
}

/** Habits due today with reminder time passed, not done, not dismissed. */
export function getPendingReminders(st = loadHabits(), now = new Date()) {
  if (!st.settings?.remindersEnabled) return [];
  const nm = nowMinutes(now);
  const day = todayKey(now);
  return getTodayHabits(st, day).filter((h) => {
    if (!h.reminderTime || isHabitDone(h, st, day)) return false;
    if (isReminderDismissed(st, h.id, day)) return false;
    const rm = timeToMinutes(h.reminderTime);
    return rm != null && nm >= rm;
  });
}

export function exportHabitsData(st = loadHabits()) {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    app: 'maze-man-habits',
    version: st.version,
    habits: st.habits,
    log: st.log,
    graceUsed: st.graceUsed,
    life: st.life,
    settings: st.settings,
  }, null, 2);
}

export function importHabitsData(json) {
  const v = typeof json === 'string' ? JSON.parse(json) : json;
  if (!v?.habits || !Array.isArray(v.habits)) throw new Error('Invalid habit backup');
  const st = normalizeState({ ...v, version: 4 });
  return saveHabits(st);
}

// ── Phase D: templates library ──

export function getTemplatesByDomain(domainId) {
  return HABIT_TEMPLATES.filter((t) => t.domain === domainId);
}

export function isTemplateAdded(templateId, st = loadHabits()) {
  const tpl = HABIT_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return false;
  return st.habits.some((h) => h.active && (h.templateId === templateId || (h.titleEn || '').toLowerCase() === tpl.titleEn.toLowerCase()));
}

export function addTemplateAsHabit(templateId) {
  const tpl = HABIT_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return loadHabits();
  if (isTemplateAdded(templateId)) return loadHabits();
  return addHabit({
    domain: tpl.domain,
    icon: tpl.icon,
    titleEn: tpl.titleEn,
    titleAr: tpl.titleAr,
    anchorEn: tpl.anchorEn,
    anchorAr: tpl.anchorAr,
    tinyEn: tpl.tinyEn,
    tinyAr: tpl.tinyAr,
    templateId: tpl.id,
  });
}

// ── Phase E: insights + morning digest ──

export function getHabitConsistency(habit, st = loadHabits(), windowDays = 30) {
  let expected = 0;
  let completed = 0;
  const d = new Date();
  for (let i = 0; i < windowDays; i++) {
    const key = todayKey(d);
    if (isDueToday(habit, d)) {
      expected += 1;
      const status = getHabitStatus(habit, st, key);
      if (status === 'done' || status === 'auto') completed += 1;
      else if (status === 'skip') {
        const entry = getLogEntry(st, habit.id, key);
        if (entry?.grace) completed += 1;
      }
    }
    d.setDate(d.getDate() - 1);
  }
  const pct = expected ? Math.round((completed / expected) * 100) : null;
  return { expected, completed, pct };
}

export function getDomainStats(st = loadHabits(), windowDays = 30) {
  const map = {};
  for (const dom of LIFE_DOMAINS) {
    map[dom.id] = { domain: dom, expected: 0, completed: 0 };
  }
  for (const h of st.habits.filter((x) => x.active)) {
    const stat = getHabitConsistency(h, st, windowDays);
    if (!map[h.domain]) continue;
    map[h.domain].expected += stat.expected;
    map[h.domain].completed += stat.completed;
  }
  return LIFE_DOMAINS.map((d) => {
    const s = map[d.id];
    const pct = s.expected ? Math.round((s.completed / s.expected) * 100) : null;
    return { ...s, pct };
  }).filter((s) => s.expected > 0);
}

export function getWeeklyTrend(st = loadHabits(), weeks = 4) {
  const rows = [];
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  for (let w = weeks - 1; w >= 0; w--) {
    const weekEnd = new Date(end);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    let expected = 0;
    let completed = 0;
    const d = new Date(weekStart);
    while (d <= weekEnd) {
      const key = todayKey(d);
      const habits = getTodayHabits(st, key);
      for (const h of habits) {
        expected += 1;
        const status = getHabitStatus(h, st, key);
        if (status === 'done' || status === 'auto') completed += 1;
        else if (status === 'skip') {
          const entry = getLogEntry(st, h.id, key);
          if (entry?.grace) completed += 1;
        }
      }
      d.setDate(d.getDate() + 1);
    }
    rows.push({
      label: weekKey(weekEnd).slice(5),
      expected,
      completed,
      pct: expected ? Math.round((completed / expected) * 100) : 0,
    });
  }
  return rows;
}

export function getSkipBreakdown(st = loadHabits(), windowDays = 30) {
  const counts = {};
  const d = new Date();
  for (let i = 0; i < windowDays; i++) {
    const key = todayKey(d);
    const day = st.log?.[key];
    if (day) {
      for (const entry of Object.values(day)) {
        if (entry?.status === 'skip' && entry.reason) {
          counts[entry.reason] = (counts[entry.reason] || 0) + 1;
        }
      }
    }
    d.setDate(d.getDate() - 1);
  }
  return SKIP_REASONS.map((r) => ({ reason: r, count: counts[r.id] || 0 })).filter((x) => x.count > 0);
}

export function getInsightsSummary(st = loadHabits()) {
  const active = st.habits.filter((h) => h.active);
  const habitStats = active
    .map((h) => ({
      habit: h,
      ...getHabitConsistency(h, st),
      automaticity: getAutomaticity(h, st),
    }))
    .filter((x) => x.expected > 0)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));

  const forming = active.filter((h) => getAutomaticity(h, st).phase === 'forming').length;
  const stable = active.filter((h) => getAutomaticity(h, st).phase === 'stable').length;

  return {
    streak: computeStreak(st),
    consistency: computeConsistency(st),
    graceLeft: graceRemaining(st),
    habitStats,
    best: habitStats[0] || null,
    weakest: habitStats.length > 1 ? habitStats[habitStats.length - 1] : null,
    domainStats: getDomainStats(st),
    weeklyTrend: getWeeklyTrend(st),
    skipBreakdown: getSkipBreakdown(st),
    forming,
    stable,
    activeCount: active.length,
  };
}

export function getMorningDigestText(st = loadHabits(), lang = 'en') {
  const progress = getTodayProgress(st);
  const neverMiss = getNeverMissTwice(st);
  const isAr = lang === 'ar';
  if (!progress.total) {
    return isAr
      ? { title: 'صباح الخير', body: 'لا عادات مجدولة اليوم.' }
      : { title: 'Good morning', body: 'No habits scheduled today.' };
  }
  const pending = progress.total - progress.done;
  let title;
  let body;
  if (progress.allDone) {
    title = isAr ? 'أحسنت — كل عادات اليوم تمت!' : 'Nice — all habits done today!';
    body = isAr ? 'استمر على هذا الإيقاع.' : 'Keep this rhythm going.';
  } else {
    title = isAr
      ? `صباح الخير — ${pending} عادة${pending === 1 ? '' : 'ات'} اليوم`
      : `Good morning — ${pending} habit${pending === 1 ? '' : 's'} today`;
    body = isAr
      ? `${progress.done}/${progress.total} منجزة. خطوة صغيرة في كل مرة.`
      : `${progress.done}/${progress.total} done. One tiny step at a time.`;
  }
  if (neverMiss.length) {
    body += isAr
      ? ` لا تفوّت مرتين: ${neverMiss.length} عادة.`
      : ` Don't miss twice: ${neverMiss.length} habit${neverMiss.length > 1 ? 's' : ''}.`;
  }
  return { title, body };
}

export function setMorningDigestEnabled(enabled) {
  const st = loadHabits();
  st.settings = { ...st.settings, morningDigestEnabled: !!enabled };
  return saveHabits(st);
}

export function setMorningDigestTime(time) {
  const st = loadHabits();
  st.settings = { ...st.settings, morningDigestTime: time || '08:00' };
  return saveHabits(st);
}
