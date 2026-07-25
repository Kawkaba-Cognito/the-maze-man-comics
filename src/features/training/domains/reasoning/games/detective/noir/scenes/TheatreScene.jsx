import React from 'react';
import {
  SCENE_W, SCENE_H, SceneDefs, Motes, FloorLines,
} from './sceneKit';

/*
 * CASE 2 — the Rainfall Theatre, after the last curtain.
 *
 * A cross-section: the stage still lit, the lighting bridge above it, the sound
 * booth glowing up on the right with the tape machine visible through its
 * window, and the leak the audience applauded still dripping into its bucket.
 */

export const ANCHORS = {
  poster: { x: 6, y: 27 },
  roommic: { x: 50, y: 27 },
  ladder: { x: 16.5, y: 49 },
  wings: { x: 24, y: 67 },
  dressing: { x: 34, y: 60 },
  bucket: { x: 50, y: 87 },
  office: { x: 69, y: 82 },
  machine: { x: 82.5, y: 32 },
  hooks: { x: 92, y: 66 },
};

export default function TheatreScene() {
  const id = 'thr';
  return (
    <svg
      className="nr-scene-art"
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <SceneDefs id={id} cold="#3a4a72" warm="#f0c674" />

      <rect width={SCENE_W} height={SCENE_H} fill={`url(#${id}-wall)`} />

      {/* ── the stage box ──────────────────────────────────────── */}
      <rect x="300" y="60" width="600" height="420" fill="#0b0b12" />
      {/* cyclorama, faintly lit */}
      <rect x="330" y="86" width="540" height="360" fill="#141a28" />
      <ellipse cx="600" cy="330" rx="250" ry="150" fill={`url(#${id}-pool)`} />

      {/* proscenium arch */}
      <rect x="276" y="40" width="34" height="452" fill="#1a141c" stroke="#2a2030" strokeWidth="4" />
      <rect x="890" y="40" width="34" height="452" fill="#1a141c" stroke="#2a2030" strokeWidth="4" />
      <rect x="276" y="40" width="648" height="34" fill="#1a141c" stroke="#2a2030" strokeWidth="4" />

      {/* curtains, drawn back into heavy folds */}
      <g>
        <path d="M310 74 q34 40 22 200 q-10 130 6 218 h-22 Z" fill="#3a1620" />
        <path d="M332 74 q30 46 20 208 q-8 126 4 210 h-26 Z" fill="#4a1d29" opacity="0.85" />
        <path d="M890 74 q-34 40 -22 200 q10 130 -6 218 h22 Z" fill="#3a1620" />
        <path d="M868 74 q-30 46 -20 208 q8 126 -4 210 h26 Z" fill="#4a1d29" opacity="0.85" />
      </g>

      {/* ── lighting bridge across the top ─────────────────────── */}
      <rect x="0" y="112" width={SCENE_W} height="14" fill="#191922" />
      <g fill="#20202c">
        <rect x="360" y="126" width="26" height="34" />
        <rect x="520" y="126" width="26" height="34" />
        <rect x="680" y="126" width="26" height="34" />
        <rect x="840" y="126" width="26" height="34" />
      </g>
      {/* one lamp still burning, throwing the beam down onto the boards */}
      <path d="M533 160 L546 160 L700 470 L400 470 Z" fill={`url(#${id}-beam)`} />
      <Motes x={420} y={200} w={280} h={260} n={20} seed={7} />
      <ellipse cx="533" cy="158" rx="11" ry="7" fill="#f0c674" opacity="0.85" />

      {/* the ceiling room mic, the thing everybody forgot */}
      <g>
        <line x1="600" y1="126" x2="600" y2="152" stroke="#2e2e3e" strokeWidth="4" />
        <ellipse cx="600" cy="162" rx="12" ry="16" fill="#22222e" stroke="#3a3a4e" strokeWidth="3" />
        <ellipse cx="600" cy="158" rx="6" ry="8" fill="#3d3d52" />
      </g>

      {/* catwalk ladder, left */}
      <g stroke="#242430" strokeWidth="7">
        <line x1="180" y1="126" x2="180" y2="470" />
        <line x1="222" y1="126" x2="222" y2="470" />
      </g>
      <g stroke="#2c2c3a" strokeWidth="5">
        <line x1="180" y1="176" x2="222" y2="176" />
        <line x1="180" y1="226" x2="222" y2="226" />
        <line x1="180" y1="276" x2="222" y2="276" />
        <line x1="180" y1="326" x2="222" y2="326" />
        <line x1="180" y1="376" x2="222" y2="376" />
        <line x1="180" y1="426" x2="222" y2="426" />
      </g>

      {/* ── sound booth, up on the right ───────────────────────── */}
      <g>
        <rect x="928" y="120" width="256" height="196" fill="#0f0f16" stroke="#262636" strokeWidth="6" />
        <rect x="944" y="136" width="224" height="132" fill="#1d2334" />
        <rect x="944" y="136" width="224" height="132" fill={`url(#${id}-lamp)`} opacity="0.3" />
        {/* the tape machine, two reels behind the glass */}
        <rect x="962" y="160" width="188" height="86" rx="4" fill="#191922" stroke="#33334a" strokeWidth="3" />
        <ellipse cx="1004" cy="192" rx="24" ry="24" fill="#0e0e16" stroke="#4a4a66" strokeWidth="4" />
        <ellipse cx="1004" cy="192" rx="7" ry="7" fill="#4a4a66" />
        <ellipse cx="1108" cy="192" rx="24" ry="24" fill="#0e0e16" stroke="#4a4a66" strokeWidth="4" />
        <ellipse cx="1108" cy="192" rx="7" ry="7" fill="#4a4a66" />
        <rect x="1032" y="226" width="52" height="8" fill="#2a2a3c" />
        <ellipse cx="1044" cy="238" rx="5" ry="5" fill="#c34a44" />
        <rect x="928" y="316" width="256" height="14" fill="#262636" />
        {/* the stair up to it */}
        <path d="M934 330 l0 40 l-40 0 l0 40 l-40 0 l0 40" stroke="#1d1d28" strokeWidth="10" fill="none" />
      </g>

      {/* key board on the wall beside the booth */}
      <g>
        <rect x="1064" y="360" width="112" height="84" fill="#171620" stroke="#2a2836" strokeWidth="4" />
        <g stroke="#3a3850" strokeWidth="3">
          <line x1="1080" y1="378" x2="1080" y2="392" />
          <line x1="1104" y1="378" x2="1104" y2="392" />
          <line x1="1128" y1="378" x2="1128" y2="392" />
          <line x1="1152" y1="378" x2="1152" y2="392" />
        </g>
        <g fill="#8a744a">
          <rect x="1076" y="392" width="8" height="16" />
          <rect x="1124" y="392" width="8" height="16" />
          <rect x="1148" y="392" width="8" height="16" />
        </g>
        <rect x="1072" y="416" width="96" height="6" fill="#241f2e" />
      </g>

      {/* ── stage floor ────────────────────────────────────────── */}
      <rect y="470" width={SCENE_W} height={SCENE_H - 470} fill={`url(#${id}-floor)`} />
      <FloorLines y="492" count={4} gap={28} opacity={0.32} />

      {/* the leak, and its bucket, centre stage */}
      <g>
        <line x1="600" y1="176" x2="600" y2="470" stroke="#7d93c4" strokeWidth="1.6" opacity="0.22" strokeDasharray="3 26" />
        <path d="M574 508 h52 l-8 46 h-36 Z" fill="#232330" stroke="#3a3a50" strokeWidth="3" />
        <ellipse cx="600" cy="508" rx="26" ry="7" fill="#2b3a52" />
        <ellipse cx="600" cy="508" rx="18" ry="4" fill="#4a6289" opacity="0.7" />
      </g>

      {/* coat on a hook in the wings, still dripping */}
      <g>
        <rect x="262" y="404" width="10" height="120" fill="#1c1a24" />
        <path d="M268 428 q34 6 30 62 q-4 54 -30 60 q-26 -6 -30 -60 q-4 -56 30 -62 Z" fill="#191a26" stroke="#2a2c3c" strokeWidth="3" />
        <ellipse cx="268" cy="562" rx="4" ry="6" fill="#4a6289" opacity="0.8" />
        <ellipse cx="268" cy="580" rx="10" ry="3" fill="#2b3a52" opacity="0.6" />
      </g>

      {/* dressing room door */}
      <g>
        <rect x="360" y="330" width="112" height="180" fill="#100f16" stroke="#241f2e" strokeWidth="5" />
        <rect x="374" y="344" width="84" height="60" fill="#1b1a26" />
        <ellipse cx="462" cy="424" rx="5" ry="5" fill="#8a744a" />
        <ellipse cx="416" cy="360" rx="18" ry="18" fill="#241f2e" />
        <path d="M404 360 h24 M416 348 v24" stroke="#f0c674" strokeWidth="2" opacity="0.5" />
      </g>

      {/* manager's desk, papers under a low lamp */}
      <g>
        <rect x="770" y="500" width="196" height="16" fill="#2a2118" />
        <rect x="782" y="516" width="16" height="66" fill="#1a140d" />
        <rect x="938" y="516" width="16" height="66" fill="#1a140d" />
        <ellipse cx="836" cy="492" rx="60" ry="22" fill={`url(#${id}-lamp)`} opacity="0.45" />
        <rect x="806" y="486" width="62" height="16" fill="#cfc4a8" transform="rotate(-4 837 494)" />
        <rect x="818" y="482" width="58" height="14" fill="#ded3b6" transform="rotate(3 847 489)" />
        <path d="M930 500 v-30" stroke="#3a3226" strokeWidth="5" />
        <path d="M914 470 q16 -18 32 0 Z" fill="#4a2a2e" />
      </g>

      {/* opening-night poster, far left */}
      <g>
        <rect x="34" y="120" width="112" height="152" fill="#191420" stroke="#3a2f22" strokeWidth="5" />
        <rect x="46" y="132" width="88" height="128" fill="#241a26" />
        <ellipse cx="90" cy="180" rx="22" ry="26" fill="#3a2a3e" />
        <rect x="60" y="220" width="60" height="7" fill="#6b5a33" />
        <rect x="68" y="234" width="44" height="5" fill="#4a4030" />
      </g>

      <rect width={SCENE_W} height={SCENE_H} fill="#0a0a12" opacity="0.2" />
    </svg>
  );
}
