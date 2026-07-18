const PROMPTS = [
  {
    en: (topic) => `What is one thing you value most about ${topic}?`,
    ar: (topic) => `ما أكثر شيء تقدّره في ${topic}؟`,
  },
  {
    en: (topic) => `Share a small memory connected to ${topic}.`,
    ar: (topic) => `شارك ذكرى صغيرة مرتبطة بـ${topic}.`,
  },
  {
    en: (topic) => `What would make ${topic} better this month?`,
    ar: (topic) => `ما الذي قد يجعل ${topic} أفضل هذا الشهر؟`,
  },
  {
    en: (topic) => `What is something people often misunderstand about ${topic}?`,
    ar: (topic) => `ما الذي يسيء الناس فهمه غالباً بشأن ${topic}؟`,
  },
  {
    en: (topic) => `What is a kind, practical way to approach ${topic}?`,
    ar: (topic) => `ما الطريقة اللطيفة والعملية للتعامل مع ${topic}؟`,
  },
  {
    en: (topic) => `Who or what has shaped how you think about ${topic}?`,
    ar: (topic) => `من أو ما الذي أثّر في نظرتك إلى ${topic}؟`,
  },
  {
    en: (topic) => `If you had to describe ${topic} in three words, what would they be?`,
    ar: (topic) => `لو وصفت ${topic} بثلاث كلمات، ماذا تقول؟`,
  },
  {
    en: (topic) => `What question about ${topic} do you wish people asked you more often?`,
    ar: (topic) => `ما السؤال عن ${topic} الذي تتمنى أن يسألك الناس عنه أكثر؟`,
  },
];

/**
 * Builds bilingual conversation cards from curated topic pairs.
 */
export function createQuestions(deckId, topics) {
  return topics.flatMap(([enTopic, arTopic], topicIndex) =>
    PROMPTS.map((prompt, index) => ({
      id: `${deckId}-${String(topicIndex * PROMPTS.length + index + 1).padStart(3, '0')}`,
      en: prompt.en(enTopic),
      ar: prompt.ar(arTopic),
    })),
  );
}
