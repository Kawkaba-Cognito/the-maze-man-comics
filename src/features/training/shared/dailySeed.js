/** Calendar day index (1–366) for mixing daily variety into level seeds. */
export function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

/** XOR day salt into a base seed so the same level plays differently each day. */
export function seedWithDay(baseSeed, date = new Date()) {
  const day = dayOfYear(date);
  return (baseSeed ^ (day * 2654435761)) >>> 0;
}
