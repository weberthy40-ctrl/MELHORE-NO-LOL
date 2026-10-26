import { describe,expect,it } from 'vitest';
import { sweptCircle } from '../../src/training/dodge/collision.js';
import { createProjectiles } from '../../src/training/dodge/projectiles.js';
import { createSelector,createRandom } from '../../src/training/dodge/random.js';
import { createTechnicalDodge,chooseAreaOrigin } from '../../src/training/dodge/technicalDodge.js';
describe('swept relative collision',()=>{
  it('detects high-speed crossings, tangencies and overlap without near misses',()=>{
    expect(sweptCircle({x:-10,z:0},{x:10,z:0},1)).toBeCloseTo(.45);
    expect(sweptCircle({x:-10,z:1},{x:10,z:1},1)).toBe(.5);
    expect(sweptCircle({x:-10,z:1.001},{x:10,z:1.001},1)).toBeNull();
    expect(sweptCircle({x:0,z:0},{x:0,z:0},1)).toBe(0);
  });
  it('detects player/projectile relative motion and emits only one impact',()=>{
    const events=[],projectiles=createProjectiles({onEvent:e=>events.push(e)});
    projectiles.spawn({origin:{x:-5,z:0},direction:{x:1,z:0}});
    projectiles.update(1,{x:0,z:-1},{x:0,z:1});projectiles.update(1,{x:0,z:0},{x:0,z:0});
    expect(events.filter(e=>e.type==='impact')).toHaveLength(1);expect(projectiles.snapshot()).toHaveLength(0);
  });
  it('limits collision to time alive and distinguishes both variants',()=>{
    const events=[],projectiles=createProjectiles({onEvent:e=>events.push(e),capacity:1});
    projectiles.spawn({origin:{x:0,z:0},direction:{x:1,z:0},config:{speed:1,radius:.2,ttl:.1,range:10}});
    expect(projectiles.spawn({origin:{x:0,z:0},direction:{x:1,z:0}})).toBeNull();
    projectiles.update(10,{x:5,z:0},{x:5,z:0});expect(events.some(e=>e.type==='impact')).toBe(false);expect(projectiles.snapshot()).toHaveLength(0);
    expect(()=>projectiles.spawn({origin:{x:0,z:0},direction:{x:0,z:0}})).toThrow();
  });
});
describe('attack selection and spawning',()=>{
  it('is seeded, bounds repeats, and leaves active trajectories unchanged',()=>{
    const a=createSelector({rng:createRandom(42)}),b=createSelector({rng:createRandom(42)}),sequence=Array.from({length:100},()=>a());
    expect(sequence).toEqual(Array.from({length:100},()=>b()));expect(sequence.join(',')).not.toMatch(/(fast,){4}|(slow,){4}/);
    const game=createTechnicalDodge({rng:createRandom(2),interval:.5});
    game.update(.5,{x:0,z:0},{x:0,z:0});const direction=game.snapshot().projectiles[0].direction;
    game.update(.1,{x:0,z:0},{x:1,z:0});expect(game.snapshot().projectiles[0].direction).toEqual(direction);
    game.dispose();game.update(10,{x:0,z:0},{x:0,z:0});expect(game.snapshot().projectiles).toHaveLength(0);
  });
});

describe('hook and active areas',()=>{
  it('makes all four variants selectable without changing earlier selector defaults',()=>{
    const select=createSelector({weights:{fast:1,slow:1,hook_linear:1,aoe_zone:1},rng:createRandom(123)});
    expect(new Set(Array.from({length:100},()=>select())).size).toBe(4);
  });
  it('the hook cable cannot hit a player behind its moving head',()=>{
    const events=[],p=createProjectiles({onEvent:e=>events.push(e)});
    p.spawn({origin:{x:0,z:-10},direction:{x:0,z:1},variant:'hook_linear'});
    p.update(1,{x:3,z:-5},{x:3,z:-5});
    p.update(.1,{x:3,z:-5},{x:0,z:-5});
    expect(events.filter(e=>e.type==='impact')).toHaveLength(0);
    expect(p.snapshot()[0].origin).toEqual({x:0,z:-10});
  });
  it('bounds area spawn attempts and never places an area initially on the player',()=>{
    let calls=0;expect(chooseAreaOrigin({x:0,z:0},[],()=>{calls++;return .5;})).toBeNull();expect(calls).toBe(16);
    const position=chooseAreaOrigin({x:0,z:0},[],()=>.99);expect(Math.hypot(position.x,position.z)).toBeGreaterThan(4.9);
    expect(()=>chooseAreaOrigin({x:0,z:0},[],()=>.5,{attempts:Infinity})).toThrow();
  });
  it('sweeps a crossing through the active area but never hits after expiry',()=>{
    const events=[],p=createProjectiles({onEvent:e=>events.push(e)});
    p.spawn({origin:{x:0,z:0},direction:{x:1,z:0},variant:'aoe_zone'});
    p.update(.1,{x:-5,z:0},{x:5,z:0});p.update(.1,{x:0,z:0},{x:0,z:0});
    expect(events.filter(e=>e.type==='impact')).toHaveLength(1);expect(p.snapshot()).toHaveLength(0);
    const second=createProjectiles({onEvent:e=>events.push(e)});
    second.spawn({origin:{x:0,z:0},direction:{x:1,z:0},variant:'aoe_zone'});
    second.update(10,{x:-10,z:0},{x:0,z:0});
    expect(events.filter(e=>e.type==='impact')).toHaveLength(1);expect(second.snapshot()).toHaveLength(0);
  });
});
