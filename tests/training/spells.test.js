import { it,expect } from 'vitest';
import { VARIANTS,createProjectiles } from '../../src/training/dodge/projectiles.js';
import { chooseCasterOrigin,createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { createRandom } from '../../src/core/random.js';
import { DODGE_ARENA as ARENA } from '../../src/game3d/spatial.js';
import { hasEscape } from '../../src/training/dodge/fairness.js';
import { createKitingPractice } from '../../src/training/kiting/practice.js';
import { kitingDifficulty } from '../../src/training/kiting/difficulty.js';
import { validateKitingRecord,createKitingRecord } from '../../src/persistence/kitingRecord.js';
import { createKitingAttempt } from '../../src/training/kiting/attempt.js';
import { calculateKitingScore } from '../../src/training/kiting/score.js';
import { createSession } from '../../src/training/session.js';
const zero={x:0,z:0},dir={x:0,z:1};
const cast=(variant,extra={})=>({variant,origin:variant==='sun_beam'||variant==='arcane_bolt'?{x:0,z:-22}:zero,direction:dir,config:VARIANTS[variant],...extra});
it('places all casters outside every playable edge with a minimum stand-off even near corners',()=>{
 const random=createRandom(76);for(const player of [zero,{x:18,z:14},{x:-18,z:-14},{x:18,z:0},{x:0,z:14}])for(let i=0;i<100;i++){const p=chooseCasterOrigin(player,random);expect(Math.abs(p.x)>ARENA.width/2||Math.abs(p.z)>ARENA.length/2).toBe(true);expect(Math.hypot(p.x-player.x,p.z-player.z)).toBeGreaterThanOrEqual(9-1e-8);}
 let draws=0;const p=chooseCasterOrigin({x:0,z:14},()=>{draws++;return 0;});expect(draws).toBe(16);expect(Math.hypot(p.x,p.z-14)).toBeGreaterThan(9);expect(()=>chooseCasterOrigin(zero,()=>NaN)).toThrow();
});
it('never damages during a ground telegraph and clips the damaging interval at warning and expiry boundaries',()=>{
 for(const variant of ['artillery','flame_circle','sun_beam']){const events=[],p=createProjectiles({onEvent:e=>events.push(e)});p.spawn(cast(variant));const delay=VARIANTS[variant].windup;p.update(delay,zero,zero);expect(events.some(e=>e.type==='impact')).toBe(false);p.update(.01,zero,zero);expect(events.filter(e=>e.type==='impact')).toHaveLength(1);expect(p.snapshot()).toHaveLength(0);}
 const events=[],p=createProjectiles({onEvent:e=>events.push(e)});p.spawn(cast('artillery'));p.update(1.5,zero,{x:6,z:0});expect(events.some(e=>e.type==='impact')).toBe(false);expect(p.snapshot()).toHaveLength(0);
});
it('makes the cage center safe and detects crossing the active wall without treating the disk as filled',()=>{
 const events=[],p=createProjectiles({onEvent:e=>events.push(e)});p.spawn(cast('cage'));p.update(1.3,zero,zero);expect(events.some(e=>e.type==='impact')).toBe(false);p.update(.1,zero,{x:5,z:0});expect(events.filter(e=>e.type==='impact')).toHaveLength(1);
 const escaped=createProjectiles({onEvent:e=>events.push(e)});escaped.spawn(cast('cage'));escaped.update(.6,zero,{x:5,z:0});escaped.update(.7,{x:5,z:0},{x:5,z:0});expect(events.filter(e=>e.type==='impact')).toHaveLength(1);
});
it('uses the visible beam width for grazing contacts, and the entire fast bolt sweep at low frame rates',()=>{
 for(const [x,hit]of [[1.64,true],[1.66,false]]){const events=[],p=createProjectiles({onEvent:e=>events.push(e)});p.spawn(cast('sun_beam'));p.update(1.2,{x,z:0},{x,z:0});expect(events.some(e=>e.type==='impact')).toBe(hit);}
 const events=[],p=createProjectiles({onEvent:e=>events.push(e)});p.spawn(cast('arcane_bolt'));p.update(1.7,zero,zero);expect(events.some(e=>e.type==='impact')).toBe(true);
});
it('freezes warning timers while paused and keeps an announced target fixed after player and camera movement',()=>{
 let running=true;const game=createTechnicalDodge({level:5,rng:createRandom(5),isRunning:()=>running});game.update(.7,zero,zero);const p=game.snapshot().projectiles[0];expect(p.phase).toBe('warning');expect(p.caster).toBeTruthy();running=false;const frozen=game.snapshot();game.update(5,zero,{x:8,z:8});expect(game.snapshot()).toEqual(frozen);running=true;game.update(.05,zero,{x:1,z:0});const current=game.snapshot().projectiles.find(x=>x.id===p.id);expect(current.origin).toEqual(p.origin);expect(current.caster).toEqual(p.caster);expect(current.direction).toEqual(p.direction);game.dispose();
});
it('admits warned spells with a reachable escape and rejects an already active circular overlap',()=>{
 const data={variant:'flame_circle',shape:'circle',position:zero,origin:zero,direction:dir,radius:2.5,speed:0,ttl:1.5,windup:1.15,age:0,distance:0,range:0};expect(hasEscape(zero,[data],{horizon:2.2})).toBe(true);expect(hasEscape(zero,[{...data,windup:0}])).toBe(false);
});
it('keeps earlier wave records valid while storing the new pursuit speed with its configuration version',()=>{
 const session=createSession({countdown:0,timeLimit:60}),practice=createKitingPractice({variant:'waves'}),attempt=createKitingAttempt({session,practice,variant:'waves',level:1});session.start();practice.start();for(let i=0;i<601;i++){session.update(.1);attempt.evaluate();}const m=attempt.snapshot(),record=createKitingRecord(m,calculateKitingScore(m));expect(record.metrics.config).toMatchObject({configVersion:'kiting-waves-v2',playerSpeed:8,targetSpeed:4.5});const legacy={...record,metrics:{...m,config:kitingDifficulty(1,'waves',{legacy:true})}};expect(validateKitingRecord(legacy)).toBe(legacy);expect(kitingDifficulty(10,'waves').targetSpeed).toBeCloseTo(7.65);
});
