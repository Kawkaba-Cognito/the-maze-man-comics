/*
 * DESIGN TOKENS (JS mirror of tokens.css).
 *
 * Use this when you need a color/spacing value inside a JS object — e.g. for
 * inline styles, SVG attributes, or computed string templates. Never hard-code
 * a hex literal in a component file.
 *
 * If a token is missing, add it BOTH here and in tokens.css so they stay
 * in sync. The CSS file is the visual source of truth; this file mirrors it
 * for the JS consumers that can't use var().
 */

export const tokens = {
  /* Surface */
  bg: '#05050f',
  bgShrine: '#12090a',
  stone: '#1a1018',
  stoneMid: '#1f160c',
  stoneDeep: '#150e08',
  stoneEdge: '#3a2b18',

  /* Text */
  text: '#f0e2c0',
  textMuted: '#9c8a70',
  textDark: '#14121a',
  textSoft: '#2a1a16',

  /* Amber / accent */
  amber: '#e8ac4e',
  amberBright: '#ffd47e',
  amberEdge: '#9a6828',
  amberGlowSoft: 'rgba(255, 180, 60, 0.40)',
  amberGlow: 'rgba(255, 150, 30, 0.35)',
  amberGlowStrong: 'rgba(255, 150, 30, 0.55)',

  /* Wood plaque */
  wood: {
    light: '#6a3212',
    mid: '#5e2a0c',
    body: '#4a2008',
    dark: '#3e1a06',
    hoverLight: '#7e3c14',
    hoverMid: '#722e10',
    hoverBody: '#5a260a',
    hoverDark: '#4e2208',
  },

  /* Carpet */
  carpet: {
    light: '#5a1e10',
    body: '#4a1608',
    dark: '#2a0a04',
    edge: '#a06830',
    edgeHover: '#d09040',
  },

  /* Domain colors (training) */
  domain: {
    attention: '#e8ac4e',
    speed: '#64b5c2',
    memory: '#9cb752',
    language: '#d47a4a',
    reasoning: '#b696d4',
    flexibility: '#e07aaa',
  },

  /* State */
  danger: '#8b2020',
  runeSage: '#6b9e7a',
};

/** Reusable plaque background — the wooden door style used across home and the training hub. */
export const plaqueBackground =
  `linear-gradient(170deg, ${tokens.wood.dark} 0%, ${tokens.wood.mid} 50%, ${tokens.wood.dark} 100%)`;

export const plaqueBoxShadow =
  `inset 0 1px 0 rgba(220, 170, 70, 0.35), inset 0 -1px 0 rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.6)`;
