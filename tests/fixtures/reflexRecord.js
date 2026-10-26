import { reflexDifficulty } from '../../src/training/reflex/difficulty.js';
import { summarizeReactions } from '../../src/training/reflex/exercise.js';
import { calculateReflexScore } from '../../src/training/reflex/score.js';
import { createAttemptRecord } from '../../src/persistence/attemptRecord.js';
export function reflexRecord({id='reflex-test',variant='simple',level=1,date='2026-10-01T00:00:00.000Z',score,status='correct',reactionMs=200}={}){
 const config=reflexDifficulty(level,variant),cues={simple:['Space'],choice:['KeyF','KeyJ'],inhibition:['go','noGo'],direction:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']}[variant],rounds=Array.from({length:8},(_,i)=>{const cue=cues[i%cues.length],noGo=cue==='noGo',actualStatus=noGo?'inhibited':status;return {index:i+1,cue,status:actualStatus,response:['correct','wrong'].includes(actualStatus)?cue==='go'?'KeyF':cue:null,reactionMs:['correct','wrong'].includes(actualStatus)?reactionMs:null,presented:true,delayMs:config.waitMin,responseWindow:config.responseWindow};}),metrics={attemptId:id,origin:'official',modality:'reflex',metricsVersion:'reflex-metrics-v1',variant,level,config,terminal:true,endReason:'completed',elapsedActiveSeconds:60,rounds,summary:summarizeReactions(rounds),extraAnticipations:0,partialRound:null};
 const calculated=structuredClone(calculateReflexScore(metrics));if(score!==undefined){calculated.score=score;calculated.components.forEach(c=>{c.index=score/100;c.contribution=c.weight*c.index;});}return createAttemptRecord(metrics,calculated,{completedAt:date});
}
