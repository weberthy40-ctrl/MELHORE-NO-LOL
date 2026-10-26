import { ARENA, isInsideArena } from '../game3d/spatial.js';
export const safeDelta = dt => Number.isFinite(dt) && dt > 0 ? Math.min(dt,0.1) : 0;
export const MOVEMENT_SPEED = 11;
export const DODGE_MOVEMENT_SPEED = 8;
export const KITING_MOVEMENT_SPEED = 8;
export function createMovement({ position = ARENA.center, speed = MOVEMENT_SPEED } = {}) {
  if (!isInsideArena(position) || !Number.isFinite(speed) || speed <= 0) throw new TypeError('Invalid movement configuration.');
  let current = {...position}, target = null, angle = 0;
  const snapshot = () => Object.freeze({position:Object.freeze({...current}),target:target ? Object.freeze({...target}) : null,angle});
  return { snapshot, stop(){target=null;}, blink(point,range=4){if(!point||![point.x,point.z,range].every(Number.isFinite)||range<=0)return false;const dx=point.x-current.x,dz=point.z-current.z,d=Math.hypot(dx,dz);if(d<1e-6)return false;const step=Math.min(d,range),next={x:Math.max(ARENA.bounds.minX,Math.min(ARENA.bounds.maxX,current.x+dx/d*step)),z:Math.max(ARENA.bounds.minZ,Math.min(ARENA.bounds.maxZ,current.z+dz/d*step))};if(Math.hypot(next.x-current.x,next.z-current.z)<1e-6)return false;current=next;angle=Math.atan2(dx,dz);target=null;return true;}, moveTo(point) { if(!isInsideArena(point)) return false; target = {...point}; return true; },
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
