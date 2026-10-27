import { DODGE_ARENA as ARENA,isInsideArena } from '../../game3d/spatial.js';
import { attackTrajectory,trajectoryTouches } from './geometry.js';
import { VARIANTS } from './projectiles.js';
import { DODGE_MOVEMENT_SPEED } from '../movement.js';
export const SAFETY=Object.freeze({horizon:2.2,reaction:.18,step:.04,directions:16,margin:.15,speed:DODGE_MOVEMENT_SPEED});
/** Finite straight escape probes, never a proof of universal reachability. */
export function hasEscape(player,threats,{horizon=SAFETY.horizon,reaction=SAFETY.reaction,playerSpeed=SAFETY.speed}={}) {
  if(!isInsideArena(player,ARENA)||!Array.isArray(threats)||threats.length>20||!Number.isFinite(horizon)||horizon<=0||horizon>3||!Number.isFinite(reaction)||reaction<0||!Number.isFinite(playerSpeed)||playerSpeed<=0||playerSpeed>20)return false;
  if(threats.some(p=>!VARIANTS[p.variant]||![p.position?.x,p.position?.z,p.direction?.x,p.direction?.z,p.radius,p.speed,p.ttl,p.age,p.range,p.distance].every(Number.isFinite)||p.radius<=0||p.speed<0||p.ttl<=0||p.age<0||p.range<0||p.distance<0||(p.windup!==undefined&&(!Number.isFinite(p.windup)||p.windup<0))||(p.shape==='beam'&&(!Number.isFinite(p.length)||p.length<=0))||(p.shape==='ring'&&(!Number.isFinite(p.wallWidth)||p.wallWidth<0))))return false;
  for(let probe=0;probe<=SAFETY.directions;probe++){
    const angle=probe/SAFETY.directions*2*Math.PI;
    const at=t=>({x:Math.max(ARENA.bounds.minX,Math.min(ARENA.bounds.maxX,player.x+(probe===SAFETY.directions?0:Math.sin(angle))*playerSpeed*Math.max(0,t-reaction))),z:Math.max(ARENA.bounds.minZ,Math.min(ARENA.bounds.maxZ,player.z+(probe===SAFETY.directions?0:Math.cos(angle))*playerSpeed*Math.max(0,t-reaction)))});
    let safe=true;
    for(let t=0;t<horizon&&safe;t+=SAFETY.step){
      const end=Math.min(horizon,t+SAFETY.step),startPlayer=at(t);
      for(const p of threats){
        const windup=p.windup??0,travel=p.speed*Math.max(0,p.age-windup),origin=p.origin??{x:p.position.x-p.direction.x*travel,z:p.position.z-p.direction.z*travel};
        const future={...p,origin,windup};
        const trajectory=attackTrajectory(future,p.age+t,p.age+end,startPlayer,at(end));
        if(trajectory&&trajectoryTouches(trajectory,SAFETY.margin)){safe=false;break;}
      }
    }
    if(safe)return true;
  }
  return false;
}
