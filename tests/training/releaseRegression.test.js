import { it,expect } from 'vitest';
import { createRandom } from '../../src/core/random.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { difficultyFor } from '../../src/training/dodge/difficulty.js';
import { DODGE_MOVEMENT_SPEED } from '../../src/training/movement.js';
import { ARENA } from '../../src/game3d/spatial.js';
import { PLAYER_RADIUS } from '../../src/training/dodge/projectiles.js';
// Independent fine-step oracle: actual speed, rectangular boundary and no safety margin.
function escapeWitness(player,threats){
 for(let direction=0;direction<=16;direction++){const angle=direction*Math.PI/8;let safe=true;
  for(let step=0;step<=240&&safe;step++){const t=step*.005,travel=DODGE_MOVEMENT_SPEED*Math.max(0,t-.18),x=Math.max(ARENA.bounds.minX,Math.min(ARENA.bounds.maxX,player.x+(direction===16?0:Math.sin(angle)*travel))),z=Math.max(ARENA.bounds.minZ,Math.min(ARENA.bounds.maxZ,player.z+(direction===16?0:Math.cos(angle)*travel)));
   for(const threat of threats){if(threat.age+t>=threat.ttl||(threat.variant!=='aoe_zone'&&threat.distance+threat.speed*t>=threat.range))continue;const dx=threat.position.x+threat.direction.x*threat.speed*t-x,dz=threat.position.z+threat.direction.z*threat.speed*t-z;if(dx*dx+dz*dz<=(PLAYER_RADIUS+threat.radius)**2){safe=false;break;}}
  }if(safe)return true;
 }return false;
}
it('admits all four attacks at every level with bounded concurrency and an independently sampled escape witness',()=>{
 for(let level=1;level<=10;level++){
  const seen=new Set(),profile=difficultyFor(level);let game,current={x:0,z:0},admissions=0;
  game=createTechnicalDodge({level,rng:createRandom(123),events:{emit(type,event){if(type==='dodge:spawn'){seen.add(event.variant);admissions++;expect(escapeWitness(current,game.snapshot().projectiles)).toBe(true);}}}});
  for(let frame=0;frame<2400;frame++){const before=current,t=(frame+1)*.05;current={x:5*Math.sin(t*.7),z:5*Math.sin(t*.4)};game.update(.05,before,current);expect(game.snapshot().projectiles.length).toBeLessThanOrEqual(profile.capacity);}
  expect(seen.size).toBe(4);expect(admissions).toBeGreaterThan(10);game.dispose();
 }
},15000);
