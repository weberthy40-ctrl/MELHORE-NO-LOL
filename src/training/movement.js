import { ARENA,isInsideArena } from '../game3d/spatial.js';
export const safeDelta=dt=>Number.isFinite(dt)&&dt>0?Math.min(dt,.1):0;
export const MOVEMENT_SPEED=11;
export const DODGE_MOVEMENT_SPEED=5.8;
export const KITING_MOVEMENT_SPEED=8;
export function createMovement({arena=ARENA,position=arena.center,speed=MOVEMENT_SPEED}={}){
 if(!isInsideArena(position,arena)||!Number.isFinite(speed)||speed<=0)throw new TypeError('Invalid movement configuration.');
 let current={...position},target=null,angle=0,dashing=null;
 const bounded=p=>({x:Math.max(arena.bounds.minX,Math.min(arena.bounds.maxX,p.x)),z:Math.max(arena.bounds.minZ,Math.min(arena.bounds.maxZ,p.z))});
 const snapshot=()=>Object.freeze({position:Object.freeze({...current}),target:target?Object.freeze({...target}):null,angle,dash:dashing?Object.freeze({remaining:dashing.duration-dashing.elapsed,duration:dashing.duration}):null});
 function destination(point,range){if(!point||![point.x,point.z,range].every(Number.isFinite)||range<=0)return null;const dx=point.x-current.x,dz=point.z-current.z,d=Math.hypot(dx,dz);if(d<1e-6)return null;const step=Math.min(d,range),next=bounded({x:current.x+dx/d*step,z:current.z+dz/d*step});if(Math.hypot(next.x-current.x,next.z-current.z)<1e-6)return null;angle=Math.atan2(dx,dz);return next;}
 return {snapshot,stop(){target=null;dashing=null;},blink(point,range=4){const next=destination(point,range);if(!next)return false;current=next;target=null;dashing=null;return true;},dash(point,{range=1.8,duration=.14}={}){if(dashing||!Number.isFinite(duration)||duration<.06||duration>1)return false;const next=destination(point,range);if(!next)return false;dashing={from:{...current},to:next,elapsed:0,duration};target=null;return true;},moveTo(point){if(!isInsideArena(point,arena))return false;target={...point};return true;},update(delta){
  let dt=safeDelta(delta);if(dashing){const used=Math.min(dt,dashing.duration-dashing.elapsed);dashing.elapsed+=used;const t=Math.min(1,dashing.elapsed/dashing.duration);current={x:dashing.from.x+(dashing.to.x-dashing.from.x)*t,z:dashing.from.z+(dashing.to.z-dashing.from.z)*t};dt-=used;if(t>=1-1e-9){current={...dashing.to};dashing=null;}else return snapshot();}
  if(!target)return snapshot();const dx=target.x-current.x,dz=target.z-current.z,distance=Math.hypot(dx,dz),step=speed*dt;if(distance<1e-6){target=null;return snapshot();}angle=Math.atan2(dx,dz);if(step>=distance){current={...target};target=null;}else{current.x+=dx/distance*step;current.z+=dz/distance*step;}return snapshot();
 }};
}
