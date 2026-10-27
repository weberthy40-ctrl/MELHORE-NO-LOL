import { it,expect } from 'vitest';
import { createAttackData,VARIANTS } from '../../src/training/dodge/projectiles.js';
import { allowsCageCombination } from '../../src/training/dodge/cageSafety.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { createRandom } from '../../src/core/random.js';
import { createMovement } from '../../src/training/movement.js';
import { DODGE_ARENA } from '../../src/game3d/spatial.js';
import { difficultyFor } from '../../src/training/dodge/difficulty.js';
const zero={x:0,z:0};
const shot=variant=>createAttackData({variant,origin:VARIANTS[variant].shape==='bolt'||VARIANTS[variant].shape==='beam'?{x:0,z:-10}:zero,direction:{x:0,z:1}});
it('keeps wide shots, beams, areas and duplicate cages out of the cage encounter',()=>{
 const cage=shot('cage');for(const id of ['heavy_lance','sun_beam','flame_circle','meteor_rain','cage'])expect(allowsCageCombination(shot(id),[cage],zero,20)).toBe(false);
 expect(allowsCageCombination(shot('arcane_bolt'),[cage],zero,10)).toBe(true);expect(allowsCageCombination(shot('arcane_bolt'),[cage,shot('arcane_bolt'),shot('needle_burst')],zero,10)).toBe(false);
 expect(allowsCageCombination(cage,[shot('sun_beam')],zero,20)).toBe(false);expect(allowsCageCombination(cage,[shot('dark_orb')],zero,20)).toBe(true);
});
it('reserves a readable cage window in an actual high-level run without piling broad areas inside it',()=>{
 const game=createTechnicalDodge({level:20,rng:createRandom(123)});let cages=0;
 for(let n=0;n<2400;n++){game.update(.05,zero,zero);const active=game.snapshot().projectiles,ring=active.find(p=>p.shape==='ring');if(ring){cages++;expect(active.filter(p=>p.shape==='ring')).toHaveLength(1);expect(active.filter(p=>p.shape!=='ring'&&p.shape!=='bolt')).toHaveLength(0);expect(active.filter(p=>p.shape==='bolt'&&p.radius>.6)).toHaveLength(0);}}
 expect(cages).toBeGreaterThan(0);game.dispose();
});
it('stages dangerous control spells after fundamentals and spaces level five below the previous barrage',()=>{
 expect(Object.keys(difficultyFor(5).weights)).not.toContain('cage');expect(difficultyFor(5).interval).toBeGreaterThan(.5);expect(difficultyFor(5).capacity).toBeLessThanOrEqual(5);expect(Object.keys(difficultyFor(9).weights)).toContain('cage');expect(difficultyFor(20).interval).toBeLessThan(difficultyFor(5).interval);
});
it('preserves walking intent through dash and Flash, while S still stops the entire action',()=>{
 const m=createMovement({arena:DODGE_ARENA,speed:5.8});m.moveTo({x:12,z:0});m.dash({x:12,z:0},{continueMoving:true});m.update(.1);m.update(.1);expect(m.snapshot().position.x).toBeGreaterThan(2.6);expect(m.snapshot().target).toEqual({x:12,z:0});m.blink({x:12,z:0},4,{continueMoving:true});const at=m.snapshot().position.x;m.update(.1);expect(m.snapshot().position.x).toBeCloseTo(at+.58);m.stop();const stopped=m.snapshot();m.update(.1);expect(m.snapshot().position).toEqual(stopped.position);expect(m.snapshot().target).toBeNull();
});
