import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { calculateKitingScore } from '../../src/training/kiting/score.js';
import { kitingDifficulty } from '../../src/training/kiting/difficulty.js';
export function kitingRecord({id='kiting-test',variant='static',level=1,hits=30,cycles=Math.max(0,hits-1),date='2026-10-01T00:00:00.000Z',score}={}){
 const histogram=Array.from({length:6},(_,i)=>Math.floor(hits/6)+(i<hits%6?1:0)),metrics={attemptId:id,origin:'official',modality:'kiting',metricsVersion:'kiting-metrics-v1',variant,level,terminal:true,endReason:'completed',elapsedActiveSeconds:60,accepted:hits,shots:hits,hits,cancellations:0,totalDistanceMoved:cycles,rhythmOpportunities:Math.max(0,hits-1),rhythmCycles:cycles,histogram,spacing:null,config:kitingDifficulty(level,variant)};
 const calculated=structuredClone(calculateKitingScore(metrics));if(score!==undefined){calculated.score=score;calculated.components.forEach(c=>{c.index=score/100;c.contribution=c.weight*c.index;});}
 return createAttemptRecord(metrics,calculated,{completedAt:date});
}
