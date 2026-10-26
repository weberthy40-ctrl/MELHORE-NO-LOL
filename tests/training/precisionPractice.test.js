import { describe,it,expect } from 'vitest';
import { createPrecisionPractice,reflectedPosition } from '../../src/training/precision/practice.js';
import { createRandom } from '../../src/training/dodge/random.js';
describe('precision target identity and motion',()=>{
 it('has four independent variants with exact nominal cardinality',()=>{
  for(const [variant,count]of [['single-static',1],['single-moving',1],['multi-static',3],['multi-moving',3]]){
   const p=createPrecisionPractice({variant,rng:createRandom(3)});expect(p.snapshot().accuracy).toBeNull();expect(p.start()).toBe(true);expect(p.snapshot().targets).toHaveLength(count);expect(new Set(p.snapshot().targets.map(t=>t.id)).size).toBe(count);p.dispose();
  }
 });
 it('replaces only a hit target, rejects stale ids and keeps click accounting exact',()=>{
  const p=createPrecisionPractice({variant:'multi-static',rng:createRandom(5)});p.start();const [a,b,c]=p.snapshot().targets;
  expect(p.hit(a.id)).toBe(true);expect(p.hit(a.id)).toBe(false);expect(p.snapshot().targets.slice(0,2)).toEqual([b,c]);p.miss();
  expect(p.snapshot()).toMatchObject({hits:1,misses:1,clicksEligible:2,accuracy:.5});const before=p.snapshot().targets;p.update(.1);expect(p.snapshot().targets).toEqual(before);
  p.reset();expect(p.snapshot().hits).toBe(0);p.start();expect(p.snapshot().targets.some(t=>t.id===a.id)).toBe(false);p.dispose();expect(p.hit(b.id)).toBe(false);expect(p.miss()).toBe(false);
 });
 it('reflects with frame-independent bounded positions and ignores invalid deltas',()=>{
  let a={x:0,direction:1},b={...a};for(let i=0;i<100;i++)a=reflectedPosition(a.x,a.direction,-2,2,2,.1);for(let i=0;i<1000;i++)b=reflectedPosition(b.x,b.direction,-2,2,2,.01);
  expect(a.x).toBeCloseTo(b.x);expect(Math.abs(a.x)).toBeLessThanOrEqual(2);expect(reflectedPosition(0,1,-2,2,2,NaN).x).toBe(0);
 });
 it('limits unsafe spawn work and reports a reduced safe target count',()=>{
  let calls=0;const p=createPrecisionPractice({variant:'multi-moving',rng:()=>{calls++;return .5;}});p.setProjectionValidator(()=>false);expect(p.start()).toBe(false);expect(p.snapshot().targets).toHaveLength(0);expect(calls).toBeLessThanOrEqual(64);expect(p.snapshot().fallback).toBe(true);p.dispose();
 });
});
