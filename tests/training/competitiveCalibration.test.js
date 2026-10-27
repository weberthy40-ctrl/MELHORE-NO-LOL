import { it,expect } from 'vitest';
import { LOL_UNITS_PER_WORLD,toWorld,TRAINING_PLAYER_RADIUS } from '../../src/training/dodge/referenceScale.js';
import { VARIANTS,PLAYER_RADIUS } from '../../src/training/dodge/projectiles.js';
import { difficultyFor } from '../../src/training/dodge/difficulty.js';
import { hasEscape } from '../../src/training/dodge/fairness.js';
import { createTechnicalDodge } from '../../src/training/dodge/technicalDodge.js';
import { createRandom } from '../../src/core/random.js';
import { createKitingPractice } from '../../src/training/kiting/practice.js';
import { createKitingAttempt } from '../../src/training/kiting/attempt.js';
import { kitingDifficulty } from '../../src/training/kiting/difficulty.js';
import { createSession } from '../../src/training/session.js';
import { createKitingRecord } from '../../src/persistence/kitingRecord.js';
import { calculateKitingScore } from '../../src/training/kiting/score.js';
import { calculateKitingProgress } from '../../src/progression/kitingProgress.js';
import { precisionRecord } from '../fixtures/precisionRecord.js';
import { createPrecisionRecord } from '../../src/persistence/precisionRecord.js';
import { calculatePrecisionProgress } from '../../src/progression/precisionProgress.js';
import { createPrecisionPractice } from '../../src/training/precision/practice.js';
import { precisionDifficulty } from '../../src/training/precision/difficulty.js';
const zero={x:0,z:0};
it('uses the documented scale in actual bolt collision, player movement and player radius',()=>{
 expect(LOL_UNITS_PER_WORLD).toBe(100);expect(VARIANTS.arcane_bolt.radius).toBe(toWorld(60));expect(VARIANTS.arcane_bolt.speed).toBe(toWorld(2000));expect(PLAYER_RADIUS).toBe(TRAINING_PLAYER_RADIUS);expect(PLAYER_RADIUS).toBe(toWorld(65));
 for(let level=1;level<=10;level++)expect(difficultyFor(level).playerSpeed*LOL_UNITS_PER_WORLD).toBe(580);
 expect(hasEscape(zero,[],{playerSpeed:NaN})).toBe(false);
});
it('makes sustained circular movement substantially less effective in the advanced tier with bounded hazards',()=>{
 function run(level){const config=difficultyFor(level),g=createTechnicalDodge({level,rng:createRandom(43)});let previous={x:5,z:0};for(let i=1;i<=3000;i++){const angle=i*.02*config.playerSpeed/5,current={x:5*Math.cos(angle),z:5*Math.sin(angle)};g.update(.02,previous,current);previous=current;}const s=g.snapshot();g.dispose();return s;}
 const low=run(1),high=run(20);expect(high.shots).toBeGreaterThan(low.shots*1.5);expect(high.impacts).toBeGreaterThan(low.impacts+10);expect(high.peak).toBeLessThanOrEqual(20);
});
it('keeps combat-v3 saves readable and never combines three old and new sessions into one rating sample',()=>{
 const session=createSession({countdown:0,timeLimit:60}),p=createKitingPractice({variant:'combat',level:4,damageEnabled:false,rng:createRandom(9)}),a=createKitingAttempt({session,practice:p,variant:'combat',level:4});session.start();p.start();for(let i=0;i<601;i++){session.update(.1);p.update(.1);a.evaluate();}const metrics=a.snapshot();
 const records=[];for(const version of [3,3,3,4,4,4]){const id=`combat-${records.length}`,m={...metrics,attemptId:id,config:kitingDifficulty(4,'combat',{combatVersion:version})};records.push(createKitingRecord(m,calculateKitingScore(m)));}
 const partial=calculateKitingProgress(records.slice(0,5));expect(partial.total).toBe(5);expect(partial.rating.referenceConfig).toBe('kiting-combat-v3');expect(partial.rating.evidenceByLevel[3].count).toBe(3);
 const current=calculateKitingProgress(records);expect(current.rating.referenceConfig).toBe('kiting-combat-v4');expect(current.rating.evidenceByLevel[3].count).toBe(3);
});
it('separates precision sequences for rating and increases priority frequency in the advanced tier',()=>{
 const records=[];for(const version of [3,3,3,4,4,4]){const r=precisionRecord({variant:'mixed',id:`precision-${records.length}`}),m={...r.metrics,sequenceVersion:`clear-group-v${version}`};records.push(createPrecisionRecord(m,r.score));}
 expect(calculatePrecisionProgress(records.slice(0,5)).rating.referenceConfig).toBeNull();const current=calculatePrecisionProgress(records);expect(current.rating.referenceConfig).toBe('clear-group-v4');expect(current.rating.evidenceByLevel[0].count).toBe(3);
 const p=createPrecisionPractice({...precisionDifficulty(10,'mixed'),rng:createRandom(17)});p.start();expect(p.snapshot().priority).toBe(false);for(const t of p.snapshot().targets)p.hit(t.id);expect(p.snapshot().priority).toBe(true);expect(p.snapshot().targets).toHaveLength(10);
});
it('keeps earlier dodge results and uses three independent samples for the new dodge calibration',async()=>{
 const {recordFixture}=await import('../fixtures/record.js'),{createAttemptRecord}=await import('../../src/persistence/attemptRecord.js'),{calculateDodgeProgress}=await import('../../src/progression/dodgeProgress.js');const records=[];
 for(const version of [null,null,null,'competitive-v4','competitive-v4','competitive-v4']){const r=recordFixture(`dodge-${records.length}`),metrics={...r.metrics,...(version?{rulesetVersion:version}:{})};records.push(createAttemptRecord(metrics,r.score));}
 expect(calculateDodgeProgress(records.slice(0,5)).rating.referenceConfig).toBeNull();const current=calculateDodgeProgress(records);expect(current.rating.referenceConfig).toBe('competitive-v4');expect(current.rating.evidenceByLevel[0].count).toBe(3);expect(current.total).toBe(6);
});
