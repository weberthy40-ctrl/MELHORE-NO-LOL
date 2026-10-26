import {it,expect} from 'vitest';
import {createRandom} from '../../src/core/random.js';
import {createKitingPractice} from '../../src/training/kiting/practice.js';
import {kitingDifficulty} from '../../src/training/kiting/difficulty.js';
import {chooseProjectileOrigin,createTechnicalDodge} from '../../src/training/dodge/technicalDodge.js';
import {createAttemptRecord,validateAttemptRecord} from '../../src/persistence/attemptRecord.js';
import {kitingRecord} from '../fixtures/kitingRecord.js';
const advance=(p,seconds)=>{for(let i=0;i<Math.ceil(seconds*100);i++)p.update(.01);};
it('attacks from a distant ground click without A, chooses one enemy and never redirects a windup',()=>{
 const p=createKitingPractice({variant:'static'});p.start();expect(p.snapshot().targets).toHaveLength(2);
 expect(p.click({x:50,z:50})).toBe(true);expect(p.snapshot().selectedTargetId).toBe('kiting-target-2');expect(p.click({x:-50,z:-50})).toBe(false);
 advance(p,.3);expect(p.snapshot()).toMatchObject({hits:1,shots:1,accepted:1,lastAttack:{targetId:'kiting-target-2'}});
 advance(p,.7);expect(p.click({x:-50,z:-50})).toBe(true);advance(p,.3);expect(p.snapshot()).toMatchObject({hits:2,lastAttack:{targetId:'kiting-target'}});p.dispose();
});
it('scales population monotonically and keeps every pursuer bounded at its level speed',()=>{
 const counts=[];
 for(let level=1;level<=10;level++){
  const config=kitingDifficulty(level,'spacing'),p=createKitingPractice({variant:'spacing',level});p.start();counts.push(p.snapshot().targets.length);let before=p.snapshot().targets;
  for(let i=0;i<40;i++){p.update(.05);const after=p.snapshot().targets;for(const [j,t]of after.entries()){expect(Math.hypot(t.position.x-before[j].position.x,t.position.z-before[j].position.z)).toBeLessThanOrEqual(config.targetSpeed*.05+1e-7);expect(Math.abs(t.position.x)).toBeLessThanOrEqual(9);expect(Math.abs(t.position.z)).toBeLessThanOrEqual(19);}before=after;}
  expect(new Set(p.snapshot().targets.map(t=>t.id)).size).toBe(config.targetCount);p.dispose();
 }
 expect(counts).toEqual([2,2,3,3,4,4,5,5,6,6]);expect(kitingDifficulty(10,'spacing').targetSpeed).toBeGreaterThan(kitingDifficulty(1,'spacing').targetSpeed);
});
it('does not create attacks outside range and preserves confirmed attacks when movement resumes',()=>{
 let player={x:8,z:18};const p=createKitingPractice({variant:'static',playerPosition:()=>player});p.start();expect(p.click({x:0,z:0})).toBe(false);expect(p.snapshot().accepted).toBe(0);
 player={x:0,z:0};p.click({x:0,z:0});p.moveCommand();advance(p,1);expect(p.snapshot()).toMatchObject({hits:0,cancellations:1});p.click({x:0,z:0});advance(p,.3);p.moveCommand();expect(p.snapshot()).toMatchObject({hits:1,cancellations:1});p.dispose();
});
it('preserves single-target historical records and validates population in new records',()=>{
 const current=structuredClone(kitingRecord()),legacy=structuredClone(current);delete legacy.metrics.config.targetCount;legacy.gameVersion='1.0.0-rc.2';expect(validateAttemptRecord(legacy)).toBe(legacy);
 expect(createAttemptRecord(current.metrics,current.score).metrics.config.targetCount).toBe(2);current.metrics.config.targetCount=99;expect(()=>validateAttemptRecord(current)).toThrow();
});
it('randomizes safe projectile origins reproducibly across all directions with bounded retries',()=>{
 const rng=createRandom(42),rng2=createRandom(42),bins=new Set();
 for(let i=0;i<100;i++){const origin=chooseProjectileOrigin({x:0,z:0},rng);expect(origin).toEqual(chooseProjectileOrigin({x:0,z:0},rng2));expect(Math.hypot(origin.x,origin.z)).toBeGreaterThanOrEqual(7.5);expect(Math.hypot(origin.x,origin.z)).toBeLessThanOrEqual(11.5+1e-8);bins.add(Math.floor((Math.atan2(origin.x,origin.z)+Math.PI)/(Math.PI/4)));}
 expect(bins.size).toBe(8);expect(()=>chooseProjectileOrigin({x:0,z:0},()=>NaN)).toThrow();expect(()=>chooseProjectileOrigin({x:0,z:0},rng,{attempts:Infinity})).toThrow();
 let draws=0;expect(chooseProjectileOrigin({x:9,z:19},()=>{draws++;return 0;})).toBeNull();expect(draws).toBe(24);
});
it('uses varied actual launch points while leaving launched trajectories fixed',()=>{
 const origins=new Set(),game=createTechnicalDodge({level:8,rng:createRandom(9)});for(let i=0;i<600;i++){game.update(.05,{x:0,z:0},{x:0,z:0});for(const p of game.snapshot().projectiles)if(p.variant!=='aoe_zone')origins.add(`${p.origin.x.toFixed(2)}:${p.origin.z.toFixed(2)}`);}
 expect(origins.size).toBeGreaterThan(20);game.dispose();
});
it('keeps the technical exercise clock advancing beyond a minute for animation and projectile feedback',()=>{
 const p=createKitingPractice();p.start();for(let i=0;i<700;i++)p.update(.1);expect(p.snapshot().elapsed).toBeCloseTo(70);expect(p.click({x:-50,z:-50})).toBe(true);advance(p,.3);expect(p.snapshot().lastAttack.at).toBeGreaterThan(70);p.dispose();
});
