import { it,expect } from 'vitest';
import { estimateDpi,scoreDpiTrial,compareDpiCandidates } from '../../src/tools/mouse/calibration.js';
import { createPrecisionPractice } from '../../src/training/precision/practice.js';
import { precisionDifficulty } from '../../src/training/precision/difficulty.js';
import { createReflexExercise } from '../../src/training/reflex/exercise.js';
import { createReflexAttempt } from '../../src/training/reflex/attempt.js';
import { createSession } from '../../src/training/session.js';
import { calculateReflexScore } from '../../src/training/reflex/score.js';
import { createAttemptRecord,validateAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { createRandom } from '../../src/core/random.js';
it('estimates counts per inch from repeated physical passes and rejects reversals or unsupported input',()=>{
 const sample={netX:3150,pathX:3150,pathY:20,raw:true};expect(estimateDpi([sample,sample,sample],10)).toMatchObject({dpi:800,stable:true,samples:3});
 expect(estimateDpi([sample,sample,{...sample,netX:3800,pathX:3800}],10).stable).toBe(false);
 for(const bad of [{...sample,raw:false},{...sample,netX:2000},{...sample,pathY:1600}])expect(()=>estimateDpi([bad,sample,sample],10)).toThrow();expect(()=>estimateDpi([sample],10)).toThrow();expect(()=>estimateDpi([sample,sample,sample],0)).toThrow();
});
it('recommends only repeated settings with equal conditions, using actual target geometry and an error penalty',()=>{
 const base={dpi:800,lolSpeed:50,width:900,height:400,dpr:1,times:Array(10).fill(400),distances:Array(10).fill(200),errors:0};
 expect(scoreDpiTrial({...base,times:[9000,...Array(9).fill(400)]}).score).toBe(scoreDpiTrial(base).score);
 expect(scoreDpiTrial({...base,errors:3}).score).toBeLessThan(scoreDpiTrial(base).score);
 const rows=[...Array.from({length:3},()=>({...base})),...Array.from({length:3},()=>({...base,dpi:1200,times:Array(10).fill(300)}))];
 expect(compareDpiCandidates(rows)).toMatchObject({status:'recommended',best:{dpi:1200,count:3}});expect(compareDpiCandidates(rows.slice(2))).toMatchObject({status:'collecting',best:null});
 expect(compareDpiCandidates(rows.map((r,i)=>i===0?{...r,dpr:2}:r)).status).toBe('different-conditions');expect(compareDpiCandidates(rows.map((r,i)=>i===0?{...r,lolSpeed:60}:r)).status).toBe('different-conditions');expect(compareDpiCandidates(rows.map(r=>({...r,times:base.times}))).status).toBe('tie');
});
it('expires slow precision targets without inventing clicks and applies a faster tenth level',()=>{
 const p=createPrecisionPractice({...precisionDifficulty(10,'single-moving'),rng:createRandom(4)});p.start();const id=p.snapshot().targets[0].id;for(let i=0;i<7;i++)p.update(.1);
 expect(p.snapshot()).toMatchObject({expired:1,hits:0,misses:0,clicksEligible:0});expect(p.snapshot().targets[0].id).not.toBe(id);expect(p.hit(id)).toBe(false);
 expect(precisionDifficulty(10,'single-moving').speed).toBeGreaterThan(10);expect(precisionDifficulty(10,'single-moving').radius).toBeGreaterThanOrEqual(.45);p.dispose();
});
it('runs mixed cues, inhibitory rounds and exact timing through a savable official session',()=>{
 let clock=0;const session=createSession({countdown:0,timeLimit:60}),exercise=createReflexExercise({variant:'mixed',level:10,technical:false,rng:createRandom(2),now:()=>clock,isRunning:()=>session.snapshot().state==='running'}),attempt=createReflexAttempt({session,exercise});
 exercise.start();session.start();exercise.setRunning(true);let presentedAt=0;
 for(let frame=0;frame<6001;frame++){
  clock+=10;session.update(.01);exercise.update(.01);let s=exercise.snapshot();if(s.phase==='cue-pending'){exercise.present();presentedAt=clock;s=exercise.snapshot();}
  if(s.phase==='cue-visible'&&s.cue.answer&&clock-presentedAt>=150)exercise.respond(s.cue.answer,clock);attempt.evaluate();
 }
 const metrics=attempt.snapshot();expect(metrics.summary.inhibited).toBeGreaterThan(0);expect(metrics.summary.wrong).toBe(0);expect(new Set(metrics.rounds.map(r=>r.cue)).size).toBeGreaterThanOrEqual(10);expect(metrics.summary.meanMs).toBe(150);expect(validateAttemptRecord(createAttemptRecord(metrics,calculateReflexScore(metrics)))).toBeTruthy();exercise.dispose();session.dispose();
});
