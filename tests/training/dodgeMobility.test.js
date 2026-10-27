import { it,expect } from 'vitest';
import { createMovement } from '../../src/training/movement.js';
import { createCameraController } from '../../src/game3d/cameraController.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { createRandom } from '../../src/core/random.js';
import { DODGE_ARENA } from '../../src/game3d/spatial.js';
import { calculateDodgeScore } from '../../src/training/dodge/score.js';
import { createAttemptRecord,validateAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { calculateDodgeProgress } from '../../src/progression/dodgeProgress.js';
import { recordFixture } from '../fixtures/record.js';
it('travels through a bounded dash, queues walking afterwards and permits stopping mid-dash',()=>{
 const m=createMovement({arena:DODGE_ARENA,speed:5.8});expect(m.dash({x:9,z:0})).toBe(true);expect(m.snapshot().position).toEqual({x:0,z:0});m.update(.085);expect(m.snapshot().position.x).toBeCloseTo(1.3);expect(m.dash({x:9,z:0})).toBe(false);m.moveTo({x:9,z:0});m.update(.1);expect(m.snapshot().position.x).toBeCloseTo(2.6+5.8*.015);expect(m.snapshot().dash).toBeNull();
 m.dash({x:9,z:0});m.update(.05);m.stop();const stopped=m.snapshot().position;m.update(.1);expect(m.snapshot().position).toEqual(stopped);
 const edge=createMovement({arena:DODGE_ARENA,position:{x:13.8,z:0}});edge.dash({x:30,z:0});edge.update(.1);edge.update(.1);expect(edge.snapshot().position.x).toBe(DODGE_ARENA.bounds.maxX);
});
it('smooths locked follow independently of frame subdivision and recenters immediately',()=>{
 const player={x:5,z:3},prefs={edgePanEnabled:true,edgePanSpeed:1},pan={x:0,z:0},a=createCameraController({followSmoothing:.055}),b=createCameraController({followSmoothing:.055});a.update(player,pan,.1,prefs);for(let i=0;i<10;i++)b.update(player,pan,.01,prefs);expect(a.snapshot().center.x).toBeCloseTo(b.snapshot().center.x,10);expect(a.snapshot().center.x).toBeLessThan(5);a.recenter(player);expect(a.snapshot().center).toEqual(player);a.toggle();a.update({x:10,z:3},pan,.1,prefs);expect(a.snapshot().center).toEqual(player);
});
it('guarantees readable bolt arrival time at maximum pressure and gives cages room and spacing',()=>{
 let player={x:0,z:0},game;const variants=new Set();let lastCage=-Infinity;game=createTechnicalDodge({level:20,intensity:1.8,rng:createRandom(848),events:{emit(type,event){if(type!=='dodge:spawn')return;const snapshot=game.snapshot(),p=snapshot.projectiles.find(p=>p.id===event.id);variants.add(p.variant);if(p.shape==='bolt'){const distance=Math.hypot(player.x-p.origin.x,player.z-p.origin.z);expect(p.windup+(distance-p.radius-.65)/p.speed).toBeGreaterThanOrEqual(.85);if(p.variant==='arcane_bolt')expect(p.speed).toBeLessThanOrEqual(26);}if(p.variant==='cage'){expect(p.radius).toBeGreaterThanOrEqual(4.5);expect(snapshot.elapsed-lastCage).toBeGreaterThanOrEqual(2.8-1e-8);lastCage=snapshot.elapsed;expect(snapshot.projectiles.filter(p=>p.variant==='cage').length).toBeLessThanOrEqual(2);}}}});
 for(let i=1;i<=2400;i++){const before=player;player={x:14*Math.sin(i*.01),z:11*Math.cos(i*.008)};game.update(.025,before,player);}expect(variants.size).toBe(9);game.dispose();
});
it('scores unlimited rounds separately, preserves old records and requires new calibration evidence',()=>{
 const old=recordFixture('old'),records=[];for(let n=1;n<=3;n++){const metrics={...old.metrics,attemptId:`new-${n}`,rulesetVersion:'dodge-v7',elapsedActiveSeconds:120,stationarySeconds:118,endReason:'completed',buckets:old.metrics.buckets.map((b,i)=>({...b,...(i?{end:120,stationarySeconds:89}:{})}))},score=calculateDodgeScore(metrics);expect(score.status).toBe('scored');expect(score.scoringVersion).toBe('dodge-score-v3');records.push(createAttemptRecord(metrics,score));expect(()=>validateAttemptRecord({...records.at(-1),endReason:'victory'})).toThrow();}
 expect(validateAttemptRecord(old)).toBe(old);expect(old.score.scoringVersion).toBe('dodge-score-v2');const progress=calculateDodgeProgress([old,...records]);expect(progress.rating.referenceConfig).toBe('dodge-v7');expect(progress.rating.evidenceByLevel[0]).toMatchObject({count:3,demonstrated:true});
});
