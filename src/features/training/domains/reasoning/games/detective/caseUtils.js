/** Helpers to adapt legacy case data to the report + scene-card flow. */

export const L = (o, isAr) => (o ? (isAr ? o.ar : o.en) : '');

/** One readable statement per person — no question menu. */
export function buildReport(person, isAr) {
  if (person.report) return L(person.report, isAr);
  const qs = (person.questions || []).filter((q) => !q.needsClue);
  if (qs.length === 0) return '';
  const alibi = qs.find((q) => q.id === 'alibi');
  if (alibi && !alibi.givesClue) return L(alibi.a, isAr);
  const safe = qs.filter((q) => !q.givesClue);
  if (safe.length) return safe.map((q) => L(q.a, isAr)).join('\n\n');
  return qs.map((q) => L(q.a, isAr)).join('\n\n');
}

/** Scene hotspots become an ordered checklist of places to examine. */
export function sceneLocations(caseData) {
  return (caseData.hotspots || []).map((h) => ({
    id: h.id,
    icon: h.e,
    name: h.name,
    clueId: h.clueId || null,
    empty: h.empty || null,
  }));
}

export function locationResult(hotspot, clueById, isAr) {
  if (hotspot.clueId && clueById[hotspot.clueId]) {
    const cl = clueById[hotspot.clueId];
    return { kind: 'clue', title: cl.name, text: cl.text, clueId: cl.id, icon: cl.e };
  }
  if (hotspot.empty) {
    return { kind: 'empty', title: hotspot.name, text: hotspot.empty, icon: hotspot.e };
  }
  return { kind: 'empty', title: hotspot.name, text: { en: 'Nothing useful here.', ar: 'لا شيء مفيد هنا.' }, icon: hotspot.e };
}

export const TIER_LABEL = {
  en: ['Easy case', 'Medium case', 'Hard case'],
  ar: ['قضية سهلة', 'قضية متوسطة', 'قضية صعبة'],
};

export function tierLabel(tier, isAr) {
  const list = isAr ? TIER_LABEL.ar : TIER_LABEL.en;
  return list[Math.max(0, Math.min(2, (tier || 1) - 1))] ?? list[0];
}

/** Steeper survival ramp so difficulty actually shifts. */
export function survivalTier(solved) {
  if (solved < 2) return 0;
  if (solved < 5) return 1;
  return 2;
}
