import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
import { calculatePrecisionScore } from '../../src/training/precision/score.js';
export function precisionRecord({id='precision-test',level=1,variant='single-static',hits=30,misses=0,date='2026-10-01T00:00:00.000Z'}={}){
 const histogram=Array.from({length:6},(_,i)=>Math.floor(hits/6)+(i<hits%6?1:0));
 const metrics={attemptId:id,origin:'official',modality:'precision',metricsVersion:'precision-metrics-v1',variant,level,terminal:true,endReason:'completed',elapsedActiveSeconds:60,hits,misses,clicksEligible:hits+misses,accuracy:hits+misses?hits/(hits+misses):null,histogram};
 return createAttemptRecord(metrics,calculatePrecisionScore(metrics),{completedAt:date});
}
