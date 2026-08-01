/*
 * @palette-exempt: hand-drawn SVG scene art — these colours ARE the
 * illustration (dome, brickwork, lamp filament), not chrome. Tokenising them
 * would flatten a drawing into six semantic roles. Chrome in this game still
 * follows the palette; see scripts/audit-design.mjs.
 */
import React from 'react';
import {
  SCENE_W, SCENE_H, SceneDefs, RainThrough, Motes,
} from './sceneKit';

/*
 * CASE 3 — the Halls of the Almanac, on the ninth night of rain.
 *
 * Gallery seven, half a metre under. The display case stands in the middle of
 * standing water with the whale hanging over it, the strongroom stair going
 * down into the flood on the left, and the conservation lab still lit on the
 * right. Everything reflects, because everything is wet.
 */

export const ANCHORS = {
  whale: { x: 45, y: 17 },
  clockcase: { x: 67, y: 19 },
  stairs: { x: 19, y: 34 },
  vitrine: { x: 50, y: 41 },
  plinth: { x: 50, y: 72 },
  lab: { x: 86, y: 40 },
  files: { x: 29, y: 62 },
  refusal: { x: 72, y: 75 },
  bay: { x: 9, y: 70 },
};

export default function MuseumScene() {
  const id = 'mus';
  const WATER = 470;
  return (
    <svg
      className="nr-scene-art"
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <SceneDefs id={id} cold="#28405e" warm="#e8c07a" />

      <rect width={SCENE_W} height={SCENE_H} fill={`url(#${id}-wall)`} />

      {/* ── tall gallery windows, rain running down them ───────── */}
      <g>
        <rect x="330" y="40" width="120" height="300" fill={`url(#${id}-sky)`} />
        <rect x="700" y="40" width="120" height="300" fill={`url(#${id}-sky)`} />
        <g clipPath={`url(#${id}-winClip)`}>
          <RainThrough x={330} y={40} w={120} h={300} seed={3} />
          <RainThrough x={700} y={40} w={120} h={300} seed={9} />
        </g>
        <clipPath id={`${id}-winClip`}>
          <>
            <rect x="330" y="40" width="120" height="300" />
            <rect x="700" y="40" width="120" height="300" />
          </>
        </clipPath>
        <g stroke="#241f2e" strokeWidth="9" fill="none">
          <rect x="330" y="40" width="120" height="300" />
          <rect x="700" y="40" width="120" height="300" />
          <line x1="390" y1="40" x2="390" y2="340" />
          <line x1="760" y1="40" x2="760" y2="340" />
          <line x1="330" y1="190" x2="450" y2="190" />
          <line x1="700" y1="190" x2="820" y2="190" />
        </g>
        {/* the light they let in */}
        <path d="M336 340 L444 340 L520 600 L250 600 Z" fill={`url(#${id}-beam)`} />
        <path d="M706 340 L814 340 L890 600 L620 600 Z" fill={`url(#${id}-beam)`} />
      </g>
      <Motes x={300} y={330} w={560} h={200} n={22} seed={4} />

      {/* ── the whale, hanging over all of it ──────────────────── */}
      <g opacity="0.92">
        <line x1="440" y1="0" x2="452" y2="70" stroke="#2a2a38" strokeWidth="3" />
        <line x1="640" y1="0" x2="628" y2="80" stroke="#2a2a38" strokeWidth="3" />
        <path d="M360 96 q180 -46 380 4 q-40 30 -186 32 q-150 2 -194 -36 Z" fill="#1e1e28" />
        <path d="M740 100 q56 -20 84 -44 q-14 40 -30 58 q26 10 40 34 q-52 -14 -94 -26 Z" fill="#1e1e28" />
        <g stroke="#141420" strokeWidth="3">
          <line x1="420" y1="86" x2="424" y2="126" />
          <line x1="460" y1="82" x2="464" y2="128" />
          <line x1="500" y1="80" x2="504" y2="130" />
          <line x1="540" y1="80" x2="544" y2="130" />
          <line x1="580" y1="82" x2="584" y2="128" />
          <line x1="620" y1="86" x2="624" y2="126" />
          <line x1="660" y1="92" x2="664" y2="122" />
        </g>
        <ellipse cx="372" cy="98" rx="18" ry="12" fill="#1e1e28" />
      </g>

      {/* ── water clock, right of centre ───────────────────────── */}
      <g>
        <rect x="768" y="96" width="90" height="150" fill="#141320" stroke="#2b2436" strokeWidth="5" />
        <rect x="782" y="112" width="62" height="112" fill="#1b2434" />
        <rect x="782" y="168" width="62" height="56" fill="#2c4460" opacity="0.85" />
        <ellipse cx="813" cy="168" rx="31" ry="5" fill="#4a6f96" opacity="0.8" />
        <line x1="813" y1="112" x2="813" y2="160" stroke="#4a6f96" strokeWidth="2" opacity="0.5" strokeDasharray="2 10" />
        <g stroke="#6b5a33" strokeWidth="2">
          <line x1="848" y1="130" x2="858" y2="130" />
          <line x1="848" y1="160" x2="858" y2="160" />
          <line x1="848" y1="190" x2="858" y2="190" />
        </g>
      </g>

      {/* ── the display case, centre ───────────────────────────── */}
      <g>
        {/* plinth in the water */}
        <path d="M556 400 h96 v104 h-96 Z" fill="#171622" stroke="#2a2636" strokeWidth="4" />
        <rect x="546" y="392" width="116" height="14" fill="#241f30" />
        {/* the vitrine */}
        <rect x="540" y="196" width="128" height="200" fill="#0d0f18" opacity="0.6" stroke="#3a3a52" strokeWidth="5" />
        <line x1="540" y1="196" x2="540" y2="396" stroke="#4a4a68" strokeWidth="3" opacity="0.8" />
        <line x1="668" y1="196" x2="668" y2="396" stroke="#4a4a68" strokeWidth="3" opacity="0.8" />
        <rect x="532" y="184" width="144" height="16" fill="#241f30" />
        {/* glass sheen */}
        <path d="M552 200 L596 200 L560 392 L544 392 Z" fill="#9fb4d8" opacity="0.07" />
        {/* the object on its stand — 40 grams heavier than it should be */}
        <ellipse cx="604" cy="352" rx="26" ry="20" fill="#1b1710" stroke="#4a3a24" strokeWidth="3" />
        <ellipse cx="597" cy="345" rx="7" ry="5" fill="#5e4a2c" opacity="0.8" />
        <ellipse cx="604" cy="374" rx="34" ry="7" fill="#2a2338" />
        <ellipse cx="604" cy="316" rx="46" ry="34" fill={`url(#${id}-lamp)`} opacity="0.3" />
        {/* weight plinth readout */}
        <rect x="574" y="410" width="58" height="18" rx="3" fill="#0e0e16" stroke="#33334a" strokeWidth="3" />
        <rect x="582" y="416" width="30" height="5" fill="#62b277" opacity="0.8" />
      </g>

      {/* ── flooded strongroom stair, left ─────────────────────── */}
      <g>
        <rect x="140" y="150" width="200" height="330" fill="#0a0a12" />
        <rect x="152" y="162" width="176" height="60" fill="#141420" />
        <g fill="#171726">
          <rect x="164" y="252" width="152" height="18" />
          <rect x="176" y="286" width="140" height="18" />
          <rect x="188" y="320" width="128" height="18" />
          <rect x="200" y="354" width="116" height="18" />
        </g>
        <path d="M212 388 h104 v90 h-116 Z" fill="#22354e" opacity="0.9" />
        <rect x="140" y="150" width="200" height="330" fill="none" stroke="#241f2e" strokeWidth="7" />
        <text x="176" y="200" fill="#6b5a33" fontSize="26" fontFamily="monospace" opacity="0.7">▼ B1</text>
      </g>

      {/* ── conservation lab, right: the only warm window ──────── */}
      <g>
        <rect x="960" y="196" width="220" height="240" fill="#100f18" stroke="#282438" strokeWidth="6" />
        <rect x="976" y="212" width="188" height="130" fill="#25334a" />
        <rect x="976" y="212" width="188" height="130" fill={`url(#${id}-lamp)`} opacity="0.28" />
        {/* an X-ray plate on the lightbox */}
        <rect x="1004" y="230" width="132" height="96" fill="#cfe0ff" opacity="0.16" />
        <ellipse cx="1070" cy="278" rx="34" ry="26" fill="#0d1420" opacity="0.8" />
        <ellipse cx="1062" cy="272" rx="9" ry="8" fill="#cfe0ff" opacity="0.55" />
        <rect x="960" y="436" width="220" height="14" fill="#282438" />
      </g>

      {/* ── loading bay shutter, far left ──────────────────────── */}
      <g>
        <rect x="20" y="300" width="150" height="200" fill="#0f0e16" stroke="#241f2e" strokeWidth="6" />
        <g stroke="#1c1a26" strokeWidth="6">
          <line x1="26" y1="326" x2="164" y2="326" />
          <line x1="26" y1="352" x2="164" y2="352" />
          <line x1="26" y1="378" x2="164" y2="378" />
          <line x1="26" y1="404" x2="164" y2="404" />
          <line x1="26" y1="430" x2="164" y2="430" />
        </g>
        <rect x="20" y="288" width="150" height="14" fill="#2a2436" />
      </g>

      {/* filing cabinet with the loan file */}
      <g>
        <rect x="300" y="366" width="104" height="130" fill="#171622" stroke="#2a2636" strokeWidth="4" />
        <g fill="#221f30">
          <rect x="310" y="378" width="84" height="34" />
          <rect x="310" y="418" width="84" height="34" />
          <rect x="310" y="458" width="84" height="30" />
        </g>
        <g fill="#6b5a33">
          <rect x="342" y="392" width="20" height="5" />
          <rect x="342" y="432" width="20" height="5" />
        </g>
        <rect x="316" y="352" width="70" height="16" fill="#cfc4a8" transform="rotate(-3 351 360)" />
      </g>

      {/* the returned letter, on a wet desk */}
      <g>
        <rect x="812" y="474" width="168" height="14" fill="#2a2118" />
        <rect x="822" y="488" width="14" height="56" fill="#1a140d" />
        <rect x="956" y="488" width="14" height="56" fill="#1a140d" />
        <rect x="846" y="456" width="72" height="20" fill="#ded3b6" transform="rotate(-5 882 466)" />
        <path d="M846 456 l36 14 l36 -14" fill="none" stroke="#a99a78" strokeWidth="2.5" transform="rotate(-5 882 466)" />
        <rect x="898" y="452" width="26" height="14" fill="#c34a44" opacity="0.75" transform="rotate(-5 911 459)" />
      </g>

      {/* ── the flood ──────────────────────────────────────────── */}
      <rect y={WATER} width={SCENE_W} height={SCENE_H - WATER} fill="#101a28" />
      <rect y={WATER} width={SCENE_W} height={SCENE_H - WATER} fill="#2c4460" opacity="0.42" />
      {/* reflections, squashed and wobbling */}
      <g opacity="0.22">
        <rect x="540" y={WATER} width="128" height="90" fill="#4a6f96" />
        <rect x="976" y={WATER} width="188" height="70" fill="#8aa8cc" />
        <rect x="336" y={WATER} width="108" height="60" fill="#7d93c4" />
        <rect x="706" y={WATER} width="108" height="60" fill="#7d93c4" />
      </g>
      <g stroke="#6f92bd" strokeWidth="2" opacity="0.35" fill="none">
        <path d="M0 500 q140 8 300 0 t300 0 t300 0 t300 0" />
        <path d="M0 528 q160 -8 320 0 t320 0 t320 0 t240 0" />
        <path d="M0 556 q120 9 280 0 t300 0 t320 0 t300 0" />
      </g>
      <ellipse cx="604" cy={WATER + 26} rx="150" ry="16" fill="#e8c07a" opacity="0.10" />

      <rect width={SCENE_W} height={SCENE_H} fill="#080a12" opacity="0.24" />
    </svg>
  );
}
