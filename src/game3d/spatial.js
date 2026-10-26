export const ARENA = Object.freeze({ width: 26, length: 38, groundY: 0, margin: 7,
  center: Object.freeze({ x: 0, z: 0 }),
  bounds: Object.freeze({ minX: -13, maxX: 13, minZ: -19, maxZ: 19 }) });
/** Y is vertical; Z is lane length. The boundary is included. */
export function isInsideArena(position) {
  const { minX, maxX, minZ, maxZ } = ARENA.bounds;
  return Number.isFinite(position?.x) && Number.isFinite(position?.z)
    && position.x >= minX && position.x <= maxX && position.z >= minZ && position.z <= maxZ;
}
