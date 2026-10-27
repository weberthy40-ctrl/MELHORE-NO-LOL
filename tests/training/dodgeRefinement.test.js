import { it,expect } from 'vitest';
import { DODGE_ARENA,ARENA } from '../../src/game3d/spatial.js';
import { createMovement } from '../../src/training/movement.js';
import { difficultyFor } from '../../src/training/dodge/difficulty.js';
import { createPressureDirector } from '../../src/training/dodge/pressure.js';
import { createDodgeReplay } from '../../src/training/dodge/replay.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { createRandom } from '../../src/core/random.js';
const zero={x:0,z:0};
it('isolates the wider dodge arena and preserves consistent movement across all levels',()=>{
 expect(ARENA).toMatchObject({width:26,length:38});expect(DODGE_ARENA).toMatchObject({width:32.4,length:25.2});const old=createMovement(),dodge=createMovement({arena:DODGE_ARENA,speed:difficultyFor(10).playerSpeed});expect(old.moveTo({x:15,z:12})).toBe(false);expect(dodge.moveTo({x:15,z:12})).toBe(true);for(let i=0;i<10;i++)dodge.update(.1);expect(Math.hypot(dodge.snapshot().position.x,dodge.snapshot().position.z)).toBeCloseTo(5.8);for(let n=1;n<=10;n++)expect(difficultyFor(n).playerSpeed).toBe(5.8);
});
it('adapts only after enough resolved threats, respects cooldown and never changes fixed pressure',()=>{
 const fixed=createPressureDirector({intensity:1.8}),adaptive=createPressureDirector({intensity:1.8,adaptive:true});for(let i=0;i<80;i++)fixed.observe(true,i);expect(fixed.snapshot()).toMatchObject({current:1.8,adjustments:0});
 for(let i=0;i<7;i++)adaptive.observe(true,i);expect(adaptive.snapshot().adjustments).toBe(0);adaptive.observe(true,7);expect(adaptive.snapshot()).toMatchObject({current:1.61,adjustments:1});
 for(let i=0;i<8;i++)adaptive.observe(false,7+i*.1);expect(adaptive.snapshot().adjustments).toBe(1);adaptive.observe(false,13);expect(adaptive.snapshot().current).toBeCloseTo(1.49);
 for(let i=0;i<600;i++)adaptive.observe(false,20+i);expect(adaptive.snapshot().current).toBe(.75);for(let i=0;i<600;i++)adaptive.observe(true,700+i);expect(adaptive.snapshot().current).toBe(1.8);expect(()=>createPressureDirector({intensity:Infinity})).toThrow();
});
it('keeps the six-second replay bounded, immutable and independent of later capture and clear',()=>{
 const replay=createDodgeReplay();for(let i=0;i<=1000;i++){const snapshot={level:10,elapsed:i*.05,projectiles:Object.freeze([])};replay.capture(snapshot,zero,.2);replay.mark({time:i*.05,variant:'arcane_bolt',id:String(i)});}const saved=replay.snapshot();expect(saved.frames.length).toBeLessThanOrEqual(121);expect(saved.frames.at(-1).time-saved.frames[0].time).toBeLessThanOrEqual(6.000001);expect(saved.markers.length).toBeLessThanOrEqual(160);expect(saved.markers.every(m=>m.time>=saved.frames.at(-1).time-6)).toBe(true);expect(Object.isFrozen(saved.frames[0].player)).toBe(true);replay.clear();expect(replay.snapshot().frames).toHaveLength(0);expect(saved.frames.length).toBeGreaterThan(100);
});
it('emits distinct advanced patterns, bounds 180% pressure and freezes existing trajectories when paused',()=>{
 let running=true;const game=createTechnicalDodge({level:10,intensity:1.8,rng:createRandom(81),isRunning:()=>running});for(let i=0;i<1600;i++){const t=i*.025;game.update(.025,{x:4*Math.sin(t-.025),z:0},{x:4*Math.sin(t),z:0});expect(game.snapshot().projectiles.length).toBeLessThanOrEqual(20);}expect(game.snapshot().patterns).toEqual(expect.arrayContaining(['barrage','crossfire','ground']));expect(game.snapshot().pressure.current).toBe(1.8);running=false;const frozen=game.snapshot();game.update(10,zero,zero);expect(game.snapshot()).toEqual(frozen);game.dispose();
});
it('saves early defeats without fabricating consistency and preserves score-v1 history',async()=>{
 const {createEventBus}=await import('../../src/core/eventBus.js'),{createSession}=await import('../../src/training/session.js'),{createDodgeMode}=await import('../../src/training/dodge/mode.js'),{createDodgeTelemetry}=await import('../../src/training/dodge/telemetry.js'),{calculateDodgeScore}=await import('../../src/training/dodge/score.js'),{createAttemptRecord,validateAttemptRecord}=await import('../../src/persistence/attemptRecord.js');
 const events=createEventBus(),session=createSession({countdown:0,events}),mode=createDodgeMode({session,mode:'normal',level:10,events}),metrics=createDodgeTelemetry({session,mode:'normal',level:10,events});session.start();for(let hit=1;hit<=3;hit++){for(let i=0;i<8;i++){session.update(.1);metrics.step(.1,zero,zero);}events.emit('dodge:spawn',{attemptId:session.snapshot().id,id:`projectile-${hit}`});events.emit('dodge:impact',{attemptId:session.snapshot().id,id:`projectile-${hit}`,variant:'arcane_bolt'});metrics.step(0,zero,zero);}const m=metrics.snapshot(),score=calculateDodgeScore(m);expect(score).toMatchObject({status:'scored',consistencyAvailable:false,smallSample:true,scoringVersion:'dodge-score-v3'});expect(score.components.find(c=>c.name==='Consistência').contribution).toBe(0);expect(createAttemptRecord(m,score).endReason).toBe('defeat');const {recordFixture}=await import('../fixtures/record.js');const old=recordFixture('old-v1'),legacy={...old,score:{...old.score,scoringVersion:'dodge-score-v1'}};expect(validateAttemptRecord(legacy)).toBe(legacy);metrics.dispose();mode.dispose();session.dispose();
});
