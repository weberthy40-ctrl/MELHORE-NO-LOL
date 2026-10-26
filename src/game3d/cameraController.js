import { ARENA } from './spatial.js';
import { safeDelta } from '../training/movement.js';
export const ZOOM = Object.freeze({min:0.65,max:1.6,initial:1});
export function createCameraController() {
  let locked = true, zoom = ZOOM.initial, center = {...ARENA.center};
  return {
    snapshot:()=>Object.freeze({locked,zoom,center:Object.freeze({...center})}),
    toggle() {locked=!locked;},
    wheel(delta, mode=0) {
      if (!Number.isFinite(delta) || ![0,1,2].includes(mode)) return;
      const normalized = Math.max(-200,Math.min(200,delta*(mode===1?16:mode===2?500:1)));
      zoom = Math.max(ZOOM.min,Math.min(ZOOM.max,zoom*Math.exp(normalized*0.0015)));
    },
    update(position,pan,dt,preferences) {
      if(locked) center={...position};
      else if(preferences.edgePanEnabled) {
        const length = Math.max(1,Math.hypot(pan.x,pan.z)), step = 12*preferences.edgePanSpeed*safeDelta(dt);
        center.x = Math.max(ARENA.bounds.minX,Math.min(ARENA.bounds.maxX,center.x+pan.x/length*step));
        center.z = Math.max(ARENA.bounds.minZ,Math.min(ARENA.bounds.maxZ,center.z+pan.z/length*step));
      }
      return {...center};
    },
  };
}
export function edgeIntent(x,y,width,height) {
  if (![x,y,width,height].every(Number.isFinite) || width<=0 || height<=0 || x<0 || y<0 || x>width || y>height) return {x:0,z:0};
  const edge=Math.min(40,Math.max(15,Math.min(width,height)*0.07));
  const horizontal = x<edge?-1:x>width-edge?1:0, vertical=y<edge?-1:y>height-edge?1:0;
  return {x:horizontal,z:vertical};
}
