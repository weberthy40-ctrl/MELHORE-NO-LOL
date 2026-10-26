import { it,expect } from 'vitest';
import { createRandom } from '../../src/core/random.js';
import { createKitingPractice } from '../../src/training/kiting/practice.js';
import { createKitingAttempt } from '../../src/training/kiting/attempt.js';
import { calculateKitingScore } from '../../src/training/kiting/score.js';
import { createKitingRecord } from '../../src/persistence/kitingRecord.js';
import { createPrecisionPractice } from '../../src/training/precision/practice.js';
import { precisionDifficulty } from '../../src/training/precision/difficulty.js';
import { createPrecisionAttempt } from '../../src/training/precision/attempt.js';
import { calculatePrecisionScore } from '../../src/training/precision/score.js';
import { createPrecisionRecord } from '../../src/persistence/precisionRecord.js';
import { createReflexExercise,createCueBag } from '../../src/training/reflex/exercise.js';
import { REFLEX_VARIANTS } from '../../src/training/reflex/difficulty.js';
import { createReflexAttempt } from '../../src/training/reflex/attempt.js';
import { calculateReflexScore } from '../../src/training/reflex/score.js';
import { createReflexRecord } from '../../src/persistence/reflexRecord.js';
import { createSession } from '../../src/training/session.js';
import { createMovement,DODGE_MOVEMENT_SPEED } from '../../src/training/movement.js';
import { chooseProjectileOrigin } from '../../src/training/dodge/technicalDodge.js';
import { createProjectiles } from '../../src/training/dodge/projectiles.js';
import { DEFAULT_PREFERENCES,validatePreferences } from '../../src/settings/preferences.js';
const advance=(practice,seconds)=>{for(let i=0;i<Math.round(seconds*100);i++)practice.update(.01);};
it('subtracts real HP, removes defeated enemies and replaces them sequentially at level one',()=>{
 const p=createKitingPractice({variant:'waves',level:1,rng:createRandom(42)});p.start();expect(p.snapshot().targets).toHaveLength(1);
 p.click({x:12,z:18});advance(p,.1);p.moveCommand();expect(p.snapshot()).toMatchObject({cancellations:1,hits:0});expect(p.snapshot().target.health).toBe(3);advance(p,.2);
 for(let hit=1;hit<=3;hit++){expect(p.click({x:12,z:18})).toBe(true);advance(p,.29);expect(p.snapshot().hits).toBe(hit);if(hit<3){expect(p.snapshot().target.health).toBe(3-hit);advance(p,.57);}}
 expect(p.snapshot()).toMatchObject({kills:1,targets:[]});advance(p,.46);expect(p.snapshot().targets).toHaveLength(1);expect(p.snapshot().target.health).toBe(3);advance(p,10);expect(p.snapshot().targets).toHaveLength(1);
});
it('overlaps waves before the current enemy dies, scales pressure and freezes on pause',()=>{
 let running=true;const p=createKitingPractice({variant:'waves',level:3,isRunning:()=>running,rng:createRandom(4)});p.start();
 for(let i=0;i<3;i++){p.click();advance(p,.81);}expect(p.snapshot()).toMatchObject({kills:0,hits:3});expect(p.snapshot().targets).toHaveLength(2);
 running=false;const frozen=p.snapshot();advance(p,10);expect(p.snapshot()).toEqual(frozen);
 const high=createKitingPractice({variant:'waves',level:10,rng:createRandom(19),playerPosition:()=>({x:12,z:16})});high.start();advance(high,30);expect(high.snapshot().targets).toHaveLength(6);expect(high.snapshot().config.targetSpeed).toBeGreaterThan(p.snapshot().config.targetSpeed);
 const before=new Map(high.snapshot().targets.map(t=>[t.id,t.position]));high.update(.01);for(const t of high.snapshot().targets){const prev=before.get(t.id);if(prev)expect(Math.hypot(t.position.x-prev.x,t.position.z-prev.z)).toBeLessThanOrEqual(high.snapshot().config.targetSpeed*.01+1e-7);}
});
it('clears each precision group before choosing another pattern and retains overdue targets until hit',()=>{
 for(const level of [1,10]){const config=precisionDifficulty(level,'mixed'),p=createPrecisionPractice({...config,rng:createRandom(53)});expect(p.start()).toBe(true);const seen=new Set();
  for(let group=0;group<8;group++){const initial=p.snapshot();seen.add(initial.pattern);expect(initial.targets.length).toBe(initial.pattern.startsWith('multi')?(level===1?2:5):1);for(let i=0;i<800;i++)p.update(.01);expect(p.snapshot().targets.map(t=>t.id)).toEqual(initial.targets.map(t=>t.id));p.miss();expect(p.snapshot().pattern).toBe(initial.pattern);
   for(const [i,target]of initial.targets.entries()){expect(p.hit(target.id)).toBe(true);if(i<initial.targets.length-1){expect(p.snapshot().pattern).toBe(initial.pattern);expect(p.snapshot().targets).toHaveLength(initial.targets.length-i-1);}}
  }
  expect(seen.size).toBe(4);expect(p.snapshot().patternsSeen).toHaveLength(4);expect(p.snapshot().expired).toBeGreaterThan(0);expect(p.snapshot().misses).toBe(8);expect(p.snapshot().groupsCompleted).toBe(8);
 }
});
it('uses bounded Flash, cancels walking and persists configurable, distinct keys with legacy defaults',()=>{
 const m=createMovement({speed:DODGE_MOVEMENT_SPEED});m.moveTo({x:0,z:18});m.update(.1);expect(m.snapshot().position.z).toBeCloseTo(.8);expect(m.blink({x:100,z:.8})).toBe(true);expect(m.snapshot().position.x).toBeCloseTo(4);expect(m.snapshot().target).toBeNull();m.blink({x:100,z:.8},100);expect(m.snapshot().position.x).toBe(13);expect(m.blink({x:100,z:.8})).toBe(false);
 const legacy={...DEFAULT_PREFERENCES};delete legacy.stopKey;delete legacy.flashKey;expect(validatePreferences(legacy)).toMatchObject({stopKey:'KeyS',flashKey:'KeyD'});expect(validatePreferences({...legacy,stopKey:'KeyX',flashKey:'KeyF'})).toMatchObject({stopKey:'KeyX',flashKey:'KeyF'});expect(()=>validatePreferences({...legacy,stopKey:'KeyF',flashKey:'KeyF'})).toThrow();
});
it('moves new projectile origins with the player near map edges without shifting a projectile already launched',()=>{
 const a=chooseProjectileOrigin({x:0,z:0},()=>0,{followPlayer:true}),b=chooseProjectileOrigin({x:12,z:18},()=>0,{followPlayer:true});expect(b).toEqual({x:a.x+12,z:a.z+18});
 const p=createProjectiles();p.spawn({origin:b,direction:{x:0,z:-1}});p.update(.01,{x:12,z:18},{x:12,z:18});expect(p.snapshot()).toHaveLength(1);expect(p.snapshot()[0].origin).toEqual(b);expect(p.snapshot()[0].position.z).toBeCloseTo(b.z-.14);
});
it('saves real sixty-second attempts for all three unified modes using their own references',()=>{
 const session=createSession({countdown:0,timeLimit:60}),p=createKitingPractice({variant:'waves',rng:createRandom(42)}),a=createKitingAttempt({session,practice:p,variant:'waves',level:1});p.start();session.start();
 for(let i=0;i<6001;i++){if(p.snapshot().phase==='ready')p.click();const before=session.snapshot().elapsed;session.update(.01);p.update(session.snapshot().elapsed-before);a.evaluate();}
 expect(createKitingRecord(a.snapshot(),calculateKitingScore(a.snapshot()))).toMatchObject({variant:'waves',metrics:{kills:expect.any(Number)}});expect(a.snapshot().kills).toBeGreaterThan(3);
 const ps=createSession({countdown:0,timeLimit:60}),pp=createPrecisionPractice({...precisionDifficulty(5,'mixed'),rng:createRandom(9),clock:()=>ps.snapshot().elapsed}),pa=createPrecisionAttempt({session:ps,practice:pp,level:5,variant:'mixed'});pp.start();ps.start();
 for(let i=0;i<6001;i++){const before=ps.snapshot().elapsed;ps.update(.01);pp.update(ps.snapshot().elapsed-before);const target=pp.snapshot().targets[0];if(target&&i%40===0)pp.hit(target.id);pa.evaluate();}
 expect(createPrecisionRecord(pa.snapshot(),calculatePrecisionScore(pa.snapshot()))).toMatchObject({variant:'mixed',metrics:{patternsSeen:expect.arrayContaining(['single-static','single-moving','multi-static','multi-moving'])}});
 let clock=0;const rs=createSession({countdown:0,timeLimit:60}),re=createReflexExercise({variant:'integrated',level:5,technical:false,rng:createRandom(8),now:()=>clock}),ra=createReflexAttempt({session:rs,exercise:re});rs.start();re.start();re.setRunning(true);
 for(let i=0;i<6001;i++){clock+=10;rs.update(.01);re.update(.01);const s=re.snapshot();if(s.phase==='cue-pending')re.present();else if(s.phase==='cue-visible'&&s.cue.answer!==null)re.respond(s.cue.answer);ra.evaluate();}
 const record=createReflexRecord(ra.snapshot(),calculateReflexScore(ra.snapshot()));expect(record.variant).toBe('integrated');expect(record.metrics.summary.inhibited).toBeGreaterThan(0);expect(record.metrics.rounds.some(r=>r.cue==='MouseGreen')).toBe(true);
 const bag=createCueBag('integrated',createRandom(5));expect(bag).toEqual(expect.arrayContaining(['MouseGreen','MouseBlue','MouseStop','KeyQ','Space']));expect(bag.some(code=>code.startsWith('Arrow'))).toBe(false);expect(REFLEX_VARIANTS.integrated.keys.some(code=>code.startsWith('Arrow'))).toBe(false);
});
