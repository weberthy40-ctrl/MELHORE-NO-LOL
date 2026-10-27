export const ARENA = Object.freeze({ width: 26, length: 38, groundY: 0, margin: 7,
  center: Object.freeze({ x: 0, z: 0 }),
  bounds: Object.freeze({ minX: -13, maxX: 13, minZ: -19, maxZ: 19 }) });
/** Y is vertical; Z is lane length. The boundary is included. */
export function isInsideArena(position, arena=ARENA) {
  const { minX, maxX, minZ, maxZ } = arena.bounds;
  return Number.isFinite(position?.x) && Number.isFinite(position?.z)
    && position.x >= minX && position.x <= maxX && position.z >= minZ && position.z <= maxZ;
}

/** Dodge owns a wider, shorter arena. Other modalities keep ARENA unchanged. */
export const DODGE_ARENA = Object.freeze({width:36,length:28,groundY:0,margin:7,center:Object.freeze({x:0,z:0}),bounds:Object.freeze({minX:-18,maxX:18,minZ:-14,maxZ:14})});
