import { ARENA,isInsideArena } from '../../game3d/spatial.js';
import { sweptCircle } from './collision.js';
import { PLAYER_RADIUS,VARIANTS } from './projectiles.js';
export const SAFETY=Object.freeze({horizon:1.2,reaction:.18,step:.06,directions:16,margin:.15,speed:7});
/** Finite straight escape probes, never a proof of universal reachability. */
export function hasEscape(player,threats,{horizon=SAFETY.horizon,reaction=SAFETY.reaction}={}) {
  if(!isInsideArena(player)||!Array.isArray(threats)||threats.length>20||!Number.isFinite(horizon)||horizon<=0||horizon>3||!Number.isFinite(reaction)||reaction<0)return false;
  if(threats.some(p=>!VARIANTS[p.variant]||![p.position?.x,p.position?.z,p.direction?.x,p.direction?.z,p.radius,p.speed,p.ttl,p.age,p.range,p.distance].every(Number.isFinite)||p.radius<=0||p.speed<0||p.ttl<=0||p.age<0||p.range<0||p.distance<0))return false;
  for(let probe=0;probe<=SAFETY.directions;probe++){
    const angle=probe/SAFETY.directions*2*Math.PI;
    const at=t=>({x:Math.max(ARENA.bounds.minX,Math.min(ARENA.bounds.maxX,player.x+(probe===SAFETY.directions?0:Math.sin(angle))*SAFETY.speed*Math.max(0,t-reaction))),z:Math.max(ARENA.bounds.minZ,Math.min(ARENA.bounds.maxZ,player.z+(probe===SAFETY.directions?0:Math.cos(angle))*SAFETY.speed*Math.max(0,t-reaction)))});
    let safe=true;
    for(let t=0;t<horizon&&safe;t+=SAFETY.step){
      const end=Math.min(horizon,t+SAFETY.step),startPlayer=at(t);
      for(const p of threats){
        const lifetime=Math.min(p.ttl-p.age,p.variant==='aoe_zone'?Infinity:Math.max(0,p.range-p.distance)/Math.max(p.speed,1e-9));
        if(t>=lifetime)continue;
        const until=Math.min(end,lifetime),endPlayer=at(until);
        const start={x:p.position.x+p.direction.x*p.speed*t-startPlayer.x,z:p.position.z+p.direction.z*p.speed*t-startPlayer.z};
        const finish={x:p.position.x+p.direction.x*p.speed*until-endPlayer.x,z:p.position.z+p.direction.z*p.speed*until-endPlayer.z};
        if(sweptCircle(start,finish,PLAYER_RADIUS+p.radius+SAFETY.margin)!==null){safe=false;break;}
      }
    }
    if(safe)return true;
  }
  return false;
}
