import { it,expect } from 'vitest';
import { createRandom } from '../../src/core/random.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { difficultyFor } from '../../src/training/dodge/difficulty.js';
import { ARENA } from '../../src/game3d/spatial.js';
import { PLAYER_RADIUS } from '../../src/training/dodge/projectiles.js';
// Independent fine-step oracle: actual speed, rectangular boundary and no safety margin.
function escapeWitness(player,threats,profile){
 for(let direction=0;direction<=16;direction++){const angle=direction*Math.PI/8;let safe=true;
  for(let step=0;step<=440&&safe;step++){const t=step*.005,travel=profile.playerSpeed*Math.max(0,t-profile.reaction),x=Math.max(ARENA.bounds.minX,Math.min(ARENA.bounds.maxX,player.x+(direction===16?0:Math.sin(angle)*travel))),z=Math.max(ARENA.bounds.minZ,Math.min(ARENA.bounds.maxZ,player.z+(direction===16?0:Math.cos(angle)*travel)));
   for(const p of threats){const age=p.age+t;if(age<(p.windup??0)||age>=p.ttl)continue;let distance;const px=p.origin.x+p.direction.x*p.speed*Math.max(0,age-(p.windup??0)),pz=p.origin.z+p.direction.z*p.speed*Math.max(0,age-(p.windup??0));
    if(p.shape==='beam'){const dot=(x-p.origin.x)*p.direction.x+(z-p.origin.z)*p.direction.z,u=Math.max(0,Math.min(p.length,dot));distance=Math.hypot(x-p.origin.x-p.direction.x*u,z-p.origin.z-p.direction.z*u);}
    else distance=Math.hypot(x-px,z-pz);
    if(p.shape==='ring'?Math.abs(distance-p.radius)<=PLAYER_RADIUS+p.wallWidth:distance<=PLAYER_RADIUS+p.radius){safe=false;break;}}

  }if(safe)return true;
 }return false;
}
it('admits all five spells at every level with bounded concurrency and an independently sampled escape witness',()=>{
 for(let level=1;level<=10;level++){
  const seen=new Set(),profile=difficultyFor(level);let game,current={x:0,z:0},admissions=0;
  game=createTechnicalDodge({level,rng:createRandom(123),events:{emit(type,event){if(type==='dodge:spawn'){seen.add(event.variant);admissions++;expect(escapeWitness(current,game.snapshot().projectiles,profile)).toBe(true);}}}});
  for(let frame=0;frame<2400;frame++){const before=current,t=(frame+1)*.05;current={x:5*Math.sin(t*.7),z:5*Math.sin(t*.4)};game.update(.05,before,current);expect(game.snapshot().projectiles.length).toBeLessThanOrEqual(profile.capacity);}
  expect(seen.size).toBe(5);expect(admissions).toBeGreaterThan(10);game.dispose();
 }
},30000);
