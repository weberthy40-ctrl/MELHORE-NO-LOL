import { it,expect } from 'vitest';
import { createRandom } from '../../src/core/random.js';
import { createKitingPractice } from '../../src/training/kiting/practice.js';
import { kitingDifficulty } from '../../src/training/kiting/difficulty.js';
import { createEnemyCombat } from '../../src/training/kiting/enemyCombat.js';
import { createKitingAttempt } from '../../src/training/kiting/attempt.js';
import { calculateKitingScore } from '../../src/training/kiting/score.js';
import { createKitingRecord,validateKitingRecord } from '../../src/persistence/kitingRecord.js';
import { createSession } from '../../src/training/session.js';
import { createPrecisionPractice } from '../../src/training/precision/practice.js';
import { precisionDifficulty } from '../../src/training/precision/difficulty.js';
import { difficultyFor } from '../../src/training/dodge/difficulty.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { parseBackup,createBackup } from '../../src/persistence/backup.js';
const zero={x:0,z:0};const tick=(p,n)=>{for(let i=0;i<Math.round(n*100);i++)p.update(.01);};
it('scales player movement, attack cadence and enemies while keeping continuous running faster than pursuit',()=>{
 for(let level=1;level<=10;level++){const c=kitingDifficulty(level,'combat');expect(c.targetSpeed).toBeLessThan(c.playerSpeed);expect(c.playerSpeed-c.targetSpeed).toBeLessThan(1);expect(c.windupDuration).toBeLessThan(c.attackInterval);if(level>1){const prev=kitingDifficulty(level-1,'combat');expect(c.playerSpeed).toBeGreaterThan(prev.playerSpeed);expect(c.attackInterval).toBeLessThan(prev.attackInterval);}}
});
it('melee attacks have windup and can be escaped; stationary play loses health and eventually dies once',()=>{
 const c=kitingDifficulty(1,'combat'),e={id:'m',enemyKind:'melee',position:{x:0,z:1.3}},combat=createEnemyCombat({config:c});combat.update(.01,[e],zero,zero);expect(e.attackPhase).toBe('windup');combat.update(c.enemyWindup-.01,[e],zero,zero);expect(combat.snapshot().health).toBe(100);combat.update(.1,[e],zero,{x:5,z:0});expect(combat.snapshot().health).toBe(100);
 const p=createKitingPractice({variant:'combat',rng:createRandom(4)});p.start();tick(p,30);expect(p.snapshot()).toMatchObject({defeated:true,health:0,damageTaken:100});const ended=p.snapshot();tick(p,10);expect(p.snapshot()).toEqual(ended);expect(p.click()).toBe(false);
});
it('legacy ranged shots retain their announced aim while combat-v4 predicts constant movement',()=>{
 function run(move,combatVersion=4){const c=kitingDifficulty(5,'combat',{combatVersion}),combat=createEnemyCombat({config:c}),e={id:'r',enemyKind:'ranged',position:{x:0,z:-4.6}};let position=zero;for(let i=0;i<140;i++){const next=move&&i>60?{x:Math.min(8,(i-60)*.07),z:0}:zero;combat.update(.01,[e],position,next);position=next;}return combat.snapshot();}
 expect(run(false).damageTaken).toBeGreaterThan(0);expect(run(true,3).damageTaken).toBe(0);expect(run(true,4).damageTaken).toBeGreaterThan(0);
});
it('pauses damage, attacks and missiles with the practice and introduces both kinds into combat waves',()=>{
 let running=true;const p=createKitingPractice({variant:'combat',level:7,damageEnabled:false,rng:createRandom(15),isRunning:()=>running});p.start();tick(p,25);expect(new Set(p.snapshot().targets.map(e=>e.enemyKind)).size).toBe(2);expect(p.snapshot().enemyShots.length).toBeLessThanOrEqual(32);running=false;const frozen=p.snapshot();tick(p,10);expect(p.snapshot()).toEqual(frozen);
});
it('saves a defeat, round-trips it through backup, and rejects inconsistent health without changing legacy records',()=>{
 const session=createSession({countdown:0,timeLimit:60}),p=createKitingPractice({variant:'combat',level:5,rng:createRandom(12),isRunning:()=>session.snapshot().state==='running'}),a=createKitingAttempt({session,practice:p,variant:'combat',level:5});session.start();p.start();for(let i=0;i<6000&&!a.snapshot();i++){session.update(.01);p.update(.01);a.evaluate();}const m=a.snapshot();expect(m.endReason).toBe('defeat');expect(m.elapsedActiveSeconds).toBeLessThan(60);const record=createKitingRecord(m,calculateKitingScore(m));expect(parseBackup(createBackup({attempts:[record]})).attempts[0].endReason).toBe('defeat');expect(()=>validateKitingRecord({...record,metrics:{...record.metrics,health:10}})).toThrow();
});
it('completes sixty active seconds without death when a diagnostic disables incoming damage',()=>{
 const session=createSession({countdown:0,timeLimit:60}),p=createKitingPractice({variant:'combat',level:10,damageEnabled:false,rng:createRandom(16)}),a=createKitingAttempt({session,practice:p,variant:'combat',level:10});session.start();p.start();for(let i=0;i<601;i++){session.update(.1);p.update(.1);a.evaluate();}const m=a.snapshot();expect(m).toMatchObject({endReason:'completed',health:100,defeated:false});expect(createKitingRecord(m,calculateKitingScore(m)).endReason).toBe('completed');
});
it('mixes free and ordered groups, penalizes a wrong-order click once, and never removes the wrong target',()=>{
 const p=createPrecisionPractice({...precisionDifficulty(5,'mixed'),rng:createRandom(42)});p.start();for(let group=0;group<2;group++){expect(p.snapshot().priority).toBe(false);for(const t of p.snapshot().targets)p.hit(t.id);}const s=p.snapshot();expect(s.priority).toBe(true);const wrong=s.targets.at(-1).id;expect(p.hit(wrong)).toBe(false);expect(p.snapshot()).toMatchObject({misses:1,orderErrors:1,groupRemaining:s.groupRemaining});expect(p.snapshot().targets.map(t=>t.id)).toEqual(s.targets.map(t=>t.id));for(const t of s.targets)p.hit(t.id);expect(p.snapshot()).toMatchObject({priority:false,groupsCompleted:3});
});
it('adds four to ten targets with bounded non-linear movement and no time-based group change',()=>{
 for(const level of [1,10]){const p=createPrecisionPractice({...precisionDifficulty(level,'mixed'),rng:createRandom(25)});p.start();const motions=new Set();for(let group=0;group<4;group++){const first=p.snapshot();expect(first.targets).toHaveLength(level===1?4:10);for(let i=0;i<400;i++){p.update(.01);for(const t of p.snapshot().targets){motions.add(t.motion);expect(t.position.x).toBeGreaterThanOrEqual(t.minX-1e-8);expect(t.position.x).toBeLessThanOrEqual(t.maxX+1e-8);expect(t.position.z).toBeGreaterThanOrEqual(t.minZ-1e-8);expect(t.position.z).toBeLessThanOrEqual(t.maxZ+1e-8);}}expect(p.snapshot().pattern).toBe(first.pattern);for(const t of p.snapshot().targets)p.hit(t.id);}expect(motions.has('orbit')).toBe(true);expect(motions.has('zigzag')).toBe(true);}
});
it('removes bolt prediction in the final tier while preserving warning durations and increasing pressure',()=>{
 expect(difficultyFor(1).pathHint).toBe('full');expect(difficultyFor(5).pathHint).toBe('off');expect(difficultyFor(10).pathHint).toBe('off');expect(difficultyFor(10).capacity).toBe(17);expect(difficultyFor(10).comboSize).toBe(3);const seen=new Set(),game=createTechnicalDodge({level:10,rng:createRandom(43)});for(let i=0;i<800;i++){game.update(.05,zero,zero);for(const p of game.snapshot().projectiles){seen.add(p.variant);expect(p.pathHint).toBe('off');expect(p.windup).toBeGreaterThanOrEqual(p.shape==='bolt'?.19:.78);if(p.variant==='arcane_bolt')expect(p.speed).toBeLessThanOrEqual(26);}}expect(seen.size).toBe(8);
});
