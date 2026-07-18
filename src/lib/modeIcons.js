import { assetUrl } from './assetUrl';

/*
 * Premium 3D mode icons (Microsoft Fluent Emoji, MIT —
 * https://github.com/microsoft/fluentui-emoji). Same family as planetIcons.js.
 * Used by TrainingModeList for Survival / Levels / Pass n Play so every game
 * gets consistent art instead of OS emoji glyphs.
 */
const FILES = {
  free: 'infinity.webp',
  levels: 'bullseye.webp',
  chal: 'crossed_swords.webp',
};

export function modeIconUrl(modeKey) {
  const file = FILES[modeKey];
  return file ? assetUrl(`Assets/planets/${file}`) : null;
}
