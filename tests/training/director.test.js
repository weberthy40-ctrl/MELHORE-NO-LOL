import { describe,it,expect } from 'vitest';
import { hasEscape } from '../../src/training/dodge/fairness.js';
import { difficultyFor,DIFFICULTIES,validateDifficulty } from '../../src/training/dodge/difficulty.js';
import { createRandom } from '../../src/training/dodge/random.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
const area=(x,z,radius=2)=>({variant:'aoe_zone',position:{x,z},direction:{x:0,z:1},radius,speed:0,ttl:3,age:0,range:0,distance:0});
describe('admission and difficulty',()=>{
  it('accepts a reachable escape and rejects initial overlap or unknown threats',()=>{
    expect(hasEscape({x:0,z:0},[area(6,10)])).toBe(true);
    expect(hasEscape({x:0,z:0},[area(0,0)])).toBe(false);
    expect(hasEscape({x:8,z:18},[area(8,18,5)])).toBe(false);
    expect(hasEscape({x:0,z:0},[{variant:'unknown'}])).toBe(false);
  });
  it('introduces abilities gradually across twenty profiles with monotonic pressure and safe fallback',()=>{
    expect(DIFFICULTIES).toHaveLength(20);
    for(const profile of DIFFICULTIES){expect(validateDifficulty(profile)).toBe(profile);expect(Object.keys(profile.weights)).toHaveLength(profile.level<=2?2:profile.level<=4?4:profile.level<=6?6:profile.level<=8?7:9);}
    expect(difficultyFor(1).interval).toBeGreaterThan(difficultyFor(5).interval);
    expect(difficultyFor(5).interval).toBeGreaterThan(difficultyFor(10).interval);
    for(const invalid of [0,21,NaN,Infinity,'bad'])expect(difficultyFor(invalid).level).toBe(1);
    expect(()=>validateDifficulty({...difficultyFor(1),comboChance:2})).toThrow();
  });
  it('reproduces decisions and enforces one admission per tick plus global limits',()=>{
    const a=createTechnicalDodge({level:10,rng:createRandom(29)}),b=createTechnicalDodge({level:10,rng:createRandom(29)});
    for(let frame=0;frame<600;frame++){
      const p={x:Math.sin(frame*.01)*5,z:0};const before=a.snapshot().shots;
      a.update(.1,p,p);b.update(.1,p,p);
      expect(a.snapshot()).toEqual(b.snapshot());expect(a.snapshot().shots-before).toBeLessThanOrEqual(1);
      expect(a.snapshot().projectiles.length).toBeLessThanOrEqual(difficultyFor(10).capacity);
    }
    expect(a.snapshot().peak).toBeGreaterThanOrEqual(2);expect(a.snapshot().combinations).toBeGreaterThan(0);
    a.dispose();b.dispose();
  },15000);
});
