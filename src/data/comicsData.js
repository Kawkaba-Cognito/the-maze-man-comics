const base = import.meta.env.BASE_URL;

export const COMICS_DATA = [
  {
    id: 'ep1', vol: 'EP.01', title: 'PROBLEM SOLVING',
    cat: 'cognitive', catLabel: 'Cognitive Psych',
    icon: '🧩', bg: '#b8c0ff', free: true,
    type: 'game', url: `${base}episode-1-problem-solving.html`,
    cover: `${base}Assets/cover_art.jpg`, pages: []
  },
];

export const INLINE_COMICS = {
  social: {
    title: "Social Psychology",
    pages: [
      "Page 1: Humans are inherently social creatures. We thrive in tribes.",
      "Page 2: Group dynamics shape our reality, defining our norms and behaviors.",
      "Page 3: But what happens when the group goes wrong? End of Issue 1."
    ]
  },
  about: {
    title: "About The Page",
    pages: [
      "Welcome to The Maze Man.",
      "This is a prototype blending clinical psychology with interactive gameplay.",
      "Created to make learning cognitive concepts engaging and visceral."
    ]
  },
  cognitive: {
    title: "Cognitive Psychology",
    pages: [
      "Page 1: The brain is an information processing engine.",
      "Page 2: Attention, Memory, Language, and Perception are the gears.",
      "Page 3: Hack the gears, hack the mind. End of Issue 1."
    ]
  }
};
