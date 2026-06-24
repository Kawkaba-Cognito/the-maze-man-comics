/**
 * Lightweight follower trail — recruited soldiers lerp behind the player.
 * O(followers) per frame; no extra meshes beyond the NPC instances.
 */
export function createFollowerController() {
  const followers = [];
  const trail = [];
  const TRAIL_LEN = 48;
  const SPACING = 1.65;

  function add(npc) {
    if (!npc || followers.includes(npc)) return;
    npc.isFollower = true;
    followers.push(npc);
  }

  function update(playerPos) {
    trail.unshift({ x: playerPos.x, z: playerPos.z });
    if (trail.length > TRAIL_LEN) trail.pop();

    followers.forEach((npc, idx) => {
      const want = SPACING * (idx + 1);
      let tx = playerPos.x;
      let tz = playerPos.z;
      let acc = 0;
      for (let j = 0; j < trail.length - 1; j++) {
        const a = trail[j];
        const b = trail[j + 1];
        const seg = Math.hypot(a.x - b.x, a.z - b.z);
        if (acc + seg >= want) {
          const f = seg > 0 ? (want - acc) / seg : 0;
          tx = a.x + (b.x - a.x) * f;
          tz = a.z + (b.z - a.z) * f;
          break;
        }
        acc += seg;
        tx = b.x;
        tz = b.z;
      }
      const k = 0.2;
      const nx = npc.root.position.x + (tx - npc.root.position.x) * k;
      const nz = npc.root.position.z + (tz - npc.root.position.z) * k;
      npc.root.position.x = nx;
      npc.root.position.z = nz;
      npc.blob.position.x = nx;
      npc.blob.position.z = nz;
      npc.x = nx;
      npc.z = nz;
      const dx = tx - nx;
      const dz = tz - nz;
      if (Math.hypot(dx, dz) > 0.04) npc.root.rotation.y = Math.atan2(dx, dz);
    });
  }

  return { add, update, count: () => followers.length };
}
