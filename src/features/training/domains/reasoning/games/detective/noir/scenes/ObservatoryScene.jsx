/*
 * @palette-exempt: hand-drawn SVG scene art — these colours ARE the
 * illustration (dome, brickwork, lamp filament), not chrome. Tokenising them
 * would flatten a drawing into six semantic roles. Chrome in this game still
 * follows the palette; see scripts/audit-design.mjs.
 */
import React from 'react';
import {
  SCENE_W, SCENE_H, SceneDefs, RainThrough, Motes, FloorLines,
} from './sceneKit';

/*
 * CASE 1 — the great dome.
 *
 * The room is built around the crime: the telescope's mount ring sits dead
 * centre and it is EMPTY, with the storm coming straight through the open
 * shutter onto it. Everything else in the room — the archive door, the trolley
 * tracks in the dust, the watchman's booth — points at how the lens left.
 */

/** Hotspot positions, as percentages. The art owns these so props and
 *  hotspots cannot drift apart. Keys are hotspot ids from the case file. */
export const ANCHORS = {
  booth: { x: 6.5, y: 46 },
  desk: { x: 17.5, y: 70 },
  charts: { x: 25, y: 22 },
  clamp: { x: 43.5, y: 41 },
  mount: { x: 63.2, y: 45 },
  camera: { x: 63.5, y: 84 },
  clock: { x: 76, y: 18 },
  archive: { x: 91, y: 55 },
  floor: { x: 56, y: 87 },
  kettle: { x: 22, y: 84 },
};

export default function ObservatoryScene() {
  const id = 'obs';
  return (
    <svg
      className="nr-scene-art"
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <SceneDefs id={id} cold="#31456e" warm="#ffd98a" />

      {/* ── shell ─────────────────────────────────────────────── */}
      <rect width={SCENE_W} height={SCENE_H} fill={`url(#${id}-wall)`} />

      {/* dome ribs, converging toward the crown */}
      <g stroke="#20222f" strokeWidth="7" fill="none" opacity="0.9">
        <path d="M-40 300 Q 120 -40 600 -60" />
        <path d="M60 340 Q 240 -10 600 -60" />
        <path d="M240 380 Q 380 30 600 -60" />
        <path d="M1240 300 Q 1080 -40 600 -60" />
        <path d="M1140 340 Q 960 -10 600 -60" />
        <path d="M960 380 Q 820 30 600 -60" />
      </g>
      <ellipse cx="600" cy="-40" rx="200" ry="70" fill="#151622" />

      {/* ── the open shutter: a slot of storm ──────────────────── */}
      <rect x="520" y="-10" width="176" height="330" fill={`url(#${id}-sky)`} />
      <g clipPath={`url(#${id}-shutterClip)`}>
        <RainThrough x={520} y={-10} w={176} h={330} seed={2} />
      </g>
      <clipPath id={`${id}-shutterClip`}>
        <rect x="520" y="-10" width="176" height="330" />
      </clipPath>
      {/* far-off city, tiny and indifferent */}
      <path d="M520 300 h20 v-16 h16 v16 h14 v-26 h18 v26 h16 v-12 h14 v12 h18 v-22 h16 v22 h16 v-14 h12 v14 h16 v20 h-176 Z" fill="#0a0f1c" />
      <rect x="556" y="280" width="4" height="6" fill="#d9a441" opacity="0.55" />
      <rect x="612" y="270" width="4" height="6" fill="#d9a441" opacity="0.4" />
      {/* shutter leaves, drawn back */}
      <rect x="488" y="-10" width="34" height="330" fill="#181925" stroke="#262838" strokeWidth="4" />
      <rect x="694" y="-10" width="34" height="330" fill="#181925" stroke="#262838" strokeWidth="4" />
      {/* the beam it throws into the room */}
      <path d="M524 300 L692 300 L860 600 L360 600 Z" fill={`url(#${id}-beam)`} />
      <Motes x={430} y={330} w={360} h={230} n={22} seed={5} />

      {/* ── back wall furniture ────────────────────────────────── */}
      {/* star charts, pinned in rows */}
      <g>
        <rect x="228" y="86" width="120" height="86" fill="#14141d" stroke="#2b2c3a" strokeWidth="4" />
        <rect x="240" y="98" width="96" height="62" fill="#1b1f2e" />
        <g stroke="#4a5578" strokeWidth="1.6" opacity="0.8">
          <line x1="252" y1="112" x2="292" y2="130" />
          <line x1="292" y1="130" x2="318" y2="110" />
          <line x1="264" y1="146" x2="292" y2="130" />
        </g>
        <circle cx="252" cy="112" r="2.4" fill="#cfe0ff" />
        <circle cx="292" cy="130" r="2.8" fill="#cfe0ff" />
        <circle cx="318" cy="110" r="2.2" fill="#cfe0ff" />
        <circle cx="264" cy="146" r="2" fill="#cfe0ff" />
        <rect x="232" y="182" width="112" height="10" fill="#14141d" />
      </g>

      {/* the dome clock, stopped */}
      <g>
        <rect x="880" y="66" width="90" height="90" fill="#191420" stroke="#2e2636" strokeWidth="5" />
        <ellipse cx="925" cy="111" rx="30" ry="30" fill="#d8cdb2" />
        <line x1="925" y1="111" x2="925" y2="90" stroke="#1a130c" strokeWidth="4" />
        <line x1="925" y1="111" x2="906" y2="118" stroke="#1a130c" strokeWidth="3" />
        <ellipse cx="925" cy="111" rx="3" ry="3" fill="#1a130c" />
      </g>

      {/* archive door, right — the only way the lens could leave */}
      <g>
        <rect x="1042" y="196" width="132" height="300" fill="#0e0d14" stroke="#241f2e" strokeWidth="6" />
        <rect x="1056" y="212" width="104" height="150" fill="#141320" />
        <rect x="1056" y="376" width="104" height="106" fill="#141320" />
        <ellipse cx="1066" cy="352" rx="6" ry="6" fill="#8a744a" />
        <rect x="1042" y="180" width="132" height="16" fill="#241f2e" />
        <rect x="1074" y="150" width="68" height="24" fill="#0f0e15" stroke="#2a2436" strokeWidth="3" />
      </g>

      {/* watchman's booth, far left */}
      <g>
        <rect x="16" y="200" width="130" height="230" fill="#12121b" stroke="#252533" strokeWidth="5" />
        <rect x="30" y="216" width="102" height="96" fill="#1d2333" />
        <rect x="30" y="216" width="102" height="96" fill={`url(#${id}-lamp)`} opacity="0.35" />
        <line x1="81" y1="216" x2="81" y2="312" stroke="#252533" strokeWidth="4" />
        <rect x="36" y="330" width="90" height="60" fill="#171622" />
        <rect x="46" y="342" width="70" height="8" fill="#2a2636" />
        <rect x="46" y="356" width="52" height="8" fill="#2a2636" />
      </g>

      {/* ── the telescope ──────────────────────────────────────── */}
      <g>
        {/* pier */}
        <path d="M556 470 h96 l20 96 h-136 Z" fill="#15141c" />
        <rect x="540" y="558" width="140" height="18" fill="#1d1c26" />
        {/* yoke */}
        <path d="M566 470 L586 330" stroke="#20202c" strokeWidth="20" strokeLinecap="round" />
        <path d="M646 470 L626 330" stroke="#20202c" strokeWidth="20" strokeLinecap="round" />
        {/* tube, angled up toward the shutter */}
        <path d="M470 372 L742 236 L774 300 L502 436 Z" fill="#1b1b26" stroke="#2c2c3c" strokeWidth="5" />
        <path d="M470 372 L742 236" stroke="#33334a" strokeWidth="4" opacity="0.8" />
        {/* the EMPTY mount ring — the crime, dead centre */}
        <ellipse cx="600" cy="180" rx="1" ry="1" fill="none" />
        <g transform="translate(0,0)">
          <ellipse cx="758" cy="268" rx="34" ry="46" fill="#07070c" stroke="#3a3a52" strokeWidth="6" />
          <ellipse cx="758" cy="268" rx="22" ry="32" fill="none" stroke="#4a4a68" strokeWidth="3" opacity="0.7" />
          {/* the ring of undisturbed dust it left behind */}
          <ellipse cx="758" cy="268" rx="40" ry="53" fill="none" stroke="#7b6a45" strokeWidth="2" opacity="0.45" strokeDasharray="5 6" />
        </g>
        {/* clamp, still holding nothing */}
        <g>
          <rect x="506" y="236" width="42" height="18" rx="4" fill="#2a2a3a" stroke="#3c3c52" strokeWidth="3" transform="rotate(-27 527 245)" />
          <rect x="520" y="222" width="10" height="20" fill="#3c3c52" transform="rotate(-27 525 232)" />
        </g>
      </g>

      {/* ── floor ──────────────────────────────────────────────── */}
      <rect y="470" width={SCENE_W} height={SCENE_H - 470} fill={`url(#${id}-floor)`} />
      <FloorLines y={498} count={4} gap={30} opacity={0.28} />
      <ellipse cx="600" cy="540" rx="330" ry="70" fill={`url(#${id}-pool)`} />

      {/* trolley tracks, running out to the archive */}
      <g stroke="#6b5a38" strokeWidth="3.5" opacity="0.55" fill="none">
        <path d="M600 512 C 720 522, 900 528, 1064 500" />
        <path d="M600 528 C 722 540, 902 546, 1070 516" />
      </g>

      {/* desk with the sign-in ledger and a lamp */}
      <g>
        <rect x="120" y="404" width="240" height="20" fill="#2a2118" />
        <rect x="132" y="424" width="18" height="86" fill="#1a140d" />
        <rect x="330" y="424" width="18" height="86" fill="#1a140d" />
        <ellipse cx="210" cy="392" rx="70" ry="26" fill={`url(#${id}-lamp)`} opacity="0.5" />
        <rect x="176" y="386" width="70" height="20" fill="#cfc4a8" transform="rotate(-3 211 396)" />
        <rect x="182" y="392" width="56" height="3" fill="#8a7c5e" transform="rotate(-3 210 393)" />
        <path d="M300 404 v-34" stroke="#3a3226" strokeWidth="5" />
        <path d="M282 370 q18 -20 36 0 Z" fill="#2e4a3a" />
        <path d="M286 372 h28" stroke="#ffd98a" strokeWidth="3" opacity="0.9" />
      </g>

      {/* kettle and cups on a low table */}
      <g>
        <rect x="214" y="500" width="120" height="12" fill="#241d14" />
        <rect x="224" y="512" width="10" height="46" fill="#181209" />
        <rect x="314" y="512" width="10" height="46" fill="#181209" />
        <path d="M248 500 q-6 -30 22 -30 q28 0 22 30 Z" fill="#2b2230" />
        <path d="M270 468 v-8" stroke="#3a3040" strokeWidth="4" />
        <ellipse cx="296" cy="494" rx="9" ry="7" fill="#241d2a" />
        <ellipse cx="312" cy="496" rx="8" ry="6" fill="#241d2a" />
      </g>

      {/* Lola's camera on its tripod */}
      <g>
        <path d="M762 516 L742 596 M762 516 L782 596 M762 516 L762 592" stroke="#1e1c26" strokeWidth="6" />
        <rect x="726" y="480" width="74" height="42" rx="5" fill="#1c1a24" stroke="#2e2c3c" strokeWidth="4" />
        <ellipse cx="763" cy="501" rx="15" ry="15" fill="#0b0b12" stroke="#3a3850" strokeWidth="4" />
        <ellipse cx="758" cy="496" rx="4" ry="4" fill="#5f7fae" opacity="0.7" />
        <rect x="736" y="470" width="20" height="12" fill="#2e2c3c" />
      </g>

      {/* a cold rim along everything the shutter can see */}
      <path d="M524 300 L692 300" stroke="#7d93c4" strokeWidth="3" opacity="0.35" />
      <rect width={SCENE_W} height={SCENE_H} fill="#0a0a12" opacity="0.22" />
    </svg>
  );
}
