import { ARENA, isInsideArena } from '../game3d/spatial.js';
export const safeDelta = dt => Number.isFinite(dt) && dt > 0 ? Math.min(dt,0.1) : 0;
export const MOVEMENT_SPEED = 11;
export function createMovement({ position = ARENA.center, speed = MOVEMENT_SPEED } = {}) {
  if (!isInsideArena(position) || !Number.isFinite(speed) || speed <= 0) throw new TypeError('Invalid movement configuration.');
  let current = {...position}, target = null, angle = 0;
  const snapshot = () => Object.freeze({position:Object.freeze({...current}),target:target ? Object.freeze({...target}) : null,angle});
  return { snapshot, stop(){target=null;}, moveTo(point) { if(!isInsideArena(point)) return false; target = {...point}; return true; },
    update(delta) {
      if (!target) return snapshot();
      const dx = target.x-current.x, dz = target.z-current.z, distance = Math.hypot(dx,dz), step = speed*safeDelta(delta);
      if (distance < 1e-6) {target=null;return snapshot();}
      angle = Math.atan2(dx,dz);
      if (step >= distance) {current={...target};target=null;}
      else {current.x += dx/distance*step;current.z += dz/distance*step;}
      return snapshot();
    } };
}
