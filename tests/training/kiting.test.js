import { it,expect } from 'vitest';
import { createKitingPractice,inAttackRange } from '../../src/training/kiting/practice.js';
import { KITING_LEVELS,kitingDifficulty } from '../../src/training/kiting/difficulty.js';
import { createRandom } from '../../src/core/random.js';
import { createSession } from '../../src/training/session.js';
import { createKitingAttempt } from '../../src/training/kiting/attempt.js';
import { calculateKitingScore } from '../../src/training/kiting/score.js';
function tick(practice,seconds){for(let i=0;i<Math.round(seconds*100);i++)practice.update(.01);}
it('attacks on first click, confirms only after windup, respects inclusive range and prevents spam',()=>{
 const p=createKitingPractice();p.start();expect(p.click('kiting-target')).toBe(true);expect(p.snapshot()).toMatchObject({selected:true,hits:0});expect(p.click('kiting-target')).toBe(false);const config=p.snapshot().config;tick(p,config.windupDuration-.01);expect(p.snapshot().hits).toBe(0);tick(p,.01);expect(p.snapshot().hits).toBe(1);expect(p.snapshot().shots).toBe(1);expect(p.click('kiting-target')).toBe(false);tick(p,config.attackInterval-config.windupDuration);expect(p.click('kiting-target')).toBe(true);

 expect(inAttackRange({x:0,z:0},{x:3,z:4},5)).toBe(true);expect(inAttackRange({x:0,z:0},{x:3,z:4.001},5)).toBe(false);expect(inAttackRange({x:NaN,z:0},{x:0,z:0},5)).toBe(false);
});
it('cancels before confirmation, preserves confirmed hits and freezes with pause or disposal',()=>{
 let running=true;const p=createKitingPractice({isRunning:()=>running});p.start();p.click('kiting-target');p.click('kiting-target');tick(p,.1);p.moveCommand();tick(p,1);expect(p.snapshot()).toMatchObject({hits:0,cancellations:1});p.click('kiting-target');running=false;const before=p.snapshot();tick(p,1);expect(p.snapshot()).toEqual(before);expect(p.click('kiting-target')).toBe(false);running=true;tick(p,.25);expect(p.snapshot().hits).toBe(1);p.moveCommand();expect(p.snapshot().hits).toBe(1);p.dispose();tick(p,1);expect(p.snapshot().hits).toBe(1);
});
it('uses the current position at confirmation and never converts rejected requests into shots',()=>{
 let player={x:0,z:0};const p=createKitingPractice({playerPosition:()=>player});p.start();p.click('kiting-target');p.click('kiting-target');player={x:8,z:18};tick(p,.3);expect(p.snapshot()).toMatchObject({hits:0,shots:0,cancellations:1});tick(p,1);expect(p.click('kiting-target')).toBe(false);expect(p.snapshot().accepted).toBe(1);
});
it('keeps static targets fixed and moving/pursuit trajectories bounded, continuous and reproducible',()=>{
 expect(KITING_LEVELS).toHaveLength(10);
 for(const variant of ['static','moving','spacing'])for(const level of [1,10]){
  const config=kitingDifficulty(level,variant);expect(config.targetSpeed).toBeLessThan(7);expect(config.referenceHits).toBeLessThan(60/config.attackInterval);expect(config.minSampleHits).toBeLessThanOrEqual(config.referenceHits);
  const p=createKitingPractice({variant,level,rng:createRandom(42)}),q=createKitingPractice({variant,level,rng:createRandom(42)});p.start();q.start();let previous=p.snapshot().target.position;
  for(let i=0;i<1000;i++){p.update(.1);q.update(.1);const next=p.snapshot().target.position;expect(Math.hypot(next.x-previous.x,next.z-previous.z)).toBeLessThanOrEqual(config.targetSpeed*.1+1e-8);expect(Math.abs(next.x)).toBeLessThan(9);previous=next;}
  expect(p.snapshot()).toEqual(q.snapshot());if(variant==='static')expect(previous).toEqual({x:-3,z:-3});if(variant==='spacing')expect(Math.hypot(previous.x,previous.z)).toBeCloseTo(1.3);
 }
});
it('ends the shared sixty-second clock once, freezes its snapshot and scores inactivity zero',()=>{
 const session=createSession({countdown:0,timeLimit:60}),practice=createKitingPractice({isRunning:()=>session.snapshot().state==='running'}),attempt=createKitingAttempt({session,practice,variant:'static',level:1});practice.start();session.start();
 for(let i=0;i<601;i++){const before=session.snapshot().elapsed;session.update(.1);practice.update(session.snapshot().elapsed-before);attempt.evaluate();}
 const result=attempt.snapshot();expect(result.elapsedActiveSeconds).toBe(60);expect(calculateKitingScore(result).score).toBe(0);expect(attempt.evaluate()).toBe(result);practice.update(.1);expect(attempt.snapshot()).toBe(result);expect(calculateKitingScore({...result,endReason:'abandoned'}).score).toBeNull();
});
it('measures movement between real confirmed hits, excluding teleport and stationary spam',()=>{
 const p=createKitingPractice();p.start();p.click('kiting-target');p.click('kiting-target');tick(p,.9);p.update(.1,{x:0,z:0},{x:.7,z:0});p.update(.1,{x:.7,z:0},{x:1.4,z:0});p.click('kiting-target');tick(p,.9);expect(p.snapshot()).toMatchObject({hits:2,rhythmCycles:1,totalDistanceMoved:1.4});p.update(.1,{x:0,z:0},{x:8,z:18});p.click('kiting-target');tick(p,.9);expect(p.snapshot()).toMatchObject({hits:3,rhythmCycles:1});
});
it('scores activity, real rhythm and six-window consistency with a visible activity gate',()=>{
 const base={attemptId:'score',origin:'official',modality:'kiting',metricsVersion:'kiting-metrics-v1',variant:'static',level:1,terminal:true,endReason:'completed',elapsedActiveSeconds:60,accepted:12,shots:12,hits:12,cancellations:0,totalDistanceMoved:12,rhythmOpportunities:11,rhythmCycles:11,histogram:[2,2,2,2,2,2]};
 const score=calculateKitingScore(base);expect(score.score).toBe(88);expect(score.activityGate).toBe(1);expect(calculateKitingScore({...base,rhythmCycles:0}).score).toBe(68);expect(calculateKitingScore({...base,histogram:[12,0,0,0,0,0]}).score).toBeLessThan(score.score);
 expect(calculateKitingScore({...base,accepted:1,shots:1,hits:1,rhythmOpportunities:0,rhythmCycles:0,histogram:[1,0,0,0,0,0]}).score).toBeLessThan(10);
 for(const patch of [{hits:Infinity},{rhythmCycles:12},{histogram:[0,0,0,0,0,0]},{shots:0},{level:11}])expect(calculateKitingScore({...base,...patch}).score).toBeNull();
});
