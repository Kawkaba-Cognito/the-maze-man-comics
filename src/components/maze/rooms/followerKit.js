/**
 * Formation follower controller — recruited soldiers march in a wedge BESIDE and
 * slightly behind the player instead of stacking on top of them.
 *
 * Each follower owns a fixed slot offset in the player's local frame (right/forward),
 * so when the player stops they hold a tidy flanking formation rather than collapsing
 * onto the player position (the old trail-follow bug). Heading is derived from the
 * player's own movement and held while stationary. O(followers) per frame, no meshes.
 */
export function createFollowerController() {
  const followers = [];
  let heading = 0;          // smoothed facing derived from player movement
  let lastX = null;
  let lastZ = null;

  // Slot offsets in the player's local frame: x = right, z = forward.
  // Alternate left/right, stepping further back every pair → clean wedge.
  function slotOffset(i) {
    const side = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2);
    return { sx: side * 1.15, sz: -0.85 - row * 1.25 };
  }

  function add(npc) {
    if (!npc || followers.includes(npc)) return;
    npc.isFollower = true;
    followers.push(npc);
  }

  function update(playerPos) {
    const px = playerPos.x;
    const pz = playerPos.z;

    // Derive heading from movement; hold last heading when standing still.
    if (lastX !== null) {
      const dx = px - lastX;
      const dz = pz - lastZ;
      if (Math.hypot(dx, dz) > 0.012) {
        const want = Math.atan2(dx, dz);
        // shortest-arc smoothing
        let diff = want - heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        heading += diff * 0.25;
      }
    }
    lastX = px;
    lastZ = pz;

    // Player-local basis: forward = (sin h, cos h), right = (cos h, -sin h).
    const fx = Math.sin(heading);
    const fz = Math.cos(heading);
    const rx = Math.cos(heading);
    const rz = -Math.sin(heading);

    followers.forEach((npc, idx) => {
      const { sx, sz } = slotOffset(idx);
      const tx = px + rx * sx + fx * sz;
      const tz = pz + rz * sx + fz * sz;

      const k = 0.18;
      const nx = npc.root.position.x + (tx - npc.root.position.x) * k;
      const nz = npc.root.position.z + (tz - npc.root.position.z) * k;
      npc.root.position.x = nx;
      npc.root.position.z = nz;
      npc.blob.position.x = nx;
      npc.blob.position.z = nz;
      npc.x = nx;
      npc.z = nz;
      // Face the same way the player is heading (marching alongside).
      npc.root.rotation.y = heading;
    });
  }

  return { add, update, count: () => followers.length };
}
