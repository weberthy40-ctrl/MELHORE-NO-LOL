import { it,expect } from 'vitest';
import { pointsForAttempt,createSkillRating,rankForPoints,RANKS,RATING_VERSION,overallSkillRating } from '../../src/progression/skillRating.js';
import { modernDodge } from '../fixtures/modernDodge.js';
import { recordFixture } from '../fixtures/record.js';
import { createReflexExercise } from '../../src/training/reflex/exercise.js';
import { createReflexAttempt } from '../../src/training/reflex/attempt.js';
import { createSession } from '../../src/training/session.js';
import { calculateReflexScore } from '../../src/training/reflex/score.js';
import { createReflexRecord } from '../../src/persistence/reflexRecord.js';
import { createRandom } from '../../src/core/random.js';
import { createBackup,parseBackup } from '../../src/persistence/backup.js';

// Drive the official engine and presentation clock; scores are never overridden.
function completedReflex({variant='integrated',level=10,presentationLimit=Infinity}={}){
 let clock=0,presentedAt=0,presentations=0;
 const session=createSession({countdown:0,timeLimit:60});
 const exercise=createReflexExercise({variant,level,technical:false,now:()=>clock,rng:createRandom(42),isRunning:()=>session.snapshot().state==='running'});
 const attempt=createReflexAttempt({session,exercise});
 session.start();exercise.start();exercise.setRunning(true);
 for(let step=0;step<601&&!attempt.snapshot();step++){
  session.update(.1);clock+=100;exercise.update(.1);let state=exercise.snapshot();
  if(state.phase==='cue-pending'&&presentations<presentationLimit){exercise.present();presentations++;presentedAt=clock;state=exercise.snapshot();}
  if(state.phase==='cue-visible'&&state.cue.answer!==null&&clock-presentedAt>=100)exercise.respond(state.cue.answer);
  attempt.evaluate();
 }
 const metrics=attempt.snapshot(),record=createReflexRecord(metrics,calculateReflexScore(metrics));
 exercise.dispose();session.dispose();return record;
}
it('applies every rank boundary and keeps the professional title within the trainer scale',()=>{
 for(const [index,rank]of RANKS.entries()){expect(rankForPoints(rank.minimum).id).toBe(rank.id);if(index)expect(rankForPoints(rank.minimum-1).id).toBe(RANKS[index-1].id);}expect(rankForPoints(400).name).toBe('Ferro');expect(rankForPoints(10000)).toMatchObject({name:'Profissional',next:null,progress:1});for(const n of [-1,10001,NaN])expect(()=>rankForPoints(n)).toThrow();
});
it('does not accumulate XP from repeated easy rounds and rewards demonstrated difficulty',()=>{
 const easy=modernDodge(),hard=modernDodge({level:20}),rating=createSkillRating('dodge');expect(pointsForAttempt(easy)).toBe(600);expect(pointsForAttempt(hard)).toBe(10000);
 for(let n=0;n<50;n++)rating.add(modernDodge({id:`easy-${n}`}));expect(rating.snapshot()).toMatchObject({points:600,samples:20,provisional:false});
 expect(pointsForAttempt(modernDodge({level:20,elapsed:3,hits:3,resolved:3}))).toBeLessThan(100);expect(pointsForAttempt(modernDodge({level:20,elapsed:60,hits:2}))).toBeLessThan(pointsForAttempt(hard));
});
it('uses the latest twenty records independently of scan order, with no duplicate votes',()=>{
 const records=Array.from({length:25},(_,n)=>modernDodge({id:`r-${n}`,level:n<5?1:20,date:`2026-10-${String(n+1).padStart(2,'0')}T12:00:00.000Z`})),a=createSkillRating('dodge'),b=createSkillRating('dodge');for(const r of records)a.add(r);for(const r of records.toReversed())b.add(r);a.add(records.at(-1));expect(a.snapshot()).toEqual(b.snapshot());expect(a.snapshot()).toMatchObject({points:10000,samples:20});
});
it('reads historical scores without rewriting them and never ranks invalid records',()=>{
 const old=recordFixture(),before=JSON.stringify(old),rating=createSkillRating('dodge');rating.add(old);expect(rating.snapshot()).toMatchObject({samples:1,provisional:true});expect(JSON.stringify(old)).toBe(before);rating.add({...old,attemptId:'bad',level:999});expect(rating.snapshot().samples).toBe(1);expect(pointsForAttempt(modernDodge({level:10,rulesetVersion:'dodge-v7'}))).toBeLessThan(6000);
});
it('averages covered skills equally and makes incomplete coverage explicit',()=>{
 expect(overallSkillRating([])).toMatchObject({points:null,covered:0,partial:true});expect(overallSkillRating([{points:4000,provisional:false}])).toMatchObject({points:4000,covered:1,partial:true,provisional:true});expect(overallSkillRating([1000,3000,5000,7000].map(points=>({points,provisional:false})))).toMatchObject({points:4000,covered:4,partial:false,provisional:false});
});
it('calculates ranking points from valid precision, kiting and reflex histories',async()=>{
 const {precisionRecord}=await import('../fixtures/precisionRecord.js'),{kitingRecord}=await import('../fixtures/kitingRecord.js'),{reflexRecord}=await import('../fixtures/reflexRecord.js');
 for(const record of [precisionRecord(),kitingRecord(),reflexRecord()]){expect(pointsForAttempt(record)).toBeGreaterThan(0);const rating=createSkillRating(record.modality);rating.add(record);expect(rating.snapshot()).toMatchObject({samples:1,provisional:true});expect(rating.snapshot().points).toBeLessThanOrEqual(600);}
});
it('gives current integrated and legacy mixed challenges full context while retaining the simple-drill discount',()=>{
 for(const level of [1,10]){
  const integrated=completedReflex({level}),mixed=completedReflex({variant:'mixed',level}),simple=completedReflex({variant:'simple',level});
  expect(integrated.metrics.summary.presented).toBeGreaterThanOrEqual(12);
  expect(integrated.metrics.rounds.some(round=>round.cue==='MouseGreen')).toBe(true);
  expect(integrated.metrics.rounds.some(round=>round.status==='inhibited')).toBe(true);
  expect(integrated.score.score).toBeGreaterThanOrEqual(90);
  expect(mixed.score.score).toBeGreaterThanOrEqual(90);expect(simple.score.score).toBeGreaterThanOrEqual(90);
  const maximum=level===1?600:10000;
  expect(pointsForAttempt(integrated)).toBe(maximum);expect(pointsForAttempt(mixed)).toBe(maximum);
  expect(pointsForAttempt(simple)).toBe(maximum*.7);
 }
});
it('keeps the integrated evidence gate and preserves persisted scores and backups when deriving v2 ratings',()=>{
 const full=completedReflex(),sparse=completedReflex({presentationLimit:3}),before=JSON.stringify(full),rating=createSkillRating('reflex');
 expect(sparse.metrics.summary.presented).toBe(3);expect(sparse.score.score).toBe(88);
 expect(pointsForAttempt(sparse)).toBe(2444);
 rating.add(full);rating.add(full);
 expect(RATING_VERSION).toBe('trainer-rating-v2');
 expect(rating.snapshot()).toMatchObject({version:RATING_VERSION,points:10000,samples:1,provisional:true});
 expect(overallSkillRating([rating.snapshot()])).toMatchObject({version:RATING_VERSION,points:10000,covered:1,partial:true});
 expect(JSON.stringify(full)).toBe(before);
 expect(parseBackup(createBackup({attempts:[full]})).attempts).toEqual([full]);
});
